
import React from 'react';
import { Home, Swords, Gift, User, Gamepad2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'play' | 'gift' | 'profile';
  setActiveTab: (tab: 'home' | 'play' | 'gift' | 'profile') => void;
  t: any;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, t }) => {
  const tabs = [
    { id: 'home', icon: Home, label: t.home },
    { id: 'play', icon: Swords, label: t.play },
    { id: 'gift', icon: Gift, label: t.rewards },
    { id: 'profile', icon: User, label: t.profile }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-[90]">
      <div 
        className="bg-[#020617]/90 backdrop-blur-xl border-t border-slate-800 p-1 flex items-center justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          paddingTop: '8px'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex flex-col items-center gap-1 p-1 flex-1 transition-all duration-300 group ${isActive ? 'text-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className={`p-1 rounded-lg transition-all duration-300 ${isActive ? 'bg-yellow-500/10 -translate-y-0.5' : ''}`}>
                 <Icon className={`w-5 h-5 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]' : ''}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-white' : 'scale-90 opacity-70'}`}>
                {tab.label}
              </span>
              
              {isActive && (
                <span className="absolute -top-2 w-6 h-0.5 bg-yellow-500 rounded-b-full shadow-[0_0_10px_#eab308]"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
