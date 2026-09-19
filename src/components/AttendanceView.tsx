import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Trash2,
  Check,
  TrendingUp,
  Award,
  Filter,
  Globe,
  Building2,
  Laptop,
  Users
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, StudentProfile, LearningCycleState } from '../types';
import { initialLearningCycle } from '../data/initialData';
import { formatIndonesianFullDate, formatShortDateIndo } from '../utils/formatters';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  profile: StudentProfile;
  isGuru?: boolean;
  onSubmitAttendance: (record: AttendanceRecord) => void;
  onDeleteAttendance: (id: string) => void;
  learningCycle?: LearningCycleState;
  onOpenCycleModal?: () => void;
}

const statusColors: Record<AttendanceStatus, { bg: string; text: string; border: string }> = {
  hadir: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  terlambat: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  izin: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  sakit: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  alpha: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  profile,
  isGuru = false,
  onSubmitAttendance,
  onDeleteAttendance,
  learningCycle,
  onOpenCycleModal,
}) => {
  const activeCycle = learningCycle || initialLearningCycle;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find((a) => a.date === todayStr);

  const isOnline = activeCycle.currentMode === 'online';

  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    todayRecord ? todayRecord.status : 'hadir'
  );
  const [note, setNote] = useState(todayRecord?.note || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Keep the form in sync if today's record changes underneath us (e.g. after delete)
  useEffect(() => {
    setSelectedStatus(todayRecord ? todayRecord.status : 'hadir');
    setNote(todayRecord?.note || '');
  }, [todayRecord?.id, todayRecord?.status, todayRecord?.note]);

  // Stats
  const totalDays = attendance.length;
  const hadirCount = attendance.filter((a) => a.status === 'hadir').length;
  const telatCount = attendance.filter((a) => a.status === 'terlambat').length;
  const izinCount = attendance.filter((a) => a.status === 'izin').length;
  const sakitCount = attendance.filter((a) => a.status === 'sakit').length;
  const effectivePresent = hadirCount + telatCount;
  const presencePercentage = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newRecord: AttendanceRecord = {
      id: todayRecord ? todayRecord.id : `att-${Date.now()}`,
      date: todayStr,
      time: todayRecord ? todayRecord.time : timeStr,
      status: selectedStatus,
      note: note.trim() || (selectedStatus === 'hadir' ? (isOnline ? 'Hadir daring (Google Meet)' : 'Tepat waktu di sekolah') : '-'),
      method: isOnline ? 'Presensi Mandiri Daring' : 'Presensi Fisik Sekolah',
      learningMode: learningCycle?.currentMode,
    };

    onSubmitAttendance(newRecord);
  };

  // Filtered attendance history
  const filteredHistory = [...attendance]
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  return (
    <div className="space-y-6 pb-20 md:pb-8">

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {isGuru ? 'Rekap Presensi Kelas' : 'Presensi Kehadiran Siswa'}
                  </h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isOnline
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {isOnline ? 'Presensi Daring (PJJ)' : 'Presensi Tatap Muka (PTM)'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {isGuru
                    ? 'Lihat rekap presensi seluruh siswa di kelas ini, lengkap dengan nama pengisi.'
                    : isOnline
                    ? 'Presensi mandiri online dari rumah untuk sesi Google Meet & pembelajaran daring.'
                    : 'Catat presensi kehadiran harian tatap muka dan pantau rekapitulasi kehadiran Anda.'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-xs text-slate-400 font-medium">Tingkat Kehadiran:</span>
            <div className="flex items-center sm:justify-end gap-1.5 text-emerald-600 font-extrabold text-2xl sm:text-3xl">
              <TrendingUp className="w-6 h-6" />
              <span>{presencePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Attendance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Hadir Tepat Waktu</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{hadirCount} data</span>
          <span className="text-[11px] text-slate-400">Status Hadir penuh</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Terlambat</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{telatCount} data</span>
          <span className="text-[11px] text-slate-400">Masuk setelah jam 07:00</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Izin</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{izinCount} data</span>
          <span className="text-[11px] text-slate-400">Disertai surat izin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Sakit</span>
          <span className="text-2xl font-bold text-purple-600 mt-1 block">{sakitCount} data</span>
          <span className="text-[11px] text-slate-400">Surat dokter terlampir</span>
        </div>
      </div>

      {/* Main Two Columns: Check-in Box & History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Form Presensi Hari Ini (5 cols) — hidden entirely for guru */}
        {!isGuru && (
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Presensi Hari Ini
                  </h2>
                  <p className="text-xs text-slate-500">
                    {formatIndonesianFullDate(new Date())}
                  </p>
                </div>

                {todayRecord ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Tercatat
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Belum Presensi
                  </span>
                )}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Status Radio Choices */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Pilih Status Kehadiran:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStatus('hadir')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedStatus === 'hadir'
                            ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200 font-bold text-emerald-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm">Hadir</span>
                          {selectedStatus === 'hadir' && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 block font-normal">Tepat waktu di sekolah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStatus('terlambat')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedStatus === 'terlambat'
                            ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-200 font-bold text-amber-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm">Terlambat</span>
                          {selectedStatus === 'terlambat' && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 block font-normal">Masuk setelah bel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStatus('izin')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedStatus === 'izin'
                            ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-200 font-bold text-blue-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm">Izin</span>
                          {selectedStatus === 'izin' && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 block font-normal">Keperluan keluarga/lomba</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedStatus('sakit')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedStatus === 'sakit'
                            ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-200 font-bold text-purple-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm">Sakit</span>
                          {selectedStatus === 'sakit' && <Check className="w-4 h-4 text-purple-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 block font-normal">Istirahat / rawat inap</span>
                      </button>
                    </div>
                  </div>

                  {/* Note input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keterangan / Catatan (Opsional):
                    </label>
                    <input
                      type="text"
                      placeholder={
                        selectedStatus === 'hadir'
                          ? 'Contoh: Tepat waktu di kelas 12 MIPA 2'
                          : selectedStatus === 'terlambat'
                          ? 'Contoh: Terjebak macet / ban kempes'
                          : 'Contoh: Mengikuti olimpiade sains / demam'
                      }
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Submit Button(s) */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{todayRecord ? 'Perbarui Status Presensi' : 'Kirim Presensi Hadir'}</span>
                    </button>
                  </div>
                </form>

              {/* Profile verified footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Nama: <strong>{profile.name}</strong></span>
                <span>NIS: <strong>{profile.nis}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Riwayat Presensi */}
        <div className={isGuru ? 'lg:col-span-12 space-y-5' : 'lg:col-span-7 space-y-5'}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isGuru ? 'Log Presensi Seluruh Siswa' : 'Riwayat Presensi'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isGuru ? 'Terbaru di atas, lengkap dengan nama siswa pengisi.' : 'Log kehadiran yang tercatat dalam sistem portal'}
                </p>
              </div>

              {/* Filter status */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
                >
                  <option value="all">Semua Status</option>
                  <option value="hadir">Hadir</option>
                  <option value="terlambat">Terlambat</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                </select>
              </div>
            </div>

            {/* Attendance History Table / List */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada data presensi yang sesuai filter.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredHistory.map((item) => {
                  const isToday = item.date === todayStr;
                  const color = statusColors[item.status] || statusColors.hadir;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isToday ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center w-16">
                          <span className="block text-xs font-bold text-slate-900">
                            {formatShortDateIndo(item.date)}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {item.time.substring(0, 5)} WIB
                          </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div>
                          {isGuru && item.studentName && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="text-xs font-bold text-slate-800">{item.studentName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${color.bg} ${color.text} ${color.border}`}
                            >
                              {item.status}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                Hari Ini
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {item.note || '-'}
                          </p>
                        </div>
                      </div>

                      {!isGuru && (
                        <button
                          onClick={() => onDeleteAttendance(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
