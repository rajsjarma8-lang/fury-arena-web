
import React from 'react';
import { User as UserType, AppSettings } from '../types';
import { Language } from '../translations';
import { User as UserIcon, LogOut, ShieldCheck, Instagram, Facebook, Youtube, ExternalLink, Gem, Coins, MessageCircle } from 'lucide-react';

import AnimatedLogoutButton from './AnimatedLogoutButton';

interface ProfileViewProps {
  user: UserType | null;
  settings: AppSettings;
  onLogout: () => void;
  t: any;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  onSupportClick: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, settings, onLogout, t, currentLang, onLangChange, onSupportClick }) => {

  if (!user) return null;

  const socialChannels = [
    { name: 'Instagram', icon: Instagram, url: settings.instagramUrl, color: 'bg-gradient-to-br from-purple-600 to-pink-500', shadow: 'shadow-pink-500/20' },
    { name: 'Facebook', icon: Facebook, url: settings.facebookUrl, color: 'bg-[#1877F2]', shadow: 'shadow-blue-500/20' },
    { name: 'YouTube', icon: Youtube, url: settings.youtubeChannelUrl, color: 'bg-[#FF0000]', shadow: 'shadow-red-500/20' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <button 
            onClick={onSupportClick}
            className="p-2.5 bg-slate-950/50 text-slate-400 hover:text-green-500 hover:bg-green-500/10 rounded-xl border border-slate-800 transition-all active:scale-90"
            title="Support / Message Admin"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2 items-center">
            <AnimatedLogoutButton onLogout={onLogout} />
          </div>
        </div>

        <div className="flex flex-col items-center mb-8 mt-16 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-slate-800 bg-slate-950 overflow-hidden relative shadow-2xl">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-slate-800" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full border-2 border-slate-900 shadow-lg shadow-yellow-500/20">PRO</div>
          </div>
          <div className="text-center mt-6">
            <h2 className="text-3xl font-gaming font-bold text-white italic tracking-tighter">{user.name}</h2>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>{t.verified}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
               <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.coins}</p>
              <p className="text-xl font-gaming font-bold text-white italic">{user.coins || 0}</p>
            </div>
          </div>
          <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
               <Gem className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.kohinoor}</p>
              <p className="text-xl font-gaming font-bold text-white italic">{user.diamonds || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.ff_uid}</span>
            <p className="text-xs font-gaming font-bold text-cyan-400 italic">{user.freeFireId || t.not_enlisted}</p>
          </div>
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.location}</span>
            <p className="text-xs font-gaming font-bold text-green-500 italic">{user.permanent_location || t.detecting}</p>
          </div>
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:border-yellow-500/30 transition-all">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.mobile}</span>
            <div className="flex items-center gap-3">
              <p className={`text-xs font-gaming font-bold italic ${user.phone_number ? 'text-yellow-500' : 'text-red-500/70'}`}>
                {user.phone_number || t.not_linked}
              </p>
              {!user.phone_number && (
                <button 
                  onClick={onSupportClick}
                  className="text-[8px] font-black bg-yellow-500 text-slate-950 px-2 py-1 rounded-md uppercase tracking-tighter hover:bg-yellow-400 transition-colors"
                >
                  Link Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-gaming font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2 mb-6">
          <span className="w-6 h-[2px] bg-yellow-500/30"></span> {t.network}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {socialChannels.map((social) => {
            const Icon = social.icon;
            const hasUrl = social.url && social.url.trim() !== '';
            return (
              <a key={social.name} href={hasUrl ? social.url : '#'} target={hasUrl ? "_blank" : "_self"} rel="noopener noreferrer" className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300 group ${hasUrl ? `bg-slate-900 border-slate-800 hover:border-white/20 shadow-xl ${social.shadow}` : 'bg-slate-900/50 border-slate-800/50 opacity-40 cursor-not-allowed'}`}>
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${social.color} text-white shadow-lg`}><Icon className="w-6 h-6" /></div>
                  <div>
                    <h4 className="text-lg font-bold text-white font-gaming tracking-tight">{social.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.official_feed}</p>
                  </div>
                </div>
                {hasUrl && <ExternalLink className="w-4 h-4 text-slate-500" />}
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-widest pt-4">
        {t.stark_id}: {user.id} <br/> 
        {t.version} v2.5.0 <br/>
        <span className="text-slate-800">{t.debug}: {user.country || 'NONE'}</span>
      </p>
    </div>
  );
};

export default ProfileView;
