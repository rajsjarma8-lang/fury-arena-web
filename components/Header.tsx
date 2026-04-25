
import React from 'react';
import { User, AppNotification, AppSettings } from '../types';
import { Settings, Trophy, Bell, Gem } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onAdminClick: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  t: any;
  settings: AppSettings;
}

const Header: React.FC<HeaderProps> = ({ user, onAdminClick, notifications = [], onOpenNotifications, t, settings }) => {
  const unreadNotificationsCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  return (
    <header 
      className="fixed top-0 left-0 w-full z-50 px-4 bg-[#020617]/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl transition-all duration-300"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        paddingBottom: '8px'
      }}
    >
      <div className="container mx-auto flex items-center justify-between max-w-2xl">
        <div className="flex items-center gap-2 group">
          {settings.appLogo ? (
            <img 
              src={settings.appLogo} 
              alt="Logo" 
              className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
              style={{ 
                height: `${1.8 * ((settings.logoScale || 100) / 100)}rem`,
                width: 'auto',
                maxWidth: '140px'
              }}
            />
          ) : (
            <div className="bg-red-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] group-hover:scale-110 transition-transform">
              <Trophy className="text-white w-4 h-4" />
            </div>
          )}
          <h1 className="text-lg font-gaming font-bold tracking-tighter italic">
            <span className="text-red-600">FURY</span><span className="text-yellow-500">ARENA</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {user && (
             <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-cyan-500/20">
               <Gem className="w-3 h-3 text-cyan-400" />
               <span className="text-[10px] font-gaming font-bold text-white">{user.diamonds || 0}</span>
             </div>
          )}

          <button 
            onClick={onOpenNotifications}
            className={`relative p-1.5 rounded-lg border border-slate-800 transition-all ${unreadNotificationsCount > 0 ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadNotificationsCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#020617] shadow-lg shadow-red-500/20">
                  {unreadNotificationsCount}
                </span>
                <span className="absolute inset-0 bg-yellow-500/20 blur-md rounded-lg animate-pulse"></span>
              </>
            )}
          </button>

          {user?.isAdmin && (
            <button 
              onClick={onAdminClick}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition text-[9px] font-black border border-slate-800 text-yellow-500 uppercase tracking-widest"
            >
              <Settings className="w-3.5 h-3.5" /> {t.admin}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
