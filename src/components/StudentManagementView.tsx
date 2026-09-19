import React, { useEffect, useState } from 'react';
import { Users, UserPlus, KeyRound, Trash2, X, Copy, Check, BarChart3 } from 'lucide-react';
import { api } from '../utils/api';
import { StudentProfile, AttendanceRecord } from '../types';
import { AttendanceAnalyticsPanel } from './AttendanceAnalyticsPanel';

interface StudentRow {
  id: string;
  username: string;
  name: string;
  nis?: string;
  avatarEmoji?: string;
}

interface StudentManagementViewProps {
  profile: StudentProfile;
  attendance: AttendanceRecord[];
  onManualAttendanceAdded: (record: AttendanceRecord) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({ profile, attendance, onManualAttendanceAdded }) => {
  const [innerTab, setInnerTab] = useState<'siswa' | 'analitik'>('siswa');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNis, setFormNis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState<{ username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const loadStudents = () => {
    setLoading(true);
    api
      .students()
      .then((rows: any) => setStudents(rows))
      .catch((e: any) => setError(e.message || 'Gagal memuat daftar siswa.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const genPassword = () => {
    const words = ['langit', 'bintang', 'rajin', 'cerdas', 'semangat', 'juara', 'fokus', 'kuat'];
    const w = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(1000 + Math.random() * 9000);
    return `${w}${n}`;
  };

  const openAddForm = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword(genPassword());
    setFormNis('');
    setJustCreated(null);
    setError(null);
    setIsAddOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.registerSiswa({
        username: formUsername.trim(),
        password: formPassword.trim(),
        name: formName.trim(),
        nis: formNis.trim() || undefined,
      });
      setJustCreated({ username: formUsername.trim(), password: formPassword.trim() });
      loadStudents();
    } catch (e: any) {
      setError(e.message || 'Gagal menambah siswa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleResetPassword = async (id: string) => {
    if (!resetPassword.trim() || resetPassword.trim().length < 6) return;
    try {
      await api.resetStudentPassword(id, resetPassword.trim());
      setResetTargetId(null);
      setResetPassword('');
    } catch (e: any) {
      setError(e.message || 'Gagal mengganti password.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus akun "${name}"? Semua data presensi & status tugas siswa ini juga akan hilang.`)) return;
    try {
      await api.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus siswa.');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Panel Admin</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kelas {profile.className} — {students.length} akun siswa terdaftar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setInnerTab('siswa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  innerTab === 'siswa' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Kelola Siswa
              </button>
              <button
                onClick={() => setInnerTab('analitik')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  innerTab === 'analitik' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Analitik Presensi
              </button>
            </div>

            {innerTab === 'siswa' && (
              <button
                onClick={openAddForm}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {innerTab === 'analitik' && (
        <AttendanceAnalyticsPanel
          attendance={attendance}
          students={students}
          className={profile.className}
          onManualAdded={onManualAttendanceAdded}
        />
      )}

      {innerTab === 'siswa' && (
      <>
      {error && !isAddOpen && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Memuat daftar siswa...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500 mb-3">Belum ada akun siswa di kelas ini.</p>
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Tambah siswa pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base">
                    {s.avatarEmoji || '🧑‍🎓'}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">{s.name}</span>
                    <span className="text-[11px] text-slate-500">
                      @{s.username}{s.nis ? ` · NIS ${s.nis}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {resetTargetId === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Password baru (min. 6 karakter)"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs w-44 focus:outline-hidden focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleResetPassword(s.id)}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => { setResetTargetId(null); setResetPassword(''); }}
                        className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setResetTargetId(s.id); setResetPassword(genPassword()); }}
                        title="Reset Password"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        title="Hapus Akun"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Tambah Akun Siswa</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {justCreated ? (
              <div className="p-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                  Akun berhasil dibuat! Catat / kirim info login ini ke siswa:
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Username</span>
                      <span className="text-sm font-mono font-bold text-slate-900">{justCreated.username}</span>
                    </div>
                    <button onClick={() => handleCopy(justCreated.username, 'user')} className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer">
                      {copiedField === 'user' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Password</span>
                      <span className="text-sm font-mono font-bold text-slate-900">{justCreated.password}</span>
                    </div>
                    <button onClick={() => handleCopy(justCreated.password, 'pass')} className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer">
                      {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openAddForm}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Tambah Lagi
                  </button>
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddStudent} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIS (Opsional)</label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="Nomor Induk Siswa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Contoh: budi.s"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password Awal</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormPassword(genPassword())}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Siswa bisa dikasih tahu untuk mengganti ini nanti (lewat guru, belum ada fitur ganti password sendiri).</p>
                </div>

                {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Buat Akun Siswa'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
