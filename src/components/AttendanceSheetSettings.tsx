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
  const [resyncing, setResyncing] = useState(false);
  const [resyncMessage, setResyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deduping, setDeduping] = useState(false);
  const [dedupeMessage, setDedupeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleResync = async () => {
    setResyncing(true);
    setResyncMessage(null);
    try {
      const r = await api.resyncAttendanceSheet();
      const lengkap = r.sheetAfter >= r.web;
      setResyncMessage({
        type: lengkap && !r.collisions.length ? 'success' : 'error',
        text:
          `Web: ${r.web} dari ${r.totalSiswa} siswa • Sheet sebelum: ${r.sheetBefore} • Sheet sekarang: ${r.sheetAfter}.` +
          (r.added > 0 ? ` ${r.added} baris yang kurang ditambahkan.` : '') +
          (lengkap ? ' Sudah sama.' : ' Masih ada selisih — cek format tanggal di sheet (harus dd/mm/yy).') +
          (r.collisions.length ? ` Nama bentrok email: ${r.collisions.join('; ')}.` : '') +
          (r.unmatched.length ? ` Belum ada email di daftar: ${r.unmatched.join(', ')}.` : ''),
      });
    } catch (err: any) {
      setResyncMessage({ type: 'error', text: err?.message || 'Gagal mengecek sheet, coba lagi.' });
    } finally {
      setResyncing(false);
    }
  };

  const handleDedupe = async () => {
    setDeduping(true);
    setDedupeMessage(null);
    try {
      const result = await api.dedupeAttendanceSheet();
      setDedupeMessage({
        type: 'success',
        text: result.removed > 0
          ? `${result.removed} baris dobel berhasil dihapus.`
          : 'Nggak ada baris dobel, sheet-nya udah bersih.',
      });
    } catch (err: any) {
      setDedupeMessage({ type: 'error', text: err?.message || 'Gagal membersihkan baris dobel, coba lagi.' });
    } finally {
      setDeduping(false);
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

      {savedSheetId && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">
            Cek apakah presensi hari ini di web (termasuk yang otomatis) jumlahnya sudah sama dengan di sheet.
            Baris yang kurang di sheet akan dilengkapi.
          </p>
          <button
            onClick={handleResync}
            disabled={resyncing}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 mb-2"
          >
            {resyncing ? 'Mengecek...' : 'Cek & Sinkronkan Presensi Hari Ini'}
          </button>
          {resyncMessage && (
            <p className={`text-sm mb-3 ${resyncMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {resyncMessage.text}
            </p>
          )}
          <p className="text-xs text-slate-500 mb-2">
            Ada presensi yang nyangkut dobel di sheet (mis. karena double-klik tombol)? Bersihkan di sini — baris
            terbaru per siswa per tanggal akan dipertahankan, sisanya dihapus.
          </p>
          <button
            onClick={handleDedupe}
            disabled={deduping}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {deduping ? 'Membersihkan...' : 'Bersihkan Baris Dobel'}
          </button>
          {dedupeMessage && (
            <p className={`text-sm mt-2 ${dedupeMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {dedupeMessage.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};