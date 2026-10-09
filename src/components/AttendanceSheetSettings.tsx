import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export const AttendanceSheetSettings: React.FC = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [tabName, setTabName] = useState('Form_Responses');
  const [savedSheetId, setSavedSheetId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.getAttendanceSheetConfig()
      .then((cfg: any) => {
        setSavedSheetId(cfg.sheetId);
        setTabName(cfg.tabName || 'Form_Responses');
        setIsAdmin(!!cfg.isAdmin);
        if (cfg.sheetId) {
          setSheetUrl(`https://docs.google.com/spreadsheets/d/${cfg.sheetId}/edit`);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!sheetUrl.trim()) {
      setMessage({ type: 'error', text: 'Paste link Google Sheet-nya dulu.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await api.setAttendanceSheetConfig({ sheetUrl: sheetUrl.trim(), tabName: tabName.trim() || 'Form_Responses' });
      setSavedSheetId(result.sheetId);
      setMessage({ type: 'success', text: 'Berhasil disimpan! Presensi baru bakal otomatis masuk ke sheet ini.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Gagal menyimpan, coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <h3 className="font-semibold text-slate-800 mb-1">Sinkronisasi ke Google Sheet</h3>
      <p className="text-sm text-slate-500 mb-3">
        {savedSheetId ? 'Sheet terhubung. Ganti link di bawah kalau mau pindah tujuan.' : 'Belum ada sheet yang terhubung.'}
      </p>

      {!isAdmin ? (
        <p className="text-sm text-slate-400 italic">Hanya akun Admin yang bisa mengubah pengaturan ini.</p>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Paste link Google Sheet (yang di address bar)"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Nama tab tujuan"
            value={tabName}
            onChange={(e) => setTabName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}

      {message && (
        <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>
      )}
    </div>
  );
};