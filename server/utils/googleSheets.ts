import { google } from 'googleapis';

function getAuth() {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_SA_PRIVATE_KEY || '';
  const key = rawKey.replace(/\\n/g, '\n');
  if (!email || !key) {
    throw new Error('GOOGLE_SA_CLIENT_EMAIL / GOOGLE_SA_PRIVATE_KEY belum di-set di environment variables.');
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export function extractSheetId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

export function formatSheetTimestamp(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));
  return `${map.day}/${map.month}/${map.year} ${map.hour}:${map.minute}:${map.second}`;
}

export function toSheetDateFormat(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

// [nama panggilan (dipakai juga buat cari di nama lengkap portal), email]
const STUDENTS: [string, string][] = [
  ['Altaf', 'altafg402@gmail.com'],
  ['Agha', 'aghasamiyaari@gmail.com'],
  ['Kia', 'ashilahadzkiaafifa@gmail.com'],
  ['Emir', 'emir.ahmad09@gmail.com'],
  ['Aida', 'humaidahputriprasetyo.aida@gmail.com'],
  ['Aira', 'humairahputriprasetyo.aira@gmail.com'],
  ['Ian', 'sayaportofolio5@gmail.com'],
  ['Jenna', 'jenna.p.adila@gmail.com'],
  ['Lathima', 'lathimaq@gmail.com'],
  ['Al', 'malfaruq0105@gmail.com'],
  ['Hanuun', 'm.hanuunhibatullah@gmail.com'],
  ['Dika', 'mmahardikk244@gmail.com'],
  ['Rezky', 'rezkyalfawwaz7@gmail.com'],
  ['Vee', 'zhaviraalkha29@gmail.com'],
  ['Yunan', 'yunanrasendria@gmail.com'],
  ['Zakka', 'zakka.af@gmail.com'],
];

// Cari nickname + email dari nama lengkap portal. Kalau nggak ketemu, pakai nama aslinya apa adanya.
function resolveStudent(fullName: string): { name: string; email: string } {
  const lower = fullName.toLowerCase();
  const match = STUDENTS.find(([nickname]) => lower.includes(nickname.toLowerCase()));
  return match ? { name: match[0], email: match[1] } : { name: fullName, email: '' };
}

function mapStatusForSheet(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === 'hadir') return 'Tepat Waktu';
  if (s === 'terlambat') return 'Terlambat';
  if (s === 'izin') return 'Izin';
  if (s === 'sakit') return 'Sakit';
  return status;
}

export interface AttendanceSheetRow {
  timestamp: string;
  name: string;
  date: string; // ISO yyyy-mm-dd
  status: string;
  note?: string;
}

// Layout: A Timestamp | B Email | C Nama | D Link Validasi | E Tanggal | F Valid | G Status | H Keterangan
// Baris dari Web: F dikosongin biar formula Dashboard lama tetap aman. B & D diisi email yang sama.
// Kunci pencocokan baris: Email + Tanggal. Siswa yang emailnya tidak ketemu di daftar
// (email kosong) dicocokkan lewat Nama supaya dua siswa tanpa email tidak saling menimpa.
function rowKey(email: string, name: string, dateFormatted: string): string {
  return `${email || `nama:${name.toLowerCase()}`}|${dateFormatted}`;
}

// Tulis BANYAK baris presensi sekaligus dengan jumlah panggilan API yang tetap
// (1x baca + paling banyak 2x tulis), berapa pun jumlah barisnya. Upsert per
// Email+Tanggal: baris yang sudah ada ditimpa, yang belum ada ditambahkan di bawah.
// Dibuat batch karena menulis satu-satu (2 panggilan per siswa) bisa kena batas
// waktu fungsi Vercel / kuota Sheets API sehingga sebagian siswa tidak masuk sheet.
export async function syncAttendanceRows(
  sheetId: string,
  tabName: string,
  rowsIn: AttendanceSheetRow[],
  opts: { onlyMissing?: boolean } = {}
): Promise<{ updated: number; appended: number }> {
  if (rowsIn.length === 0) return { updated: 0, appended: 0 };
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!B:E`,
  });
  const present = existing.data.values || [];
  const rowIndexByKey = new Map<string, number>(); // key -> nomor baris di sheet (1-based)
  for (let i = 1; i < present.length; i++) {
    const r = present[i] || [];
    rowIndexByKey.set(rowKey(String(r[0] ?? ''), String(r[1] ?? ''), String(r[3] ?? '')), i + 1);
  }

  const toCells = (row: AttendanceSheetRow) => {
    const { name, email } = resolveStudent(row.name);
    const dateFormatted = toSheetDateFormat(row.date);
    return {
      key: rowKey(email, name, dateFormatted),
      cells: [row.timestamp, email, name, email, dateFormatted, 'Valid', mapStatusForSheet(row.status), row.note ?? ''],
    };
  };

  const updates: { range: string; values: any[][] }[] = [];
  const fresh = new Map<string, any[]>(); // key -> sel (dedup di dalam batch)
  for (const row of rowsIn) {
    const { key, cells } = toCells(row);
    const at = rowIndexByKey.get(key);
    if (at && opts.onlyMissing) continue; // jangan timpa baris yang sudah ada
    if (at) updates.push({ range: `${tabName}!A${at}:H${at}`, values: [cells] });
    else fresh.set(key, cells);
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
    });
  }
  if (fresh.size > 0) {
    const start = present.length + 1;
    const values = Array.from(fresh.values());
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A${start}:H${start + values.length - 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
  return { updated: updates.length, appended: fresh.size };
}

// Layout: A Timestamp | B Email | C Nama | D Link Validasi | E Tanggal | F Valid | G Status | H Keterangan
// Baris dari Web: F dikosongin biar formula Dashboard lama tetap aman. B & D diisi email yang sama.
export async function appendAttendanceRow(sheetId: string, tabName: string, row: AttendanceSheetRow) {
  await syncAttendanceRows(sheetId, tabName, [row]);
}

// Hitung berapa siswa (unik) yang tercatat di sheet untuk satu tanggal (ISO yyyy-mm-dd).
export async function countSheetAttendanceForDate(sheetId: string, tabName: string, isoDate: string): Promise<number> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const existing = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tabName}!B:E` });
  const present = existing.data.values || [];
  const target = toSheetDateFormat(isoDate);
  const seen = new Set<string>();
  for (let i = 1; i < present.length; i++) {
    const r = present[i] || [];
    if (String(r[3] ?? '') === target) seen.add(rowKey(String(r[0] ?? ''), String(r[1] ?? ''), target));
  }
  return seen.size;
}

// Bersihin baris presensi dobel yang sudah kadung ada di sheet (sebelum
// appendAttendanceRow di atas jadi upsert). Kunci dedup: Email (kolom B) +
// Tanggal (kolom E). Untuk kunci yang sama, baris PALING BAWAH (= paling baru
// disubmit) yang dipertahankan, baris di atasnya dibuang.
export async function dedupeAttendanceSheet(sheetId: string, tabName: string): Promise<{ removed: number }> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A2:H`,
  });
  const rows = existing.data.values || [];
  if (rows.length === 0) return { removed: 0 };

  const lastIndexForKey = new Map<string, number>();
  rows.forEach((r, i) => {
    const key = `${r[1] ?? ''}|${r[4] ?? ''}`;
    lastIndexForKey.set(key, i);
  });
  const keepIndices = new Set(lastIndexForKey.values());
  const deduped = rows.filter((_, i) => keepIndices.has(i));
  const removed = rows.length - deduped.length;

  if (removed > 0) {
    // Kosongkan seluruh rentang data lama dulu, baru tulis ulang versi bersihnya,
    // supaya tidak ada sisa baris lama menggantung di bawah data baru.
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${tabName}!A2:H${rows.length + 1}`,
    });
    if (deduped.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tabName}!A2:H${deduped.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: deduped },
      });
    }
  }

  return { removed };
}