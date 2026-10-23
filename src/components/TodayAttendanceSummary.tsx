import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';

export interface ClassStudent {
  id: string;
  name: string;
  nis?: string;
  avatarEmoji?: string;
}

interface Props {
  attendance: AttendanceRecord[]; // presensi seluruh kelas (tampilan guru)
  students: ClassStudent[];
  todayStr: string; // YYYY-MM-DD (WIB)
  compact?: boolean;
}

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  hadir: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  terlambat: 'bg-amber-50 text-amber-700 border-amber-200',
  izin: 'bg-blue-50 text-blue-700 border-blue-200',
  sakit: 'bg-purple-50 text-purple-700 border-purple-200',
  alpha: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const TodayAttendanceSummary: React.FC<Props> = ({ attendance, students, todayStr, compact }) => {
  const today = attendance.filter((a) => a.date === todayStr);
  const byUser = new Map<string, AttendanceRecord>();
  today.forEach((a) => { if (a.userId) byUser.set(a.userId, a); });
  const done = students.filter((s) => byUser.has(s.id));
  const pending = students.filter((s) => !byUser.has(s.id));
  done.sort((a, b) => (byUser.get(a.id)!.time || '').localeCompare(byUser.get(b.id)!.time || ''));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-800">
          {done.length} dari {students.length} siswa sudah presensi hari ini
        </p>
        <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${students.length ? Math.round((done.length / students.length) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className={compact ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        <div>
          <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sudah ({done.length})
          </p>
          <ul className="space-y-1">
            {done.length === 0 && <li className="text-xs text-slate-400 italic">Belum ada.</li>}
            {done.map((s) => {
              const rec = byUser.get(s.id)!;
              return (
                <li key={s.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <span className="font-medium text-slate-800 truncate">{s.name}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">{(rec.time || '').substring(0, 5)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${STATUS_STYLE[rec.status]}`}>
                      {rec.status}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Belum ({pending.length})
          </p>
          <ul className="space-y-1">
            {pending.length === 0 && <li className="text-xs text-slate-400 italic">Semua sudah presensi.</li>}
            {pending.map((s) => (
              <li key={s.id} className="text-xs bg-amber-50/60 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium truncate">
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
