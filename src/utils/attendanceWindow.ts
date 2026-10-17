import { useEffect, useState } from 'react';

// Aturan kapan presensi siswa boleh diisi (semua waktu dihitung WIB):
// - Jam: baru bisa mulai 07.45.
// - Mode daring (online)      : Sabtu & Minggu DITUTUP.
// - Mode tatap muka (offline) : semua hari dibuka.
export const ATTENDANCE_OPEN_HOUR = 7;
export const ATTENDANCE_OPEN_MINUTE = 45;
export const ATTENDANCE_OPEN_LABEL = '07.45';

export type AttendanceMode = 'online' | 'offline' | string | undefined;

export interface AttendanceGate {
  open: boolean;
  /** Kalimat lengkap alasan tombol terkunci (kosong kalau open). */
  message: string;
  /** Versi pendek untuk tombol kecil. */
  short: string;
}

function jakartaParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekday = get('weekday'); // Mon..Sun
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return { isWeekend: weekday === 'Sat' || weekday === 'Sun', minutes: hour * 60 + minute };
}

export function jakartaMinutesNow(now: Date = new Date()): number {
  return jakartaParts(now).minutes;
}

export function getAttendanceGate(mode: AttendanceMode, now: Date = new Date()): AttendanceGate {
  const { isWeekend, minutes } = jakartaParts(now);
  const isOnline = mode !== 'offline';

  if (isOnline && isWeekend) {
    return { open: false, message: 'Presensi ditutup di hari Sabtu & Minggu (mode daring).', short: 'Tutup Sabtu/Minggu' };
  }
  if (minutes < ATTENDANCE_OPEN_HOUR * 60 + ATTENDANCE_OPEN_MINUTE) {
    return {
      open: false,
      message: `Presensi baru dibuka pukul ${ATTENDANCE_OPEN_LABEL} WIB.`,
      short: `Buka ${ATTENDANCE_OPEN_LABEL}`,
    };
  }
  return { open: true, message: '', short: '' };
}

// Re-evaluasi tiap 15 detik supaya tombol otomatis berubah tanpa refresh.
export function useAttendanceGate(mode: AttendanceMode): AttendanceGate {
  const [gate, setGate] = useState(() => getAttendanceGate(mode));
  useEffect(() => {
    setGate(getAttendanceGate(mode));
    const id = setInterval(() => setGate(getAttendanceGate(mode)), 15000);
    return () => clearInterval(id);
  }, [mode]);
  return gate;
}
