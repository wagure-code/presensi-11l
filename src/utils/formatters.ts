import { DayOfWeek } from '../types';

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const getCurrentIndonesianDay = (date: Date = new Date()): DayOfWeek => {
  const dayIndex = date.getDay();
  const dayName = INDONESIAN_DAYS[dayIndex];
  return dayName as DayOfWeek;
};

export const formatIndonesianFullDate = (date: Date = new Date()): string => {
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
};

export const formatShortDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthShort = INDONESIAN_MONTHS[monthIdx]?.substring(0, 3) || parts[1];
  return `${day} ${monthShort} ${year}`;
};

export interface DeadlineAnalysis {
  status: 'overdue' | 'urgent' | 'soon' | 'safe';
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isOverdue: boolean;
}

export const analyzeDeadline = (dueDate: string, dueTime: string = '23:59'): DeadlineAnalysis => {
  const now = new Date();
  const target = new Date(`${dueDate}T${dueTime}:00`);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const hoursAgo = Math.abs(Math.round(diffHours));
    const daysAgo = Math.floor(hoursAgo / 24);
    return {
      status: 'overdue',
      text: daysAgo > 0 ? `Lewat ${daysAgo} hari` : `Lewat ${hoursAgo} jam`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      isUrgent: true,
      isOverdue: true,
    };
  }

  if (diffHours <= 24) {
    const hours = Math.max(1, Math.round(diffHours));
    return {
      status: 'urgent',
      text: `Sisa ${hours} jam!`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold animate-pulse',
      isUrgent: true,
      isOverdue: false,
    };
  }

  if (diffHours <= 72) {
    const days = Math.ceil(diffHours / 24);
    return {
      status: 'soon',
      text: `Sisa ${days} hari`,
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      isUrgent: false,
      isOverdue: false,
    };
  }

  const days = Math.ceil(diffHours / 24);
  return {
    status: 'safe',
    text: `${days} hari lagi`,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    isUrgent: false,
    isOverdue: false,
  };
};

export const getColorClasses = (tag: string) => {
  switch (tag) {
    case 'blue':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        pill: 'border-l-4 border-blue-500',
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800',
        pill: 'border-l-4 border-emerald-500',
      };
    case 'purple':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800',
        pill: 'border-l-4 border-purple-500',
      };
    case 'rose':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800',
        pill: 'border-l-4 border-rose-500',
      };
    case 'amber':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        badge: 'bg-amber-100 text-amber-900',
        pill: 'border-l-4 border-amber-500',
      };
    case 'teal':
      return {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-700',
        badge: 'bg-teal-100 text-teal-800',
        pill: 'border-l-4 border-teal-500',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        text: 'text-cyan-800',
        badge: 'bg-cyan-100 text-cyan-900',
        pill: 'border-l-4 border-cyan-500',
      };
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-800',
        pill: 'border-l-4 border-slate-500',
      };
  }
};
