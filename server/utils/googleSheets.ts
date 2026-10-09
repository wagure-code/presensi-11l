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

  // Cari baris kosong pertama lewat kolom Timestamp (A), bukan lewat heuristik append bawaan Sheets.
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A:A`,
  });
  const lastRow = existing.data.values?.length || 1;
  const targetRow = lastRow + 1;

  const { name, email } = resolveStudent(row.name);

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
        toSheetDateFormat(row.date),
        'Valid',
        mapStatusForSheet(row.status),
        row.note ?? '',
      ]],
    },
  });
}