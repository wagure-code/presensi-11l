import { ImportScheduleModal } from './ImportScheduleModal';
import { ParsedScheduleRow } from '../utils/scheduleParser';
import { ClipboardPaste } from 'lucide-react';
import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Trash2, 
  Edit2, 
  Sparkles,
  BookOpen,
  Globe,
  Building2,
  Video,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { SubjectSchedule, DayOfWeek, LearningCycleState } from '../types';
import { initialLearningCycle } from '../data/initialData';
import { getCurrentIndonesianDay, getColorClasses } from '../utils/formatters';
import { ImportScheduleModal } from './ImportScheduleModal';
import { ParsedScheduleRow } from '../utils/scheduleParser';
import { ClipboardPaste } from 'lucide-react';

interface ScheduleViewProps {
  schedules: SubjectSchedule[];
  onAddSchedule: (schedule: SubjectSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onEditSchedule: (schedule: SubjectSchedule) => void;
  learningCycle?: LearningCycleState;
  onOpenCycleModal?: () => void;
}

const DAYS: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const COLOR_ROTATION = ['blue', 'emerald', 'amber', 'indigo', 'rose', 'teal', 'purple'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  onAddSchedule,
  onDeleteSchedule,
  onEditSchedule,
  learningCycle,
  onOpenCycleModal,
}) => {
  const activeCycle = learningCycle || initialLearningCycle;
  const currentDay = getCurrentIndonesianDay();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDay);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubjectSchedule | null>(null);

  const isOnline = activeCycle.currentMode === 'online';

  // Form states
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formStartTime, setFormStartTime] = useState('07:00');
  const [formEndTime, setFormEndTime] = useState('08:30');
  const [formColor, setFormColor] = useState('blue');
  const [formDay, setFormDay] = useState<DayOfWeek>(selectedDay);
  const [formOnlineUrl, setFormOnlineUrl] = useState('');

  const openAddModal = (item?: SubjectSchedule) => {
    if (item) {
      setEditingItem(item);
      setFormSubject(item.subject);
      setFormTeacher(item.teacher);
      setFormRoom(item.room);
      setFormStartTime(item.startTime);
      setFormEndTime(item.endTime);
      setFormColor(item.colorTag);
      setFormDay(item.day);
      setFormOnlineUrl(item.onlineMeetingUrl || '');
    } else {
      setEditingItem(null);
      setFormSubject('');
      setFormTeacher('');
      setFormRoom('');
      setFormStartTime('07:00');
      setFormEndTime('08:30');
      setFormColor('blue');
      setFormDay(selectedDay);
      setFormOnlineUrl(learningCycle.defaultMeetLink || '');
    }
    setIsModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) return;

    if (editingItem) {
      onEditSchedule({
        ...editingItem,
        subject: formSubject.trim(),
        teacher: formTeacher.trim() || 'Guru Pengampu',
        room: formRoom.trim() || 'Ruang Kelas',
        startTime: formStartTime,
        endTime: formEndTime,
        colorTag: formColor,
        day: formDay,
        onlineMeetingUrl: formOnlineUrl.trim() || undefined,
        onlinePlatform: 'Google Meet',
      });
    } else {
      onAddSchedule({
        id: `sch-${Date.now()}`,
        day: formDay,
        subject: formSubject.trim(),
        teacher: formTeacher.trim() || 'Guru Pengampu',
        room: formRoom.trim() || 'Ruang Kelas',
        startTime: formStartTime,
        endTime: formEndTime,
        colorTag: formColor,
        onlineMeetingUrl: formOnlineUrl.trim() || undefined,
        onlinePlatform: 'Google Meet',
      });
    }
    setIsModalOpen(false);
  };

  const handleImportSchedule = (rows: ParsedScheduleRow[], replaceExisting: boolean) => {
  if (replaceExisting) {
    schedules.forEach((s) => onDeleteSchedule(s.id));
  }
  rows.forEach((row, idx) => {
    onAddSchedule({
      id: `sch-import-${Date.now()}-${idx}`,
      day: row.day,
      subject: row.subject,
      teacher: row.teacher || 'Guru Pengampu',
      room: row.room || 'Ruang Kelas',
      startTime: row.startTime,
      endTime: row.endTime,
      colorTag: COLOR_ROTATION[idx % COLOR_ROTATION.length],
      onlinePlatform: 'Google Meet',
    });
  });
  setSelectedDay(rows[0]?.day || selectedDay);
};

  // Filter and sort schedule for chosen day
  const daySchedules = schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Current time
  const now = new Date();
  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Jadwal Mata Pelajaran
              </h1>
              {/* Active Cycle Badge */}
              <button
                onClick={onOpenCycleModal}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  isOnline
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {isOnline ? <Globe className="w-3.5 h-3.5 text-cyan-600" /> : <Building2 className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{isOnline ? `Mode Daring (Bulan ${activeCycle.currentMonthInCycle || 1}/2)` : 'Mode Tatap Muka'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isOnline
                ? 'Jadwal pelajaran kelas mode daring (Google Meet / Classroom). Klik tombol Gabung Meet untuk masuk kelas virtual.'
                : 'Jadwal pelajaran mingguan tatap muka langsung di sekolah dengan ruang kelas dan laboratorium.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCycleModal && (
              <button
                onClick={onOpenCycleModal}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Siklus Belajar</span>
              </button>
            )}

            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Impor dari Teks</span>
            </button>

            <button
              onClick={() => openAddModal()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel</span>
            </button>
          </div>
        </div>

        {/* Days of Week Tab Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-5 mt-4 border-t border-slate-100 pb-1 scrollbar-none">
          {DAYS.map((day) => {
            const count = schedules.filter((s) => s.day === day).length;
            const isToday = day === currentDay;
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Hari Ini
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
          <span>Jadwal untuk hari <strong className="text-slate-800">{selectedDay}</strong> ({daySchedules.length} mata pelajaran)</span>
          {selectedDay === currentDay && (
            <span className="text-indigo-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Hari Aktif Belajar
            </span>
          )}
        </div>

        {daySchedules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Jadwal di Hari {selectedDay}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Tidak ada kegiatan mata pelajaran yang tercatat untuk hari ini.
            </p>
            <button
              onClick={() => openAddModal()}
              className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              + Tambah Jadwal {selectedDay}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {daySchedules.map((item, index) => {
              const colors = getColorClasses(item.colorTag);
              const isToday = selectedDay === currentDay;
              const isCurrent = isToday && currentHM >= item.startTime && currentHM <= item.endTime;
              const isNext = isToday && currentHM < item.startTime && (index === 0 || currentHM > daySchedules[index - 1].endTime);
              const meetUrl = item.onlineMeetingUrl || learningCycle.defaultMeetLink || 'https://meet.google.com';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isCurrent
                      ? 'border-indigo-300 ring-2 ring-indigo-200 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Left colored indicator strip */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      item.colorTag === 'blue'
                        ? 'bg-blue-500'
                        : item.colorTag === 'emerald'
                        ? 'bg-emerald-500'
                        : item.colorTag === 'purple'
                        ? 'bg-purple-500'
                        : item.colorTag === 'rose'
                        ? 'bg-rose-500'
                        : item.colorTag === 'amber'
                        ? 'bg-amber-500'
                        : item.colorTag === 'teal'
                        ? 'bg-teal-500'
                        : 'bg-cyan-500'
                    }`}
                  />

                  <div>
                    {/* Top row: Time and Status */}
                    <div className="flex items-center justify-between gap-2 mb-2 pl-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="tabular-nums font-mono">{item.startTime} - {item.endTime}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white animate-pulse">
                            Sedang Berlangsung
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Berikutnya
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subject title */}
                    <div className="pl-2 mt-1">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {item.subject}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.teacher}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{item.room}</span>
                        </span>
                      </div>

                      {/* Online Meet Link section */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Video className={`w-3.5 h-3.5 ${isOnline ? 'text-cyan-600' : 'text-slate-400'}`} />
                          <span className="truncate max-w-[170px] sm:max-w-[200px]">
                            {isOnline ? 'Google Meet Kelas' : 'Tautan Daring (Cadangan)'}
                          </span>
                        </div>
                        <a
                          href={meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isOnline
                              ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Buka Ruang Belajar Virtual Google Meet"
                        >
                          <span>{isOnline ? 'Buka Meet' : 'Link Meet'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-1 pl-2">
                    <button
                      onClick={() => openAddModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Mapel"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSchedule(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Mapel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add / Edit Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingItem ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Isi rincian mata pelajaran, guru pengampu, ruang kelas, link meet daring, dan jam pelajaran.
            </p>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hari</label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Peminatan"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <input
                  type="text"
                  placeholder="Contoh: Drs. Supriyadi, M.Pd."
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ruang Kelas Fisik / Lab (Mode Offline)</label>
                <input
                  type="text"
                  placeholder="Contoh: R. 12-MIPA-2 atau Lab Komputer"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tautan Virtual / Google Meet (Mode Online)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  value={formOnlineUrl}
                  onChange={(e) => setFormOnlineUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Tag</label>
                <div className="flex gap-2">
                  {['blue', 'emerald', 'purple', 'rose', 'amber', 'teal', 'cyan'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      } ${
                        c === 'blue' ? 'bg-blue-500' :
                        c === 'emerald' ? 'bg-emerald-500' :
                        c === 'purple' ? 'bg-purple-500' :
                        c === 'rose' ? 'bg-rose-500' :
                        c === 'amber' ? 'bg-amber-500' :
                        c === 'teal' ? 'bg-teal-500' : 'bg-cyan-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImportScheduleModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportSchedule}
      />

    </div>
  );
};

