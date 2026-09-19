import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Flame, 
  Calendar,
  BookOpen,
  Check,
  Tag
} from 'lucide-react';
import { Homework, TaskPriority, TaskCategory } from '../types';
import { analyzeDeadline, formatShortDateIndo } from '../utils/formatters';

interface HomeworkViewProps {
  homeworks: Homework[];
  onToggleComplete: (id: string) => void;
  onDeleteHomework: (id: string) => void;
  onOpenAddModal: (initialData?: Homework) => void;
}

type FilterStatus = 'all' | 'pending' | 'urgent' | 'completed';

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  homeworks,
  onToggleComplete,
  onDeleteHomework,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'newest'>('deadline');

  // Stats calculation
  const totalTasks = homeworks.length;
  const completedTasks = homeworks.filter((h) => h.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered and sorted tasks
  const filteredHomeworks = useMemo(() => {
    return homeworks
      .filter((hw) => {
        // Status filter
        if (statusFilter === 'pending' && hw.completed) return false;
        if (statusFilter === 'completed' && !hw.completed) return false;
        if (statusFilter === 'urgent') {
          if (hw.completed) return false;
          const deadline = analyzeDeadline(hw.dueDate, hw.dueTime);
          if (!deadline.isUrgent) return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && hw.priority !== priorityFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && hw.category !== categoryFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = hw.title.toLowerCase().includes(q);
          const matchSubject = hw.subject.toLowerCase().includes(q);
          const matchDesc = hw.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          // Completed items go to bottom
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const dateA = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`).getTime();
          const dateB = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`).getTime();
          return dateA - dateB;
        }
        if (sortBy === 'priority') {
          const prioScore: Record<TaskPriority, number> = { tinggi: 3, sedang: 2, rendah: 1 };
          return prioScore[b.priority] - prioScore[a.priority];
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [homeworks, statusFilter, priorityFilter, categoryFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Top Header Card with Summary Bar & Add Button */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pekerjaan Rumah & Tugas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau semua tugas akademik, latihan soal, dan proyek kelompok agar tidak melewati tenggat waktu.
            </p>
          </div>

          <button
            id="btn-tambah-pr-modal"
            onClick={() => onOpenAddModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah PR / Tugas</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">
              Kemajuan Pengerjaan Tugas: <span className="text-indigo-600">{completedTasks}</span> dari {totalTasks} selesai ({completionPercent}%)
            </span>
            <span className="text-slate-500 font-medium">{pendingTasks} tugas menunggu</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
        
        {/* Main Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Dikerjakan ({pendingTasks})
          </button>
          <button
            onClick={() => setStatusFilter('urgent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'urgent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Mendesak (&lt;24 Jam)</span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sudah Selesai ({completedTasks})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({totalTasks})
          </button>
        </div>

        {/* Search & Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          
          {/* Search box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-homework-input"
              type="text"
              placeholder="Cari judul tugas atau mata pelajaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Priority filter */}
          <div className="sm:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">Semua Prioritas</option>
              <option value="tinggi">Prioritas Tinggi</option>
              <option value="sedang">Prioritas Sedang</option>
              <option value="rendah">Prioritas Rendah</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="PR Individu">PR Individu</option>
              <option value="Tugas Kelompok">Tugas Kelompok</option>
              <option value="Proyek">Proyek</option>
              <option value="Latihan Soal">Latihan Soal</option>
              <option value="Kuis / Ulangan">Kuis / Ulangan</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'newest')}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500 font-medium"
            >
              <option value="deadline">Tenggat Terdekat</option>
              <option value="priority">Prioritas Tertinggi</option>
              <option value="newest">Paling Baru Ditambahkan</option>
            </select>
          </div>

        </div>

      </div>

      {/* Task List Items */}
      {filteredHomeworks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada tugas yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ditemukan tugas dengan filter yang dipilih atau pencarian saat ini.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setCategoryFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHomeworks.map((hw) => {
            const deadline = analyzeDeadline(hw.dueDate, hw.dueTime);
            return (
              <div
                key={hw.id}
                className={`bg-white rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                  hw.completed
                    ? 'border-slate-200/60 bg-slate-50/70 opacity-80'
                    : deadline.isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-100 shadow-2xs'
                    : deadline.isUrgent
                    ? 'border-amber-300 ring-1 ring-amber-100 shadow-2xs'
                    : 'border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {hw.subject}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {hw.category}
                      </span>
                    </div>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        hw.priority === 'tinggi'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : hw.priority === 'sedang'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      Prioritas {hw.priority}
                    </span>
                  </div>

                  {/* Title & Checkbox */}
                  <div className="flex items-start gap-3 mt-1">
                    <button
                      onClick={() => onToggleComplete(hw.id)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                        hw.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-indigo-600 bg-white'
                      }`}
                      title={hw.completed ? 'Batalkan status selesai' : 'Tandai sebagai selesai'}
                    >
                      {hw.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-bold text-slate-900 leading-snug ${
                          hw.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {hw.title}
                      </h3>
                      {hw.description && (
                        <p
                          className={`text-xs text-slate-600 mt-1.5 leading-relaxed ${
                            hw.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {hw.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Footer: Deadline & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        hw.completed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : deadline.badgeClass
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{hw.completed ? 'Selesai Dikerjakan' : deadline.text}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {formatShortDateIndo(hw.dueDate)} • {hw.dueTime}
                    </span>
                  </div>

                  {/* Action Icons: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenAddModal(hw)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Tugas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteHomework(hw.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
