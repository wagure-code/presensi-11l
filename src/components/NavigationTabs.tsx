import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  Sparkles, 
  UserCheck, 
  AlertCircle,
  Users
} from 'lucide-react';

export type TabType = 'dashboard' | 'schedule' | 'homework' | 'duty' | 'attendance' | 'students';

interface NavigationTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingHomeworkCount: number;
  urgentHomeworkCount: number;
  isDutyToday: boolean;
  hasPresensiToday: boolean;
  isGuru?: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  pendingHomeworkCount,
  urgentHomeworkCount,
  isDutyToday,
  hasPresensiToday,
  isGuru = false,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'schedule' as TabType,
      label: 'Jadwal Pelajaran',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'homework' as TabType,
      label: 'PR & Tugas',
      icon: CheckSquare,
      badge: pendingHomeworkCount > 0 ? {
        count: pendingHomeworkCount,
        isUrgent: urgentHomeworkCount > 0,
      } : null,
    },
    {
      id: 'duty' as TabType,
      label: 'Jadwal Piket',
      icon: Sparkles,
      badge: isDutyToday ? { text: 'Hari Ini', isSpecial: true } : null,
    },
    {
      id: 'attendance' as TabType,
      label: 'Presensi',
      icon: UserCheck,
      badge: !hasPresensiToday && !isGuru ? { text: 'Belum', isWarning: true } : null,
    },
    ...(isGuru ? [{
      id: 'students' as TabType,
      label: 'Panel Admin',
      icon: Users,
      badge: null,
    }] : []),
  ];

  return (
    <>
      {/* Desktop Top Navigation Bar */}
      <nav className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all relative cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>

                  {/* Badges */}
                  {item.badge && 'count' in item.badge && (
                    <span
                      className={`ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badge.isUrgent
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {item.badge.count}
                    </span>
                  )}
                  {item.badge && 'text' in item.badge && (
                    <span
                      className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badge.isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className={`grid gap-1 ${navItems.length === 6 ? 'grid-cols-6' : 'grid-cols-5'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors cursor-pointer ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.badge && 'count' in item.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 text-[9px] font-bold min-w-[15px] h-[15px] flex items-center justify-center rounded-full px-1 ${
                        item.badge.isUrgent ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {item.badge.count}
                    </span>
                  )}
                  {item.badge && 'text' in item.badge && item.badge.isWarning && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                  {item.badge && 'text' in item.badge && item.badge.isSpecial && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>
                <span className="text-[10px] mt-1 truncate max-w-full leading-none">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
