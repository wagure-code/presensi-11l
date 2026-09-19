import React, { useState } from 'react';
import { X, User, School, BookOpen, Smile } from 'lucide-react';
import { StudentProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
}

const EMOJIS = ['🎓', '🧑‍🎓', '📚', '🚀', '⭐', '🔬', '🎨', '💻', '🏅'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [nis, setNis] = useState(profile.nis);
  const [className, setClassName] = useState(profile.className);
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [semester, setSemester] = useState(profile.semester);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji || '🎓');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || 'Dimas Pratama',
      nis: nis.trim() || '202410382',
      className: className.trim() || 'XII MIPA 2',
      schoolName: schoolName.trim() || 'SMA Negeri 1 Harapan Bangsa',
      semester: semester.trim() || 'Ganjil 2026/2027',
      avatarEmoji,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profil Siswa & Pengaturan Kelas</h2>
            <p className="text-xs text-slate-500">Sesuaikan data identitas dan rombel belajar</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Emoji picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Ikon Profil
            </label>
            <div className="flex items-center gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-9 h-9 text-lg rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    avatarEmoji === emoji
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 scale-110'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Nama ini akan digunakan untuk mendeteksi giliran piket harian secara otomatis.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Siswa (NIS)
              </label>
              <input
                type="text"
                required
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas / Rombel
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Sekolah
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Semester & Tahun Ajaran
            </label>
            <input
              type="text"
              required
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-indigo-500"
            />
          </div>

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
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
            >
              Simpan Profil
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
