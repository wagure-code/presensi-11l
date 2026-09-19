export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'terlambat' | 'alpha';

export type LearningMode = 'online' | 'offline';

export interface LearningCycleState {
  currentMode: LearningMode;
  cycleMonthsOnline: number; // 2
  cycleMonthsOffline: number; // 1
  currentMonthInCycle: number; // 1 = Bulan 1 Online, 2 = Bulan 2 Online, 3 = Bulan 1 Offline
  cycleStartDate: string; // YYYY-MM-DD
  onlinePlatformName?: string;
  defaultMeetLink?: string;
  cycleNotes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AttendanceStatus;
  note?: string;
  method?: 'Presensi Mandiri Daring' | 'Presensi Fisik Sekolah' | 'Mandiri (Portal Web)' | 'Kartu Siswa (RFID)' | 'Manual Guru';
  learningMode?: LearningMode;
  networkStatus?: 'Lancar' | 'Ada Kendala Jaringan' | 'Koneksi Stabil';
  studentName?: string; // present only in guru's class-wide attendance view
  userId?: string;
}

export interface SubjectSchedule {
  id: string;
  day: DayOfWeek;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "08:30"
  subject: string;
  teacher: string;
  room: string;
  colorTag: string; // e.g. "blue" | "emerald" | "amber" | "indigo" | "rose" | "teal" | "purple"
  onlineMeetingUrl?: string;
  onlinePlatform?: 'Google Meet' | 'Zoom' | 'Google Classroom' | 'Lainnya';
}

export interface CleaningDuty {
  id: string;
  day: DayOfWeek;
  students: string[];
  tasks: string[];
  isCompletedToday?: boolean;
}

export type TaskPriority = 'tinggi' | 'sedang' | 'rendah';
export type TaskCategory = 'PR Individu' | 'Tugas Kelompok' | 'Proyek' | 'Latihan Soal' | 'Kuis / Ulangan';

export interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  priority: TaskPriority;
  category: TaskCategory;
  description: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  submissionMode?: 'Online (LMS/Drive)' | 'Langsung ke Guru' | 'Fleksibel';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'overdue' | 'piket' | 'presensi' | 'cycle' | 'info';
  timestamp: string;
  isRead: boolean;
  homeworkId?: string;
}

export interface StudentProfile {
  name: string;
  nis: string;
  className: string;
  schoolName: string;
  semester: string;
  avatarEmoji: string;
}
