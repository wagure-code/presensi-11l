import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, BookOpen, FileText, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { Homework, TaskPriority, TaskCategory } from '../types';
import { uploadHomeworkPhoto } from '../utils/supabaseClient';
import { parsePhotoUrls, serializePhotoUrls, MAX_HOMEWORK_PHOTOS } from '../utils/photos';

interface AddHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (homework: Homework) => void;
  editingItem?: Homework | null;
  savedSubjects?: string[];
}

const COMMON_SUBJECTS = [
  'Matematika Peminatan',
  'Matematika Wajib',
  'Fisika Peminatan',
  'Kimia Analitik',
  'Biologi Sel',
  'Bahasa Indonesia',
  'Bahasa Inggris Lanjut',
  'Pendidikan Pancasila (PPKn)',
  'Sejarah Indonesia',
  'Informatika & Pemrograman',
  'Pendidikan Jasmani (PJOK)',
  'Seni Budaya',
  'Prakarya & Kewirausahaan (PKWU)',
];

const CATEGORIES: TaskCategory[] = [
  'PR Individu',
  'Tugas Kelompok',
  'Proyek',
  'Latihan Soal',
  'Kuis / Ulangan',
];

export const AddHomeworkModal: React.FC<AddHomeworkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  savedSubjects = [],
}) => {
  // Mapel bawaan + mapel kustom yang pernah diketik (tersimpan di database)
  const subjectList = Array.from(new Set([...COMMON_SUBJECTS, ...savedSubjects.filter(Boolean)]));
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(COMMON_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<TaskPriority>('sedang');
  const [category, setCategory] = useState<TaskCategory>('PR Individu');
  const [description, setDescription] = useState('');

  const [newPhotos, setNewPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      if (subjectList.includes(editingItem.subject)) {
        setSubject(editingItem.subject);
        setCustomSubject('');
      } else {
        setSubject('Lainnya');
        setCustomSubject(editingItem.subject);
      }
      setDueDate(editingItem.dueDate);
      setDueTime(editingItem.dueTime || '23:59');
      setPriority(editingItem.priority);
      setCategory(editingItem.category);
      setDescription(editingItem.description || '');
      setExistingPhotos(parsePhotoUrls(editingItem.photoUrl));
      setNewPhotos([]);
    } else {
      // Defaults for new
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');

      setTitle('');
      setSubject(COMMON_SUBJECTS[0]);
      setCustomSubject('');
      setDueDate(`${yyyy}-${mm}-${dd}`);
      setDueTime('23:59');
      setPriority('sedang');
      setCategory('PR Individu');
      setDescription('');
      setExistingPhotos([]);
      setNewPhotos([]);
    }
    setUploadError(null);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const totalPhotos = existingPhotos.length + newPhotos.length;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files ?? []) as File[];
    e.target.value = ''; // supaya file yang sama bisa dipilih lagi
    if (files.length === 0) return;
    const room = MAX_HOMEWORK_PHOTOS - totalPhotos;
    const accepted = files.slice(0, Math.max(room, 0));
    setNewPhotos((prev) => [...prev, ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    setUploadError(
      files.length > accepted.length ? `Maksimal ${MAX_HOMEWORK_PHOTOS} foto per tugas.` : null
    );
  };

  const handleRemoveExisting = (url: string) => {
    setExistingPhotos((prev) => prev.filter((u) => u !== url));
  };

  const handleRemoveNew = (preview: string) => {
    setNewPhotos((prev) => prev.filter((p) => p.preview !== preview));
    URL.revokeObjectURL(preview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const chosenSubject = subject === 'Lainnya' ? customSubject.trim() || 'Umum' : subject;

    let photoUrl = serializePhotoUrls(existingPhotos);
    if (newPhotos.length > 0) {
      setIsUploading(true);
      setUploadError(null);
      try {
        const uploaded = await Promise.all(newPhotos.map((p) => uploadHomeworkPhoto(p.file)));
        photoUrl = serializePhotoUrls([...existingPhotos, ...uploaded]);
      } catch (err: any) {
        setUploadError(err.message || 'Gagal mengunggah foto.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const data: Homework = {
      id: editingItem ? editingItem.id : `hw-${Date.now()}`,
      title: title.trim(),
      subject: chosenSubject,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      dueTime: dueTime || '23:59',
      priority,
      category,
      description: description.trim(),
      completed: editingItem ? editingItem.completed : false,
      completedAt: editingItem?.completedAt,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().split('T')[0],
      photoUrl,
    };

    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingItem ? 'Edit PR / Tugas' : 'Tambah Pekerjaan Rumah (PR) Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              Catat tugas akademik agar notifikasi pengingat otomatis aktif
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Judul Tugas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Tugas / PR <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Latihan Soal Bab 3 Halaman 45 Bagian B"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Mata Pelajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
              >
                {subjectList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
              </select>
            </div>

            {subject === 'Lainnya' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Mapel Kustom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama mapel..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Tugas
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tanggal & Jam Tenggat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenggat Tanggal (Deadline) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam Tenggat <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Prioritas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tingkat Prioritas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['rendah', 'sedang', 'tinggi'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                    priority === p
                      ? p === 'tinggi'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-300'
                        : p === 'sedang'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 ring-1 ring-amber-300'
                        : 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Deskripsi & Instruksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Instruksi Tambahan (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Instruksi pengerjaan dari guru, format dokumen, tautan pengumpulan tugas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Lampiran Foto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lampiran Foto (Opsional, maks. 5)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Contoh: foto papan tulis atau lembar soal yang diberikan.
            </p>

            {totalPhotos > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {existingPhotos.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="Lampiran tugas" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(url)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {newPhotos.map((p) => (
                  <div key={p.preview} className="relative">
                    <img src={p.preview} alt="Lampiran baru" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNew(p.preview)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {totalPhotos < MAX_HOMEWORK_PHOTOS && (
              <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition-colors">
                <ImageIcon className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">
                  {totalPhotos > 0 ? 'Tambah foto lagi' : 'Klik untuk pilih foto (bisa lebih dari 1)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}

            {uploadError && (
              <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {uploadError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isUploading ? 'Mengunggah foto...' : editingItem ? 'Simpan Perubahan' : 'Tambah Tugas'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};