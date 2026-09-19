import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  StudentProfile,
  SubjectSchedule,
  CleaningDuty,
  Homework,
  AttendanceRecord,
  DayOfWeek,
  LearningCycleState
} from './types';
import { api } from './utils/api';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { soundManager } from './utils/audio';
import { getCurrentIndonesianDay, analyzeDeadline } from './utils/formatters';

import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { HomeworkView } from './components/HomeworkView';
import { DutyRosterView } from './components/DutyRosterView';
import { AttendanceView } from './components/AttendanceView';
import { AddHomeworkModal } from './components/AddHomeworkModal';
import { NotificationModal } from './components/NotificationModal';
import { ProfileModal } from './components/ProfileModal';
import { LearningCycleModal } from './components/LearningCycleModal';
import { StudentManagementView } from './components/StudentManagementView';

const defaultLearningCycle: LearningCycleState = {
  currentMode: 'online',
  cycleMonthsOnline: 2,
  cycleMonthsOffline: 1,
  currentMonthInCycle: 1,
  cycleStartDate: new Date().toISOString().split('T')[0],
};

function AppShell() {
  const { user, logout } = useAuth();
  const isGuru = user!.role === 'guru';

  const profile: StudentProfile = {
    name: user!.name,
    nis: user!.nis || '',
    className: user!.className,
    schoolName: user!.schoolName || '',
    semester: user!.semester || '',
    avatarEmoji: user!.avatarEmoji || '🧑‍🎓',
  };

  const [dataLoading, setDataLoading] = useState(true);
  const [schedules, setSchedules] = useState<SubjectSchedule[]>([]);
  const [duties, setDuties] = useState<CleaningDuty[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [learningCycle, setLearningCycle] = useState<LearningCycleState>(defaultLearningCycle);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const s = localStorage.getItem('portal_siswa_sound_enabled') !== 'false';
    soundManager.enabled = s;
    return s;
  });
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddHomeworkOpen, setIsAddHomeworkOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const denyIfNotGuru = (): boolean => {
    if (!isGuru) {
      showToast('Hanya guru/wali kelas yang bisa mengubah data ini.');
      return true;
    }
    return false;
  };

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      api.schedules(),
      api.duties(),
      api.homeworks(),
      isGuru ? api.attendanceAll() : api.attendance(),
      api.learningCycle(),
    ])
      .then(([s, d, h, a, c]) => {
        if (cancelled) return;
        setSchedules(s);
        setDuties(d);
        setHomeworks(h);
        setAttendance(a);
        setLearningCycle(c || defaultLearningCycle);
      })
      .catch(() => showToast('Gagal memuat data dari server. Coba muat ulang halaman.'))
      .finally(() => !cancelled && setDataLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user!.id]);

  const notifications = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const items: any[] = [];
    const isOnline = learningCycle.currentMode === 'online';

    if (learningCycle) {
      items.push({
        id: `notif-cycle-${todayStr}`,
        title: isOnline ? `Mode Daring Aktif (Bulan ${learningCycle.currentMonthInCycle} dari 2)` : `Mode Tatap Muka Aktif`,
        message: isOnline
          ? 'Kelas saat ini berada di periode pembelajaran online.'
          : 'Kelas saat ini masuk periode tatap muka langsung di sekolah.',
        type: 'cycle',
        timestamp: `${todayStr} 06:00`,
        isRead: readNotifIds.has(`notif-cycle-${todayStr}`),
      });
    }

    const hasPresensiToday = attendance.some((a) => a.date === todayStr);
    if (!hasPresensiToday && now.getHours() >= 6 && !isGuru) {
      const id = `notif-att-${todayStr}`;
      items.push({
        id,
        title: isOnline ? 'Presensi Daring Mandiri' : 'Presensi Kehadiran Sekolah',
        message: 'Anda belum mengisi presensi hari ini.',
        type: 'presensi',
        timestamp: `${todayStr} 06:30`,
        isRead: readNotifIds.has(id),
      });
    }

    homeworks.forEach((hw) => {
      if (hw.completed) return;
      const dueDateTime = new Date(`${hw.dueDate}T${hw.dueTime || '23:59'}:00`);
      const diffMs = dueDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffMs < 0) {
        const id = `notif-hw-overdue-${hw.id}`;
        items.push({ id, title: 'Tugas Lewat Tenggat! ⚠️', message: `"${hw.title}" (${hw.subject}) telah lewat tenggat.`, type: 'overdue', timestamp: `${hw.dueDate} ${hw.dueTime}`, isRead: readNotifIds.has(id), homeworkId: hw.id });
      } else if (diffHours <= 24) {
        const id = `notif-hw-urgent-${hw.id}`;
        items.push({ id, title: `Tenggat Mendesak: ${hw.subject}`, message: `"${hw.title}" jatuh tempo dalam ${Math.max(1, Math.round(diffHours))} jam.`, type: 'deadline', timestamp: `${hw.dueDate} ${hw.dueTime}`, isRead: readNotifIds.has(id), homeworkId: hw.id });
      } else if (diffHours <= 72) {
        const id = `notif-hw-soon-${hw.id}`;
        items.push({ id, title: `Pengingat Tugas: ${hw.subject}`, message: `"${hw.title}" jatuh tempo dalam ${Math.ceil(diffHours / 24)} hari lagi.`, type: 'deadline', timestamp: `${hw.dueDate} ${hw.dueTime}`, isRead: readNotifIds.has(id), homeworkId: hw.id });
      }
    });

    return items;
  }, [homeworks, attendance, learningCycle, readNotifIds, isGuru]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayHasCheckedIn = attendance.some((a) => a.date === todayStr);

  const pendingHomeworkCount = homeworks.filter((h) => !h.completed).length;
  const urgentHomeworkCount = homeworks.filter((h) => {
    if (h.completed) return false;
    const deadline = analyzeDeadline(h.dueDate, h.dueTime);
    return deadline.isUrgent;
  }).length;

  const todayDay = getCurrentIndonesianDay();
  const todayDuty = duties.find((d) => d.day === todayDay);
  const isDutyToday = todayDuty
    ? todayDuty.students.some((s) => s.toLowerCase().includes(profile.name.toLowerCase()) || s.includes('(Saya)'))
    : false;

  const handleUpdateLearningCycle = async (updatedCycle: LearningCycleState) => {
    if (denyIfNotGuru()) return;
    try {
      await api.updateLearningCycle(updatedCycle);
      setLearningCycle(updatedCycle);
      soundManager.playSuccess();
      showToast(
        updatedCycle.currentMode === 'online'
          ? `Siklus KBM: Mode Online Daring aktif.`
          : 'Siklus KBM: Mode Tatap Muka aktif.'
      );
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui siklus KBM.');
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundManager.enabled = nextVal;
    localStorage.setItem('portal_siswa_sound_enabled', String(nextVal));
    if (nextVal) soundManager.playSuccess();
  };

  const handleQuickCheckIn = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isLate = now.getHours() >= 7 && now.getMinutes() > 15;
    const isOnline = learningCycle.currentMode === 'online';

    const payload = {
      date: todayStr,
      time: timeStr,
      status: isLate ? 'terlambat' : 'hadir',
      note: isLate
        ? (isOnline ? 'Hadir daring (sedikit terlambat masuk meet)' : 'Hadir sekolah (terlambat)')
        : (isOnline ? 'Hadir daring tepat waktu (Google Meet)' : 'Hadir tepat waktu di sekolah'),
      method: isOnline ? 'Presensi Mandiri Daring' : 'Presensi Fisik Sekolah',
      learningMode: learningCycle.currentMode,
    };

    try {
      const saved = await api.submitAttendance(payload);
      setAttendance((prev) => [saved, ...prev.filter((a) => a.date !== todayStr)]);
      soundManager.playSuccess();
      showToast(`Presensi ${payload.status.toUpperCase()} berhasil dicatat pukul ${timeStr.substring(0, 5)} WIB!`);
    } catch (e: any) {
      showToast(e.message || 'Gagal mencatat presensi.');
    }
  };

  const handleSubmitAttendance = async (record: AttendanceRecord) => {
    try {
      const saved = await api.submitAttendance(record);
      setAttendance((prev) => [saved, ...prev.filter((a) => a.date !== record.date)]);
      soundManager.playSuccess();
      showToast(`Status presensi (${record.status.toUpperCase()}) berhasil disimpan!`);
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan presensi.');
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    try {
      await api.deleteAttendance(id);
      setAttendance((prev) => prev.filter((a) => a.id !== id));
      showToast('Catatan presensi dihapus.');
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus presensi.');
    }
  };

  const handleToggleHomework = async (id: string) => {
    const hw = homeworks.find((h) => h.id === id);
    if (!hw) return;
    const nextCompleted = !hw.completed;
    try {
      await api.toggleHomework(id, nextCompleted);
      const now = new Date();
      const nowStr = `${now.toISOString().split('T')[0]} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      setHomeworks((prev) => prev.map((h) => (h.id === id ? { ...h, completed: nextCompleted, completedAt: nextCompleted ? nowStr : undefined } : h)));
      if (nextCompleted) {
        soundManager.playSuccess();
        showToast(`Tugas "${hw.title}" selesai dikerjakan! 🎉`);
      } else {
        showToast('Tugas dikembalikan ke daftar belum dikerjakan.');
      }
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui status tugas.');
    }
  };

  const handleSaveHomework = async (hw: Homework) => {
    if (denyIfNotGuru()) return;
    const exists = homeworks.some((h) => h.id === hw.id);
    try {
      if (exists) {
        const saved = await api.updateHomework(hw.id, hw);
        setHomeworks((prev) => prev.map((h) => (h.id === hw.id ? { ...h, ...saved } : h)));
        showToast('Perubahan tugas berhasil disimpan.');
      } else {
        const saved = await api.createHomework(hw);
        setHomeworks((prev) => [{ ...hw, ...saved, completed: false }, ...prev]);
        soundManager.playNotification();
        showToast(`Tugas baru "${hw.title}" berhasil ditambahkan.`);
      }
    } catch (e: any) {
      showToast(e.message || 'Gagal menyimpan tugas.');
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (denyIfNotGuru()) return;
    try {
      await api.deleteHomework(id);
      setHomeworks((prev) => prev.filter((h) => h.id !== id));
      showToast('Tugas telah dihapus.');
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus tugas.');
    }
  };

  const handleOpenAddHomework = (initialData?: Homework) => {
    if (!initialData && denyIfNotGuru()) return;
    setEditingHomework(initialData || null);
    setIsAddHomeworkOpen(true);
  };

  const handleAddSchedule = async (item: SubjectSchedule) => {
    if (denyIfNotGuru()) return;
    try {
      const saved = await api.createSchedule(item);
      setSchedules((prev) => [...prev, { ...item, ...saved }]);
      showToast(`Mata pelajaran "${item.subject}" ditambahkan.`);
    } catch (e: any) {
      showToast(e.message || 'Gagal menambah jadwal.');
    }
  };

  const handleEditSchedule = async (item: SubjectSchedule) => {
    if (denyIfNotGuru()) return;
    try {
      await api.updateSchedule(item.id, item);
      setSchedules((prev) => prev.map((s) => (s.id === item.id ? item : s)));
      showToast('Jadwal pelajaran diperbarui.');
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui jadwal.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (denyIfNotGuru()) return;
    try {
      await api.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showToast('Mata pelajaran dihapus dari jadwal.');
    } catch (e: any) {
      showToast(e.message || 'Gagal menghapus jadwal.');
    }
  };

  const handleUpdateDuty = async (updatedDuties: CleaningDuty[]) => {
    if (denyIfNotGuru()) return;
    try {
      await Promise.all(
        updatedDuties.map((d) => (duties.some((existing) => existing.id === d.id) ? api.updateDuty(d.id, d) : api.createDuty(d)))
      );
      setDuties(updatedDuties);
      showToast('Daftar regu piket diperbarui.');
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui piket.');
    }
  };

  const handleToggleDutyDone = async (day: DayOfWeek) => {
    const dutyItem = duties.find((d) => d.day === day);
    if (!dutyItem) return;
    const nextCompleted = !dutyItem.isCompletedToday;
    try {
      await api.completeDuty(dutyItem.id, nextCompleted);
      setDuties((prev) => prev.map((d) => (d.day === day ? { ...d, isCompletedToday: nextCompleted } : d)));
      soundManager.playSuccess();
      showToast(nextCompleted ? `Piket hari ${day} ditandai selesai! Kelas bersih & rapi ✨` : `Status piket hari ${day} dibatalkan.`);
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui status piket.');
    }
  };

  const handleSaveProfile = async (p: StudentProfile) => {
    try {
      await api.updateProfile(p);
      showToast('Profil berhasil diperbarui!');
      Object.assign(profile, p);
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui profil.');
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setReadNotifIds((prev) => new Set(prev).add(id));
  };

  const handleMarkAllNotificationsRead = () => {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
    showToast('Semua notifikasi telah ditandai dibaca.');
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat data portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Header
        profile={profile}
        notifications={notifications}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onResetData={logout}
        todayHasCheckedIn={todayHasCheckedIn}
        onQuickCheckIn={handleQuickCheckIn}
        learningCycle={learningCycle}
        onOpenCycleModal={() => setIsCycleModalOpen(true)}
      />

      <NavigationTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingHomeworkCount={pendingHomeworkCount}
        urgentHomeworkCount={urgentHomeworkCount}
        isDutyToday={isDutyToday}
        hasPresensiToday={todayHasCheckedIn}
        isGuru={isGuru}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <DashboardView
                profile={profile}
                schedules={schedules}
                duties={duties}
                homeworks={homeworks}
                attendance={attendance}
                learningCycle={learningCycle}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onQuickCheckIn={handleQuickCheckIn}
                onToggleHomework={handleToggleHomework}
                onOpenAddHomework={() => handleOpenAddHomework()}
                onToggleDutyToday={() => handleToggleDutyDone(todayDay)}
                onOpenCycleModal={() => setIsCycleModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <ScheduleView
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onEditSchedule={handleEditSchedule}
                learningCycle={learningCycle}
                onOpenCycleModal={() => setIsCycleModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'homework' && (
            <motion.div key="homework" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <HomeworkView
                homeworks={homeworks}
                onToggleComplete={handleToggleHomework}
                onDeleteHomework={handleDeleteHomework}
                onOpenAddModal={handleOpenAddHomework}
              />
            </motion.div>
          )}

          {activeTab === 'duty' && (
            <motion.div key="duty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <DutyRosterView
                duties={duties}
                profile={profile}
                onUpdateDuty={handleUpdateDuty}
                onToggleDutyDone={handleToggleDutyDone}
                learningCycle={learningCycle}
                onOpenCycleModal={() => setIsCycleModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <AttendanceView
                attendance={attendance}
                profile={profile}
                isGuru={isGuru}
                onSubmitAttendance={handleSubmitAttendance}
                onDeleteAttendance={handleDeleteAttendance}
                learningCycle={learningCycle}
                onOpenCycleModal={() => setIsCycleModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'students' && isGuru && (
            <motion.div key="students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <StudentManagementView
                profile={profile}
                attendance={attendance}
                onManualAttendanceAdded={(record) => {
                  setAttendance((prev) => [record, ...prev.filter((a) => !(a.userId === record.userId && a.date === record.date))]);
                  showToast(`Presensi manual untuk ${record.studentName || 'siswa'} disimpan.`);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2.5 text-xs sm:text-sm font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AddHomeworkModal isOpen={isAddHomeworkOpen} onClose={() => setIsAddHomeworkOpen(false)} onSave={handleSaveHomework} editingItem={editingHomework} />

      <LearningCycleModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        learningCycle={learningCycle}
        cycle={learningCycle}
        onSave={handleUpdateLearningCycle}
        onSaveLearningCycle={handleUpdateLearningCycle}
      />

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigateToHomework={() => setActiveTab('homework')}
        onNavigateToAttendance={() => setActiveTab('attendance')}
      />

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={profile} onSaveProfile={handleSaveProfile} />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Memuat...</div>
      </div>
    );
  }

  if (!user) return <LoginView />;

  return <AppShell key={user.id} />;
}
