import React, { useMemo, useState } from 'react';
import { X, ClipboardPaste, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { SubjectSchedule } from '../types';
import { parseScheduleText, ParsedScheduleRow } from '../utils/scheduleParser';

interface ImportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: ParsedScheduleRow[], replaceExisting: boolean) => void;
}

const COLOR_ROTATION = ['blue', 'emerald', 'amber', 'indigo', 'rose', 'teal', 'purple'];

const PLACEHOLDER = `Contoh format yang bisa dibaca:

Senin 07.00-08.30 Matematika, Bu Sari, Ruang 5
07.30-09.00 Bahasa Indonesia - Pak Budi

Kamis
07.00-08.30 Fisika, Bu Rina
08.30-10.00 Kimia`;

export const ImportScheduleModal: React.FC<ImportScheduleModalProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [replaceExisting, setReplaceExisting] = useState(false);

  const { rows, unrecognized } = useMemo(() => parseScheduleText(text), [text]);

  if (!isOpen) return null;

  const toggleExclude = (idx: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const includedRows = rows.filter((_, idx) => !excluded.has(idx));

  const handleImport = () => {
    if (includedRows.length === 0) return;
    onImport(includedRows, replaceExisting);
    setText('');
    setExcluded(new Set());
    setReplaceExisting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Impor Jadwal dari Teks</h2>
              <p className="text-xs text-slate-500">Tempel jadwalmu apa adanya, biar sistem yang merapikan per hari.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={7}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Satu sesi per baris. Tulis nama hari di depan baris, atau di baris tersendiri sebagai judul untuk beberapa baris di bawahnya. Format jam bebas: <code>07.00-08.30</code> atau <code>07:00 - 08:30</code>. Setelah jam, tambahkan mapel, lalu opsional guru & ruangan dipisah koma.
            </p>
          </div>

          {text.trim() && (
            <div className="space-y-3">
              {rows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {rows.length} sesi terbaca — centang yang mau dilewati
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {rows.map((row, idx) => {
                      const isExcluded = excluded.has(idx);
                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isExcluded ? 'border-slate-200 bg-slate-50 opacity-50' : 'border-slate-200 bg-white hover:border-indigo-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => toggleExclude(idx)}
                            className="w-3.5 h-3.5 accent-indigo-600"
                          />
                          <span className="font-bold text-slate-800 w-14 shrink-0">{row.day}</span>
                          <span className="font-mono text-slate-500 shrink-0">{row.startTime}–{row.endTime}</span>
                          <span className="text-slate-700 font-semibold truncate">{row.subject}</span>
                          {row.teacher && <span className="text-slate-400 truncate">· {row.teacher}</span>}
                          {row.room && <span className="text-slate-400 truncate">· {row.room}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {unrecognized.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {unrecognized.length} baris tidak terbaca, dilewati:
                  </span>
                  <ul className="text-[11px] text-amber-800 space-y-0.5">
                    {unrecognized.map((line, idx) => (
                      <li key={idx} className="font-mono truncate">{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rows.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="w-3.5 h-3.5 accent-rose-600"
                  />
                  <span className="flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Hapus semua jadwal lama sebelum mengimpor yang baru
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={includedRows.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
          >
            Impor {includedRows.length > 0 ? `${includedRows.length} Jadwal` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};