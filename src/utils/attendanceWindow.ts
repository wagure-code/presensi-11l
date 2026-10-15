import { useEffect, useState } from 'react';

// Presensi baru bisa diisi mulai jam ini (WIB).
export const ATTENDANCE_OPEN_HOUR = 7;
export const ATTENDANCE_OPEN_MINUTE = 45;
export const ATTENDANCE_OPEN_LABEL = '07.45';

export function jakartaMinutesNow(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export function isAttendanceOpen(now: Date = new Date()): boolean {
  return jakartaMinutesNow(now) >= ATTENDANCE_OPEN_HOUR * 60 + ATTENDANCE_OPEN_MINUTE;
}

// Re-evaluasi tiap 15 detik supaya tombol otomatis aktif tepat jam 07.45 tanpa refresh.
export function useAttendanceOpen(): boolean {
  const [open, setOpen] = useState(isAttendanceOpen());
  useEffect(() => {
    const id = setInterval(() => setOpen(isAttendanceOpen()), 15000);
    return () => clearInterval(id);
  }, []);
  return open;
}
