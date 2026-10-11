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
export async function appendAttendanceRow(sheetId: string, tabName: string, row: AttendanceSheetRow) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const { name, email } = resolveStudent(row.name);
  const targetDateFormatted = toSheetDateFormat(row.date);

  // Cari baris existing milik siswa yang sama di tanggal yang sama (kolom B=Email,
  // E=Tanggal). Kalau ketemu, baris itu DITIMPA alih-alih nambah baris baru —
  // menyamai perilaku tabel `attendance` di database (DELETE lalu INSERT per
  // siswa per tanggal). Ini mencegah baris dobel kalau endpoint presensi
  // terpanggil lebih dari sekali untuk hari yang sama (double-klik tombol,
  // retry jaringan, dst).
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!B:E`,
  });
  const rows = existing.data.values || [];
  let targetRow = rows.length + 1;
  for (let i = 1; i < rows.length; i++) {
    const rowEmail = rows[i]?.[0];
    const rowDate = rows[i]?.[3];
    if (rowEmail === email && rowDate === targetDateFormatted) {
      targetRow = i + 1;
      break;
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tabName}!A${targetRow}:H${targetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        row.timestamp,
        email,
        name,
        email,
        targetDateFormatted,
        'Valid',
        mapStatusForSheet(row.status),
        row.note ?? '',
      ]],
    },
  });
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