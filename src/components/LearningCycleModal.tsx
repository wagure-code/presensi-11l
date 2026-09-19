import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Laptop, 
  Sparkles, 
  Video, 
  MapPin, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';
import { LearningCycleState, LearningMode } from '../types';
import { initialLearningCycle } from '../data/initialData';

interface LearningCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  learningCycle?: LearningCycleState;
  cycle?: LearningCycleState;
  onSave?: (cycle: LearningCycleState) => void;
  onSaveLearningCycle?: (cycle: LearningCycleState) => void;
}

export const LearningCycleModal: React.FC<LearningCycleModalProps> = ({
  isOpen,
  onClose,
  learningCycle,
  cycle,
  onSave,
  onSaveLearningCycle,
}) => {
  const activeCycle = learningCycle || cycle || initialLearningCycle;

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(
    activeCycle?.currentMonthInCycle || (activeCycle?.currentMode === 'online' ? 1 : 3)
  );
  const [defaultMeetLink, setDefaultMeetLink] = useState(
    activeCycle?.defaultMeetLink || 'https://meet.google.com/xii-mipa2-kelas'
  );
  const [cycleNotes, setCycleNotes] = useState(
    activeCycle?.cycleNotes || 'Siklus hybrid kelas: 2 bulan pembelajaran online dari rumah, diikuti 1 bulan tatap muka langsung di sekolah.'
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedMonthIndex(activeCycle?.currentMonthInCycle || (activeCycle?.currentMode === 'online' ? 1 : 3));
      setDefaultMeetLink(activeCycle?.defaultMeetLink || 'https://meet.google.com/xii-mipa2-kelas');
      setCycleNotes(activeCycle?.cycleNotes || 'Siklus hybrid kelas: 2 bulan pembelajaran online dari rumah, diikuti 1 bulan tatap muka langsung di sekolah.');
    }
  }, [isOpen, activeCycle]);

  if (!isOpen) return null;

  const currentModeDerived: LearningMode = selectedMonthIndex <= 2 ? 'online' : 'offline';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LearningCycleState = {
      ...activeCycle,
      currentMode: currentModeDerived,
      currentMonthInCycle: selectedMonthIndex,
      defaultMeetLink: defaultMeetLink.trim(),
      cycleNotes: cycleNotes.trim(),
    };
    if (onSave) onSave(updated);
    if (onSaveLearningCycle) onSaveLearningCycle(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${learningCycle.currentMode === 'online' ? 'bg-cyan-50 text-cyan-700' : 'bg-indigo-50 text-indigo-700'}`}>
              {learningCycle.currentMode === 'online' ? <Globe className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Siklus Belajar Kelas Hybrid
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pola Pembelajaran: <strong>2 Bulan Online</strong> & <strong>1 Bulan Offline</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* 3-Month Cycle Visualization Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Pilih Periode Bulan yang Sedang Berjalan:
            </label>
            
            <div className="grid grid-cols-3 gap-2.5">
              
              {/* Month 1: Online */}
              <button
                type="button"
                onClick={() => setSelectedMonthIndex(1)}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  selectedMonthIndex === 1
                    ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    Bulan 1
                  </span>
                  <Globe className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Daring (Online)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Google Meet & PJJ</p>
                {selectedMonthIndex === 1 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-cyan-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Bulan Aktif</span>
                  </div>
                )}
              </button>

              {/* Month 2: Online */}
              <button
                type="button"
                onClick={() => setSelectedMonthIndex(2)}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  selectedMonthIndex === 2
                    ? 'bg-cyan-50/80 border-cyan-400 ring-2 ring-cyan-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    Bulan 2
                  </span>
                  <Globe className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Daring (Online)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Google Meet & PJJ</p>
                {selectedMonthIndex === 2 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-cyan-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Bulan Aktif</span>
                  </div>
                )}
              </button>

              {/* Month 3: Offline */}
              <button
                type="button"
                onClick={() => setSelectedMonthIndex(3)}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  selectedMonthIndex === 3
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Bulan 3
                  </span>
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Tatap Muka</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Di Sekolah (Offline)</p>
                {selectedMonthIndex === 3 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Bulan Aktif</span>
                  </div>
                )}
              </button>

            </div>
          </div>

          {/* Explanation Banner Based on Active Mode */}
          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
            currentModeDerived === 'online'
              ? 'bg-cyan-50/50 border-cyan-200 text-cyan-950'
              : 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">
                {currentModeDerived === 'online' ? (
                  <Laptop className="w-4 h-4 text-cyan-700" />
                ) : (
                  <Building2 className="w-4 h-4 text-indigo-700" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {currentModeDerived === 'online'
                    ? `Mode Daring Aktif (Bulan ke-${selectedMonthIndex} dari 2 Bulan Online)`
                    : 'Mode Tatap Muka Aktif (1 Bulan Offline di Sekolah)'}
                </p>
                <p className="mt-1 text-slate-600">
                  {currentModeDerived === 'online'
                    ? 'Pada masa Daring, KBM berlangsung virtual lewat Google Meet / Classroom. Presensi diisi secara online dari rumah, dan jadwal piket kebersihan kelas fisik di sekolah diliburkan.'
                    : 'Pada masa Tatap Muka (Luring), seluruh siswa wajib hadir di sekolah sebelum pukul 07:00, ruang kelas fisik aktif, dan jadwal piket kebersihan kelas berlaku normal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Differences Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Penyesuaian Sistem Berdasarkan Mode Siklus:</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-3 p-2.5">
                <span className="font-semibold text-slate-500">Fitur</span>
                <span className="font-bold text-cyan-800">Mode 2 Bulan Online</span>
                <span className="font-bold text-indigo-800">Mode 1 Bulan Offline</span>
              </div>
              <div className="grid grid-cols-3 p-2.5 text-slate-700">
                <span className="font-medium text-slate-500">Jadwal Belajar</span>
                <span>Tautan Google Meet / Zoom</span>
                <span>Ruang Kelas & Lab Fisik</span>
              </div>
              <div className="grid grid-cols-3 p-2.5 text-slate-700">
                <span className="font-medium text-slate-500">Piket Kebersihan</span>
                <span className="text-amber-700 font-semibold">Diliburkan (Nonaktif)</span>
                <span className="text-emerald-700 font-semibold">Aktif Sesuai Regu</span>
              </div>
              <div className="grid grid-cols-3 p-2.5 text-slate-700">
                <span className="font-medium text-slate-500">Presensi Harian</span>
                <span>Mandiri Daring dari Rumah</span>
                <span>Tatap Muka di Sekolah</span>
              </div>
            </div>
          </div>

          {/* Default Google Meet Link Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tautan Utama Kelas Virtual (Google Meet / Zoom)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Video className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={defaultMeetLink}
                  onChange={(e) => setDefaultMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Tautan ini digunakan sebagai pintasan cepat bergabung ke ruang kelas virtual pada dashboard siswa.
            </span>
          </div>

          {/* Cycle Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Khusus Siklus Kelas (Opsional)
            </label>
            <textarea
              rows={2}
              value={cycleNotes}
              onChange={(e) => setCycleNotes(e.target.value)}
              placeholder="Contoh: Bulan Agustus - September Daring, Bulan Oktober Tatap Muka PTM..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Modal Actions */}
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
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              Terapkan Pengaturan Siklus
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
