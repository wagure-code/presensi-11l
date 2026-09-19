import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Check, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  UserCheck, 
  Volume2, 
  ExternalLink,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { NotificationItem } from '../types';
import { soundManager } from '../utils/audio';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigateToHomework: (id?: string) => void;
  onNavigateToAttendance: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigateToHomework,
  onNavigateToAttendance,
}) => {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayList = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const requestBrowserNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserPerm(res);
        if (res === 'granted') {
          soundManager.playSuccess();
          new Notification('Portal Siswa Aktif!', {
            body: 'Notifikasi pengingat tenggat waktu dan jadwal akademik berhasil diaktifkan.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.error('Error requesting notification permission', err);
      }
    }
  };

  const handleTestChime = () => {
    soundManager.playNotification();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[85vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Notifikasi & Pengingat Tugas
              </h2>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} pengingat belum dibaca` : 'Semua pengingat telah dibaca'}
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

        {/* Action toolbar & permission banner */}
        <div className="py-3 border-b border-slate-100 flex-shrink-0 space-y-2">
          
          {/* Permission bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Pengingat Browser: <strong className="capitalize font-semibold">{browserPerm}</strong></span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTestChime}
                className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                title="Cek Suara Bell"
              >
                <Volume2 className="w-3 h-3 text-indigo-600" />
                <span>Uji Bel</span>
              </button>

              {browserPerm !== 'granted' && (
                <button
                  onClick={requestBrowserNotification}
                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Izinkan Notifikasi
                </button>
              )}
            </div>
          </div>

          {/* Filters & Mark all read */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterUnreadOnly(false)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  !filterUnreadOnly ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilterUnreadOnly(true)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterUnreadOnly ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {displayList.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada notifikasi saat ini</p>
              <p className="text-xs text-slate-500 mt-1">Kamu sudah up-to-date dengan semua kewajiban akademik.</p>
            </div>
          ) : (
            displayList.map((notif) => {
              const isOverdue = notif.type === 'overdue';
              const isDeadline = notif.type === 'deadline';
              const isPiket = notif.type === 'piket';
              const isPresensi = notif.type === 'presensi';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    notif.isRead
                      ? 'bg-slate-50/70 border-slate-200 opacity-75'
                      : isOverdue
                      ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                      : isDeadline
                      ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                      : isPiket
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-indigo-50/40 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-700'
                          : isDeadline
                          ? 'bg-amber-100 text-amber-700'
                          : isPiket
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isOverdue && <AlertTriangle className="w-4 h-4" />}
                      {isDeadline && <Clock className="w-4 h-4" />}
                      {isPiket && <Sparkles className="w-4 h-4" />}
                      {isPresensi && <UserCheck className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-400 font-mono">
                          {notif.timestamp}
                        </span>

                        <div className="flex items-center gap-2">
                          {notif.homeworkId && (
                            <button
                              onClick={() => {
                                onNavigateToHomework(notif.homeworkId);
                                onClose();
                              }}
                              className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Buka Tugas</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {isPresensi && (
                            <button
                              onClick={() => {
                                onNavigateToAttendance();
                                onClose();
                              }}
                              className="font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Isi Presensi</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {!notif.isRead && (
                            <button
                              onClick={() => onMarkRead(notif.id)}
                              className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                            >
                              Tandai Dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
