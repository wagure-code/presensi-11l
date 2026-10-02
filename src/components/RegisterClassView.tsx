import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import logo from '../assets/logo.png';

interface RegisterClassViewProps {
  onSwitchToLogin: () => void;
}

export const RegisterClassView: React.FC<RegisterClassViewProps> = ({ onSwitchToLogin }) => {
  const { completeAuth } = useAuth();
  const [registrationCode, setRegistrationCode] = useState('');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [guruName, setGuruName] = useState('');
  const [guruUsername, setGuruUsername] = useState('');
  const [guruPassword, setGuruPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await api.registerClass({
        registrationCode,
        className,
        schoolName,
        guruName,
        guruUsername,
        guruPassword,
      });
      completeAuth(token, user);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftarkan kelas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-['Plus_Jakarta_Sans',sans-serif] py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="text-center mb-6">
          <img src={logo} alt="Logo" className="w-14 h-14 mx-auto mb-3 rounded-xl shadow-sm" />
          <h1 className="text-xl font-bold text-slate-900">Daftar Kelas Baru</h1>
          <p className="text-sm text-slate-500 mt-1">Buat portal sendiri untuk kelasmu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Pendaftaran</label>
            <input
              type="password"
              value={registrationCode}
              onChange={(e) => setRegistrationCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kelas (contoh: 10L)</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Sekolah (opsional)</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kamu (Wali Kelas/Guru)</label>
            <input
              type="text"
              value={guruName}
              onChange={(e) => setGuruName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
            <input
              type="text"
              value={guruUsername}
              onChange={(e) => setGuruUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password (min. 6 karakter)</label>
            <input
              type="password"
              value={guruPassword}
              onChange={(e) => setGuruPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            {submitting ? 'Membuat kelas...' : 'Buat Kelas'}
          </button>
        </form>

        <button
          onClick={onSwitchToLogin}
          className="w-full text-center text-xs text-slate-500 hover:text-indigo-600 mt-5 cursor-pointer"
        >
          Sudah punya akun? Masuk di sini
        </button>
      </div>
    </div>
  );
};