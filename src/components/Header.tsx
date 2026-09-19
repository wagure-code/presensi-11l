import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  User, 
  Clock, 
  Sparkles,
  CalendarCheck,
  Globe,
  Building2
} from 'lucide-react';
import { StudentProfile, NotificationItem, LearningCycleState } from '../types';
import { initialLearningCycle } from '../data/initialData';
import { formatIndonesianFullDate } from '../utils/formatters';

interface HeaderProps {
  profile: StudentProfile;
  notifications: NotificationItem[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onResetData: () => void;
  todayHasCheckedIn: boolean;
  onQuickCheckIn: () => void;
  learningCycle?: LearningCycleState;
  onOpenCycleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  notifications,
  soundEnabled,
  onToggleSound,
  onOpenNotifications,
  onOpenProfile,
  onResetData,
  todayHasCheckedIn,
  onQuickCheckIn,
  learningCycle,
  onOpenCycleModal,
}) => {
  const activeCycle = learningCycle || initialLearningCycle;
  const [currentTime, setCurrentTime] = useState(new Date());
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isOnline = activeCycle.currentMode === 'online';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & School/Student Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center text-xl sm:text-2xl shadow-sm ring-2 ring-indigo-100">
              {profile.avatarEmoji || '🎓'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                  Portal Siswa
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {profile.className}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[180px] sm:max-w-xs">
                {profile.schoolName}
              </p>
            </div>
          </div>

          {/* Center Date & Time + Learning Cycle Badge */}
          <div className="hidden md:flex flex-col items-center justify-center text-center px-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-3 py-1 rounded-full border border-indigo-100">
                <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="tabular-nums font-mono font-bold text-sm tracking-wider">{timeString} WIB</span>
              </div>

              {/* Learning Mode Quick Badge */}
              <button
                id="btn-header-cycle-status"
                onClick={onOpenCycleModal}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                  isOnline
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                }`}
                title="Siklus Kelas: 2 Bulan Online, 1 Bulan Offline. Klik untuk ubah mode."
              >
                {isOnline ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                    <span>Mode Daring (Bln {activeCycle.currentMonthInCycle || 1}/2)</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mode Tatap Muka (Bln 3)</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-1">
              {formatIndonesianFullDate(currentTime)}
            </span>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Mobile / Compact Mode Badge */}
            <button
              onClick={onOpenCycleModal}
              className={`md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                isOnline
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
              title="Siklus Kelas: 2 Bulan Online, 1 Bulan Offline"
            >
              {isOnline ? <Globe className="w-3 h-3 text-cyan-600" /> : <Building2 className="w-3 h-3 text-indigo-600" />}
              <span>{isOnline ? 'Daring' : 'Tatap Muka'}</span>
            </button>

            {/* Quick Attendance Pill */}
            {!todayHasCheckedIn ? (
              <button
                id="btn-header-presensi-cepat"
                onClick={onQuickCheckIn}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Presensi Hadir Hari Ini"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Presensi Hari Ini</span>
              </button>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Sudah Presensi</span>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              id="btn-sound-toggle"
              onClick={onToggleSound}
              className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                !soundEnabled ? 'text-slate-400' : 'text-indigo-600'
              }`}
              title={soundEnabled ? 'Suara Notifikasi: Aktif' : 'Suara Notifikasi: Hening'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              )}
            </button>

            {/* Notification Bell with Badge */}
            <button
              id="btn-notification-bell"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifikasi Tenggat Waktu & Tugas"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Student Profile Trigger */}
            <button
              id="btn-profile-trigger"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer text-left"
              title="Profil & Pengaturan Siswa"
            >
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-200">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                  {profile.name}
                </p>
                <p className="text-[10px] text-slate-500">NIS: {profile.nis}</p>
              </div>
            </button>

            {/* Reset Data Button */}
            <button
              id="btn-reset-data"
              onClick={onResetData}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Reset ke Data Bawaan"
              aria-label="Reset Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
