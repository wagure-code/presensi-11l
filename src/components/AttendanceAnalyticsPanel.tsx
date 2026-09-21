import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, Plus, Download, X, Search, Filter } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { api } from '../utils/api';
import { formatShortDateIndo } from '../utils/formatters';

interface StudentRow {
  id: string;
  username: string;
  name: string;
  nis?: string;
}

interface AttendanceAnalyticsPanelProps {
  attendance: AttendanceRecord[];
  students: StudentRow[];
  className: string;
  onManualAdded: (record: AttendanceRecord) => void;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  hadir: '#10b981',
  terlambat: '#f59e0b',
  sakit: '#8b5cf6',
  izin: '#3b82f6',
  alpha: '#f43f5e',
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  sakit: 'Sakit',
  izin: 'Izin',
  alpha: 'Alpha',
};

export const AttendanceAnalyticsPanel: React.FC<AttendanceAnalyticsPanelProps> = ({
  attendance,
  students,
  className,
  onManualAdded,
}) => {
  const [dateRange, setDateRange] = useState<'7' | '14' | '30' | 'all'>('14');
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [formStudentId, setFormStudentId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('08:00');
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('hadir');
  const [formNote, setFormNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredByDate = useMemo(() => {
    if (dateRange === 'all') return attendance;
    const daysLimit = parseInt(dateRange, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return attendance.filter((a) => a.date >= cutoffStr);
  }, [attendance, dateRange]);

  const statusStats = useMemo(() => {
    const counts = { hadir: 0, terlambat: 0, sakit: 0, izin: 0, alpha: 0 };
    filteredByDate.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    const total = filteredByDate.length || 1;
    const attendanceRate = Math.round(((counts.hadir + counts.terlambat) / total) * 100);
    return { ...counts, total: filteredByDate.length, attendanceRate };
  }, [filteredByDate]);

  const pieData = useMemo(
    () =>
      (Object.keys(STATUS_LABELS) as AttendanceStatus[])
        .map((status) => ({ name: STATUS_LABELS[status], value: statusStats[status], color: STATUS_COLORS[status] }))
        .filter((d) => d.value > 0),
    [statusStats]
  );

  const dailyTrend = useMemo(() => {
    const map: Record<string, { date: string; display: string; hadir: number; terlambat: number; izinSakit: number; alpha: number }> = {};
    filteredByDate.forEach((a) => {
      if (!map[a.date]) {
        const parts = a.date.split('-');
        map[a.date] = {
          date: a.date,
          display: parts.length === 3 ? `${parts[2]}/${parts[1]}` : a.date,
          hadir: 0,
          terlambat: 0,
          izinSakit: 0,
          alpha: 0,
        };
      }
      if (a.status === 'hadir') map[a.date].hadir++;
      else if (a.status === 'terlambat') map[a.date].terlambat++;
      else if (a.status === 'izin' || a.status === 'sakit') map[a.date].izinSakit++;
      else if (a.status === 'alpha') map[a.date].alpha++;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredByDate]);

  const filteredRecords = useMemo(() => {
    return [...attendance]
      .filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (a.studentName || '').toLowerCase().includes(q) || a.date.includes(q) || (a.note || '').toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50);
  }, [attendance, searchQuery]);

  const openManualModal = () => {
    setFormStudentId(students[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('08:00');
    setFormStatus('hadir');
    setFormNote('');
    setFormError(null);
    setIsManualModalOpen(true);
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const saved: any = await api.manualAttendance({
        studentId: formStudentId,
        date: formDate,
        time: `${formTime}:00`,
        status: formStatus,
        note: formNote.trim() || undefined,
      });
      const student = students.find((s) => s.id === formStudentId);
      onManualAdded({
        id: saved.id,
        date: formDate,
        time: `${formTime}:00`,
        status: formStatus,
        note: formNote.trim() || undefined,
        method: 'Manual Guru',
        studentName: student?.name,
        userId: formStudentId,
      } as AttendanceRecord);
      setIsManualModalOpen(false);
    } catch (e: any) {
      setFormError(e.message || 'Gagal menyimpan presensi manual.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Waktu', 'Nama Siswa', 'Status', 'Metode', 'Catatan'];
    const rows = filteredByDate.map((a) => [
      a.date,
      a.time,
      `"${a.studentName || ''}"`,
      a.status,
      `"${a.method || '-'}"`,
      `"${(a.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `rekap_presensi_${className.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {(['7', '14', '30', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRange === r ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {r === 'all' ? 'Semua' : `${r} Hari`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </button>
          <button
            onClick={openManualModal}
            disabled={students.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Input Presensi Manual
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 block">Tingkat Kehadiran</span>
          <span className="text-xl font-bold text-indigo-600">{statusStats.attendanceRate}%</span>
        </div>
        {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
          <div key={status} className="bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">{STATUS_LABELS[status]}</span>
            <span className="text-xl font-bold" style={{ color: STATUS_COLORS[status] }}>{statusStats[status]}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-slate-400" /> Distribusi Status
          </h3>
          {pieData.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">Belum ada data presensi.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-slate-400" /> Tren Harian
          </h3>
          {dailyTrend.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">Belum ada data presensi pada rentang ini.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="display" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hadir" name="Hadir" fill={STATUS_COLORS.hadir} stackId="a" />
                <Bar dataKey="terlambat" name="Terlambat" fill={STATUS_COLORS.terlambat} stackId="a" />
                <Bar dataKey="izinSakit" name="Izin/Sakit" fill={STATUS_COLORS.izin} stackId="a" />
                <Bar dataKey="alpha" name="Alpha" fill={STATUS_COLORS.alpha} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Records table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Log Presensi ({filteredRecords.length})</h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / tanggal / catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs outline-none w-48"
            />
          </div>
        </div>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">Tidak ada data.</div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filteredRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-slate-500 font-mono shrink-0">{formatShortDateIndo(r.date)}</span>
                  <span className="font-bold text-slate-800 w-28 truncate">{r.studentName || '-'}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}
                  >
                    {r.status}
                  </span>
                </div>
                <span className="text-slate-400 truncate max-w-[200px]">{r.note || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual entry modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Input Presensi Manual</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitManual} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Siswa</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormStatus(status)}
                      className={`py-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        formStatus === status ? 'text-white border-transparent' : 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      style={formStatus === status ? { backgroundColor: STATUS_COLORS[status] } : undefined}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Misal: Presensi manual dari absen kertas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{formError}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Presensi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
