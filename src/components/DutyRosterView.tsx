import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Calendar,
  Globe,
  Building2,
  Info,
  Laptop
} from 'lucide-react';
import { CleaningDuty, StudentProfile, DayOfWeek, LearningCycleState } from '../types';
import { initialLearningCycle } from '../data/initialData';
import { getCurrentIndonesianDay } from '../utils/formatters';

interface DutyRosterViewProps {
  duties: CleaningDuty[];
  profile: StudentProfile;
  onUpdateDuty: (duties: CleaningDuty[]) => void;
  onToggleDutyDone: (day: DayOfWeek) => void;
  learningCycle?: LearningCycleState;
  onOpenCycleModal?: () => void;
}

const DUTY_DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const DutyRosterView: React.FC<DutyRosterViewProps> = ({
  duties,
  profile,
  onUpdateDuty,
  onToggleDutyDone,
  learningCycle,
  onOpenCycleModal,
}) => {
  const activeCycle = learningCycle || initialLearningCycle;
  const currentDay = getCurrentIndonesianDay();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    DUTY_DAYS.includes(currentDay) ? currentDay : 'Senin'
  );

  const isOnline = activeCycle.currentMode === 'online';

  const [newStudentName, setNewStudentName] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const currentDuty = duties.find((d) => d.day === selectedDay) || {
    id: `piket-${selectedDay.toLowerCase()}`,
    day: selectedDay,
    students: [],
    tasks: ['Menyapu Lantai', 'Membersihkan Papan Tulis', 'Membuang Tempat Sampah'],
    isCompletedToday: false,
  };

  const isTodaySelected = selectedDay === currentDay;
  const isStudentInDuty = currentDuty.students.some(
    (s) => s.toLowerCase().includes(profile.name.toLowerCase()) || s.includes('(Saya)')
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const dutyExists = duties.some((d) => d.day === selectedDay);
    const updated = dutyExists
      ? duties.map((d) =>
          d.day === selectedDay ? { ...d, students: [...d.students, newStudentName.trim()] } : d
        )
      : [...duties, { ...currentDuty, students: [...currentDuty.students, newStudentName.trim()] }];

    onUpdateDuty(updated);
    setNewStudentName('');
    setIsAddingStudent(false);
  };

  const handleRemoveStudent = (studentName: string) => {
    const dutyExists = duties.some((d) => d.day === selectedDay);
    if (!dutyExists) return;
    const updated = duties.map((d) => {
      if (d.day === selectedDay) {
        return {
          ...d,
          students: d.students.filter((s) => s !== studentName),
        };
      }
      return d;
    });
    onUpdateDuty(updated);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Top Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Jadwal Piket Kebersihan Kelas
                  </h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isOnline 
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {isOnline ? 'Diliburkan (KBM Daring)' : 'Aktif (Tatap Muka)'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pembagian regu piket harian kelas {profile.className} untuk menjaga kebersihan dan ketertiban.
                </p>
              </div>
            </div>
          </div>

          {onOpenCycleModal && (
            <button
              onClick={onOpenCycleModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Laptop className="w-3.5 h-3.5 text-slate-500" />
              <span>Info Siklus Belajar</span>
            </button>
          )}
        </div>

        {/* Informational Alert if Online Mode */}
        {isOnline && (
          <div className="mt-4 p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-start gap-3">
            <Globe className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-cyan-950 block">
                Pemberitahuan Siklus 2 Bulan Online:
              </span>
              <p className="text-cyan-900 mt-0.5 leading-relaxed">
                Selama kelas berlangsung secara daring dari rumah (bulan 1 & 2), piket kebersihan fisik di sekolah diliburkan. Regu piket yang dijadwalkan di bawah ini tetap tersimpan dan otomatis aktif kembali saat bulan ke-3 ketika kelas masuk secara offline.
              </p>
            </div>
          </div>
        )}

        {/* Day Selector Buttons */}
        <div className="grid grid-cols-5 gap-2 pt-5 mt-4 border-t border-slate-100">
          {DUTY_DAYS.map((day) => {
            const duty = duties.find((d) => d.day === day);
            const isToday = day === currentDay;
            const isSelected = day === selectedDay;
            const hasMe = duty?.students.some(
              (s) => s.toLowerCase().includes(profile.name.toLowerCase()) || s.includes('(Saya)')
            );

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer text-center relative ${
                  isSelected
                    ? 'bg-amber-500 text-white font-bold shadow-xs ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isToday && (
                  <span
                    className={`absolute -top-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isSelected ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white shadow-2xs'
                    }`}
                  >
                    Hari Ini
                  </span>
                )}
                <span className="text-xs sm:text-sm">{day}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                  {duty?.students.length || 0} Petugas
                </span>
                {hasMe && (
                  <span className={`mt-1 text-[9px] font-bold px-1 rounded ${isSelected ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    Giliranmu
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Day Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Petugas Bertugas (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Active Banner if user is in today's duty */}
          {isTodaySelected && isStudentInDuty && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-amber-500 text-white flex-shrink-0">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Hari Ini Jadwal Piket Kamu! ✨
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Laksanakan kewajiban piket bersama anggota regu hari {selectedDay} sebelum bel masuk atau saat jam pulang sekolah.
                </p>
              </div>
            </div>
          )}

          {/* Members Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Regu Petugas Piket ({selectedDay})
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar siswa yang bertanggung jawab pada hari {selectedDay}
                </p>
              </div>

              <button
                onClick={() => setIsAddingStudent(!isAddingStudent)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Petugas</span>
              </button>
            </div>

            {/* Add student form if open */}
            {isAddingStudent && (
              <form onSubmit={handleAddStudent} className="flex gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Nama siswa baru..."
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:border-indigo-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="px-2.5 py-1.5 text-slate-500 text-xs hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
              </form>
            )}

            {/* Students List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentDuty.students.map((student, idx) => {
                const isMe = student.toLowerCase().includes(profile.name.toLowerCase()) || student.includes('(Saya)');
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isMe
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isMe ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <span className={`text-xs sm:text-sm font-semibold block ${isMe ? 'text-amber-950 font-bold' : 'text-slate-800'}`}>
                          {student}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold text-amber-700 uppercase">
                            (Akun Profil Anda)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveStudent(student)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Petugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Standard Tasks & Completion Check (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Rincian Tugas Piket
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Standar kebersihan ruang kelas {profile.className}
            </p>

            <div className="space-y-3 mb-6">
              {currentDuty.tasks.map((task, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                      {task}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Wajib diselesaikan sebelum pelajaran pertama atau seusai jam pulang.
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Checklist Today */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
              <span className="text-xs font-semibold text-slate-600 block mb-1">
                Status Pelaksanaan Piket {selectedDay}:
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border">
                {currentDuty.isCompletedToday ? (
                  <span className="text-emerald-700 bg-emerald-100 border-emerald-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Piket Selesai Dilaksanakan
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-100 border-amber-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Belum Selesai / Sedang Berjalan
                  </span>
                )}
              </div>

              <button
                onClick={() => onToggleDutyDone(selectedDay)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  currentDuty.isCompletedToday
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentDuty.isCompletedToday
                    ? 'Batalkan Status Selesai'
                    : `Tandai Piket ${selectedDay} Selesai`}
                </span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
