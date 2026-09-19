import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Plus, 
  UserCheck, 
  CheckSquare, 
  Flame,
  CalendarCheck,
  Building,
  Check,
  Globe,
  Building2,
  Video,
  ExternalLink,
  Laptop,
  Info
} from 'lucide-react';
import { 
  StudentProfile, 
  SubjectSchedule, 
  CleaningDuty, 
  Homework, 
  AttendanceRecord, 
  DayOfWeek,
  LearningCycleState 
} from '../types';
import { initialLearningCycle } from '../data/initialData';
import { 
  formatIndonesianFullDate, 
  getCurrentIndonesianDay, 
  analyzeDeadline,
  getColorClasses
} from '../utils/formatters';

interface DashboardViewProps {
  profile: StudentProfile;
  schedules: SubjectSchedule[];
  duties: CleaningDuty[];
  homeworks: Homework[];
  attendance: AttendanceRecord[];
  learningCycle?: LearningCycleState;
  onNavigateTab: (tab: 'schedule' | 'homework' | 'duty' | 'attendance') => void;
  onQuickCheckIn: () => void;
  onToggleHomework: (id: string) => void;
  onOpenAddHomework: () => void;
  onToggleDutyToday: () => void;
  onOpenCycleModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  schedules,
  duties,
  homeworks,
  attendance,
  learningCycle,
  onNavigateTab,
  onQuickCheckIn,
  onToggleHomework,
  onOpenAddHomework,
  onToggleDutyToday,
  onOpenCycleModal,
}) => {
  const activeCycle = learningCycle || initialLearningCycle;
  const todayDay = getCurrentIndonesianDay();
  const todayStr = new Date().toISOString().split('T')[0];
  const isOnline = activeCycle.currentMode === 'online';

  // 1. Attendance stats
  const todayAttendance = attendance.find((a) => a.date === todayStr);
  const totalDays = attendance.length;
  const hadirCount = attendance.filter((a) => a.status === 'hadir' || a.status === 'terlambat').length;
  const attendanceRate = totalDays > 0 ? Math.round((hadirCount / totalDays) * 100) : 100;

  // 2. Homework stats
  const incompleteHomeworks = homeworks.filter((h) => !h.completed);
  const urgentHomeworks = incompleteHomeworks.filter((h) => {
    const analysis = analyzeDeadline(h.dueDate, h.dueTime);
    return analysis.isUrgent;
  });

  // Sort incomplete homework by deadline (earliest first)
  const sortedUpcomingHomeworks = [...incompleteHomeworks].sort((a, b) => {
    return new Date(`${a.dueDate}T${a.dueTime}`).getTime() - new Date(`${b.dueDate}T${b.dueTime}`).getTime();
  });

  // 3. Today's schedule
  const todaySchedule = schedules
    .filter((s) => s.day === todayDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Current time check for active subject
  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentSubject = todaySchedule.find(
    (s) => currentHM >= s.startTime && currentHM <= s.endTime
  );

  // 4. Today's cleaning duty
  const todayDuty = duties.find((d) => d.day === todayDay);
  const isStudentOnDuty = todayDuty
    ? todayDuty.students.some(
        (s) => s.toLowerCase().includes(profile.name.toLowerCase()) || s.includes('(Saya)')
      )
    : false;

  // Greeting based on hour
  const hour = now.getHours();
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18) greeting = 'Selamat Malam';

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-5 sm:p-7 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-indigo-100 mb-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <span>{formatIndonesianFullDate(now)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {greeting}, {profile.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
              Pantau jadwal belajar, tugas sekolah, dan presensi harianmu dalam satu dashboard interaktif.
            </p>
          </div>

          {/* Quick Action Button in Hero */}
          <div className="flex flex-wrap items-center gap-3">
            {!todayAttendance ? (
              <button
                id="hero-btn-presensi"
                onClick={onQuickCheckIn}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Isi Presensi Sekarang</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Sudah Presensi ({todayAttendance.status.toUpperCase()} • {todayAttendance.time.substring(0, 5)} WIB)
                </span>
              </div>
            )}

            <button
              id="hero-btn-tambah-pr"
              onClick={onOpenAddHomework}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat PR Baru</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Siklus Belajar Hybrid: 2 Bulan Online • 1 Bulan Offline Banner */}
      <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        isOnline
          ? 'bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-white border-cyan-300'
          : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-white border-indigo-300'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl flex-shrink-0 ${
              isOnline ? 'bg-cyan-600 text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
            }`}>
              {isOnline ? <Globe className="w-6 h-6 animate-pulse" /> : <Building2 className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isOnline ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}>
                  {isOnline ? `Siklus 2 Bulan Online (Bulan ${activeCycle.currentMonthInCycle || 1}/2)` : 'Siklus 1 Bulan Offline (Tatap Muka)'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Pola Kelas: 2 Bulan Online • 1 Bulan Offline
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {isOnline
                  ? 'Saat ini Kelas Belajar Daring (PJJ) dari Rumah'
                  : 'Saat ini Kelas Belajar Tatap Muka (PTM) di Sekolah'}
              </h3>

              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                {isOnline
                  ? 'KBM berlangsung virtual via Google Meet / Google Classroom. Presensi mandiri dari rumah dan piket kebersihan fisik kelas di sekolah diliburkan.'
                  : 'KBM berlangsung langsung di ruang kelas SMAN 1 Harapan Bangsa. Wajib hadir di sekolah sebelum pukul 07:00 dan jadwal piket kebersihan aktif.'}
              </p>
            </div>
          </div>

          {/* Right Action & Stepper inside Cycle Banner */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 flex-shrink-0">
            {/* 3-Month Visual Stepper */}
            <div className="flex items-center gap-1.5 bg-white/80 p-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
              <span className={`px-2 py-1 rounded-lg ${
                activeCycle.currentMonthInCycle === 1
                  ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 bg-slate-100'
              }`}>
                1. Online 🌐
              </span>
              <span className="text-slate-300 font-bold">─</span>
              <span className={`px-2 py-1 rounded-lg ${
                activeCycle.currentMonthInCycle === 2
                  ? 'bg-cyan-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 bg-slate-100'
              }`}>
                2. Online 🌐
              </span>
              <span className="text-slate-300 font-bold">─</span>
              <span className={`px-2 py-1 rounded-lg ${
                activeCycle.currentMonthInCycle === 3
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 bg-slate-100'
              }`}>
                3. Offline 🏫
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isOnline && activeCycle.defaultMeetLink && (
                <a
                  href={activeCycle.defaultMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Ruang Meet Utama</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <button
                onClick={onOpenCycleModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Atur Siklus</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 4 Bento Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Presensi Status */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
              {isOnline ? 'Presensi Daring' : 'Presensi Sekolah'}
            </span>
            <div className={`p-2 rounded-lg ${todayAttendance ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 capitalize">
              {todayAttendance ? todayAttendance.status : 'Belum'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {todayAttendance ? `(${todayAttendance.time.substring(0, 5)})` : 'absen'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Rekap Kehadiran</span>
            <span className="font-bold text-emerald-600">{attendanceRate}%</span>
          </div>
        </div>

        {/* Card 2: PR Belum Selesai */}
        <div 
          onClick={() => onNavigateTab('homework')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tugas & PR Aktif</span>
            <div className={`p-2 rounded-lg ${urgentHomeworks.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {incompleteHomeworks.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">tugas pending</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="text-slate-500">Mendesak (&lt;24 Jam)</span>
            <span className={`font-bold ${urgentHomeworks.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>
              {urgentHomeworks.length} tugas
            </span>
          </div>
        </div>

        {/* Card 3: Jadwal Mapel Hari Ini */}
        <div 
          onClick={() => onNavigateTab('schedule')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Jadwal ({todayDay})</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {todaySchedule.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">mata pelajaran</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 truncate">
            {currentSubject ? (
              <span className="text-indigo-600 font-medium">Sedang: {currentSubject.subject}</span>
            ) : (
              <span>Lihat jadwal kelas {isOnline ? '(Meet)' : ''}</span>
            )}
          </div>
        </div>

        {/* Card 4: Piket Kelas Hari Ini (Adapts to Online / Offline) */}
        <div 
          onClick={() => onNavigateTab('duty')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Piket Kebersihan</span>
            <div className={`p-2 rounded-lg ${
              isOnline ? 'bg-slate-100 text-slate-500' : isStudentOnDuty ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-slate-900">
              {isOnline ? 'Diliburkan (Daring)' : isStudentOnDuty ? 'Giliran Anda!' : `${todayDuty?.students.length || 0} Petugas`}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="text-slate-500">Status Fisik</span>
            <span className={`font-semibold ${
              isOnline ? 'text-cyan-700' : todayDuty?.isCompletedToday ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {isOnline ? 'Nonaktif Saat Daring' : todayDuty?.isCompletedToday ? 'Sudah Bersih' : 'Belum Selesai'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: PR Mendesak & Jadwal Mapel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PR & Tugas Terdekat */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Pekerjaan Rumah & Tugas Terdekat
                  </h2>
                  <p className="text-xs text-slate-500">Tugas yang belum dikerjakan dan harus diserahkan</p>
                </div>
              </div>
              <button
                id="btn-dash-lihat-semua-pr"
                onClick={() => onNavigateTab('homework')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <span>Lihat Semua ({incompleteHomeworks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {sortedUpcomingHomeworks.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Semua Tugas Sudah Beres! 🎉</h3>
                <p className="text-xs text-slate-500 mt-1">Tidak ada PR tertunda saat ini. Kamu bisa bersantai atau mencatat tugas baru.</p>
                <button
                  onClick={onOpenAddHomework}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  + Tambah PR Baru
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedUpcomingHomeworks.slice(0, 4).map((hw) => {
                  const deadline = analyzeDeadline(hw.dueDate, hw.dueTime);
                  return (
                    <div
                      key={hw.id}
                      className="group flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50/60 transition-all"
                    >
                      {/* Interactive Checkbox */}
                      <button
                        onClick={() => onToggleHomework(hw.id)}
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 border-slate-300 group-hover:border-indigo-500 flex items-center justify-center transition-colors cursor-pointer"
                        title="Tandai Selesai"
                      >
                        {hw.completed && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {hw.subject}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${deadline.badgeClass}`}
                          >
                            {deadline.text}
                          </span>
                          {hw.priority === 'tinggi' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Prioritas Tinggi
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {hw.title}
                        </h3>
                        {hw.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {hw.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {hw.dueDate} • {hw.dueTime}
                          </span>
                          <span>• {hw.category}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Jadwal Pelajaran Hari Ini */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Jadwal Pelajaran Hari Ini ({todayDay})
                  </h2>
                  <p className="text-xs text-slate-500">Mata pelajaran dan ruang kelas yang harus diikuti</p>
                </div>
              </div>
              <button
                id="btn-dash-lihat-semua-jadwal"
                onClick={() => onNavigateTab('schedule')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <span>Semua Hari</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todaySchedule.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Tidak ada jadwal pelajaran untuk hari {todayDay}.</p>
            ) : (
              <div className="space-y-2.5">
                {todaySchedule.map((item) => {
                  const colors = getColorClasses(item.colorTag);
                  const isCurrent = currentHM >= item.startTime && currentHM <= item.endTime;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center w-14 sm:w-16 flex-shrink-0">
                          <span className="block text-xs font-bold text-slate-800 tabular-nums">
                            {item.startTime}
                          </span>
                          <span className="block text-[10px] text-slate-400 tabular-nums">
                            {item.endTime}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.subject}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white animate-pulse">
                                Sedang Berlangsung
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.teacher} • <span className="font-medium text-slate-600">{isOnline ? 'Kelas Virtual' : item.room}</span>
                          </p>
                        </div>
                      </div>

                      {/* Online Meet Shortcut Button */}
                      {isOnline && (
                        <div className="flex-shrink-0 ml-2">
                          <a
                            href={item.onlineMeetingUrl || learningCycle.defaultMeetLink || 'https://meet.google.com'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-semibold transition-colors"
                            title="Buka Ruang Belajar Virtual Google Meet"
                          >
                            <Video className="w-3.5 h-3.5 text-cyan-600" />
                            <span className="hidden sm:inline">Gabung Meet</span>
                            <ExternalLink className="w-3 h-3 text-cyan-500" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Piket Hari Ini & Presensi Quick Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Piket Kebersihan Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Piket Kebersihan ({todayDay})
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isOnline ? 'Piket kelas fisik diliburkan saat KBM Daring' : 'Regu piket kelas yang bertugas hari ini'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('duty')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Jadwal Piket
              </button>
            </div>

            {/* If in Online Mode Banner */}
            {isOnline ? (
              <div className="mb-4 p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-cyan-950">
                    Piket Fisik Diliburkan (Siklus 2 Bulan Online)
                  </p>
                  <p className="text-[11px] text-cyan-900 mt-0.5 leading-relaxed">
                    Karena kelas saat ini dalam mode pembelajaran daring dari rumah, tugas piket kebersihan fisik ruangan kelas di sekolah dinonaktifkan sementara dan akan kembali aktif di bulan ke-3 saat tatap muka.
                  </p>
                </div>
              </div>
            ) : isStudentOnDuty && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Kamu ada jadwal piket hari ini!
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Jangan lupa melaksanakan tugas piket bersama teman regu sebelum/sesudah jam pelajaran di sekolah.
                  </p>
                </div>
              </div>
            )}

            {/* List of members today */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                {isOnline ? 'Daftar Anggota Regu Hari Ini:' : 'Petugas Bertugas di Kelas:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {todayDuty?.students.map((student, idx) => {
                  const isMe = student.toLowerCase().includes(profile.name.toLowerCase()) || student.includes('(Saya)');
                  return (
                    <span
                      key={idx}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                        isMe
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-1 ring-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {student}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Tasks checklist (only active if offline) */}
            {!isOnline ? (
              <>
                <div className="space-y-2 mb-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block">Tugas Kebersihan:</span>
                  {todayDuty?.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${todayDuty.isCompletedToday ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                        {todayDuty.isCompletedToday && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onToggleDutyToday}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    todayDuty?.isCompletedToday
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {todayDuty?.isCompletedToday ? 'Piket Hari Ini Sudah Selesai (Batal)' : 'Tandai Piket Hari Ini Selesai'}
                  </span>
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 italic block">
                  Regu hari ini bertugas memandu absensi dan mengingatkan link Google Meet kelas daring.
                </span>
              </div>
            )}
          </div>

          {/* Presensi Status & Riwayat Ringkas */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Presensi & Kehadiran
                  </h2>
                  <p className="text-xs text-slate-500">Statistik kehadiran kamu semester ini</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Detail
              </button>
            </div>

            {/* Quick presence check-in box */}
            {!todayAttendance ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 mb-4 text-center">
                <p className="text-xs font-bold text-indigo-900 mb-1">
                  Kamu Belum Mengisi Presensi Hari Ini!
                </p>
                <p className="text-[11px] text-indigo-700 mb-3">
                  Wajib mengisi presensi sebelum pembelajaran dimulai untuk verifikasi absensi kelas.
                </p>
                <button
                  onClick={onQuickCheckIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Isi Presensi Sekarang
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Presensi Tercatat</span>
                  <span className="text-sm font-bold text-emerald-950 capitalize">
                    {todayAttendance.status} (Pukul {todayAttendance.time.substring(0, 5)} WIB)
                  </span>
                  {todayAttendance.note && (
                    <p className="text-xs text-emerald-700 mt-0.5 italic">"{todayAttendance.note}"</p>
                  )}
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            )}

            {/* Mini attendance statistics */}
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block">Hadir</span>
                <span className="text-sm font-bold text-emerald-600">
                  {attendance.filter((a) => a.status === 'hadir').length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block">Telat</span>
                <span className="text-sm font-bold text-amber-600">
                  {attendance.filter((a) => a.status === 'terlambat').length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block">Izin</span>
                <span className="text-sm font-bold text-blue-600">
                  {attendance.filter((a) => a.status === 'izin').length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block">Sakit</span>
                <span className="text-sm font-bold text-purple-600">
                  {attendance.filter((a) => a.status === 'sakit').length}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
