import { DayOfWeek } from '../types';

const DAY_MAP: Record<string, DayOfWeek> = {
  senin: 'Senin',
  sen: 'Senin',
  selasa: 'Selasa',
  sel: 'Selasa',
  rabu: 'Rabu',
  rab: 'Rabu',
  kamis: 'Kamis',
  kam: 'Kamis',
  jumat: 'Jumat',
  jum: 'Jumat',
  jmt: 'Jumat',
  sabtu: 'Sabtu',
  sab: 'Sabtu',
};

const DAY_NAMES = Object.keys(DAY_MAP).sort((a, b) => b.length - a.length);
const DAY_REGEX = new RegExp(`\\b(${DAY_NAMES.join('|')})\\b`, 'i');
const DAY_ONLY_REGEX = new RegExp(`^(${DAY_NAMES.join('|')})[:.]?$`, 'i');
const TIME_RANGE_REGEX = /(\d{1,2})[.:](\d{2})\s*(?:-|–|—|s\.?d\.?|sampai)\s*(\d{1,2})[.:](\d{2})/i;

export interface ParsedScheduleRow {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  raw: string;
}

export interface ParseScheduleResult {
  rows: ParsedScheduleRow[];
  unrecognized: string[];
}

export function parseScheduleText(text: string): ParseScheduleResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let currentDay: DayOfWeek | null = null;
  const rows: ParsedScheduleRow[] = [];
  const unrecognized: string[] = [];

  for (const line of lines) {
    // A line that is *just* a day name acts as a header for the lines that follow
    const dayOnlyMatch = line.match(DAY_ONLY_REGEX);
    if (dayOnlyMatch) {
      currentDay = DAY_MAP[dayOnlyMatch[1].toLowerCase()];
      continue;
    }

    let day = currentDay;
    let rest = line;

    const dayMatch = line.match(DAY_REGEX);
    if (dayMatch && dayMatch.index !== undefined) {
      day = DAY_MAP[dayMatch[1].toLowerCase()];
      currentDay = day;
      rest = (line.slice(0, dayMatch.index) + line.slice(dayMatch.index + dayMatch[0].length)).trim();
      rest = rest.replace(/^[:,\-–—\s]+/, '');
    }

    const timeMatch = rest.match(TIME_RANGE_REGEX);
    if (!day || !timeMatch || timeMatch.index === undefined) {
      unrecognized.push(line);
      continue;
    }

    const startTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    const endTime = `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`;

    let remainder = (rest.slice(0, timeMatch.index) + rest.slice(timeMatch.index + timeMatch[0].length)).trim();
    remainder = remainder.replace(/^[:,\-–—\s]+/, '').replace(/[:,\-–—\s]+$/, '');

    const parts = remainder
      .split(/,|–|—|(?<!\d)-(?!\d)/)
      .map((p) => p.trim())
      .filter(Boolean);

    const subject = parts[0] || '(Tanpa nama mapel)';
    const teacher = parts[1] || '';
    const room = parts[2] || '';

    rows.push({ day, startTime, endTime, subject, teacher, room, raw: line });
  }

  return { rows, unrecognized };
}
