import { randomUUID } from 'crypto';
import db from '../db.js';
import { syncAttendanceRows, formatSheetTimestamp } from './googleSheets.js';

// Aturan: selama mode tatap muka (offline), siswa yang sampai jam 11.00 WIB
// belum presensi pada hari itu (Senin–Minggu) otomatis dicatat HADIR oleh sistem.
export const AUTO_ATTENDANCE_HOUR = 11;

function jakartaNow() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  return { now, date, hour };
}

// Cache sederhana supaya pengecekan lazy (dipanggil dari request biasa) cuma
// jalan sekali per kelas per hari per instance serverless.
const doneToday = new Map<string, string>();

export async function autoMarkAttendanceForClass(className: string): Promise<number> {
  const { now, date, hour } = jakartaNow();
  if (hour < AUTO_ATTENDANCE_HOUR) return 0;
  if (doneToday.get(className) === date) return 0;

  const cycle = (await db.prepare('SELECT currentMode FROM learning_cycle WHERE className = ?').get(className)) as any;
  if (cycle?.currentMode !== 'offline') return 0;

  const missing = (await db
    .prepare(
      `SELECT u.id, u.name FROM users u
       WHERE u.role = 'siswa' AND u.className = ?
         AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.userId = u.id AND a.date = ?)`
    )
    .all(className, date)) as { id: string; name: string }[];

  const note = `Otomatis dicatat sistem (belum presensi sampai pukul ${AUTO_ATTENDANCE_HOUR}.00 WIB)`;
  for (const s of missing) {
    await db
      .prepare(
        `INSERT INTO attendance (id, userId, className, date, time, status, note, method, learningMode)
         VALUES (?, ?, ?, ?, ?, 'hadir', ?, 'Otomatis (Sistem)', 'offline')`
      )
      .run(randomUUID(), s.id, className, date, `${String(AUTO_ATTENDANCE_HOUR).padStart(2, '0')}:00:00`, note);
  }

  // Sinkron ke Google Sheet secara batch. Yang disinkronkan SEMUA presensi otomatis hari ini
  // (bukan cuma yang baru dimasukkan sekarang), jadi kalau run sebelumnya gagal/terpotong di
  // tengah jalan, run berikutnya melengkapi yang kurang. Upsert, jadi aman diulang.
  const autoRows = (await db
    .prepare(
      `SELECT u.name AS name, a.status AS status, a.note AS note FROM attendance a JOIN users u ON u.id = a.userId
       WHERE a.className = ? AND a.date = ? AND a.method = 'Otomatis (Sistem)'`
    )
    .all(className, date)) as { name: string; status: string; note: string }[];

  const guru = (await db
    .prepare(
      `SELECT attendanceSheetId, attendanceSheetTab FROM users WHERE role = 'guru' AND className = ? ORDER BY attendanceSheetId IS NULL ASC LIMIT 1`
    )
    .get(className)) as any;
  if (guru?.attendanceSheetId && autoRows.length > 0) {
    try {
      await syncAttendanceRows(
        guru.attendanceSheetId,
        guru.attendanceSheetTab || 'Form_Responses',
        autoRows.map((r) => ({ timestamp: formatSheetTimestamp(now), name: r.name, date, status: r.status, note: r.note || '' }))
      );
    } catch (err) {
      console.error('Gagal sync presensi otomatis ke Google Sheet:', err);
      return missing.length; // jangan tandai selesai -> dicoba lagi di pemanggilan berikutnya
    }
  }

  doneToday.set(className, date);
  return missing.length;
}

export async function autoMarkAttendanceAllClasses(): Promise<{ classes: number; marked: number }> {
  const rows = (await db.prepare(`SELECT className FROM learning_cycle WHERE currentMode = 'offline'`).all()) as { className: string }[];
  let marked = 0;
  for (const r of rows) marked += await autoMarkAttendanceForClass(r.className);
  return { classes: rows.length, marked };
}
