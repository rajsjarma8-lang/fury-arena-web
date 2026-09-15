
import React, { useState } from 'react';
import { User as UserType, AppSettings } from '../types';
import { Language } from '../translations';
import { User as UserIcon, LogOut, ShieldCheck, Instagram, Facebook, Youtube, ExternalLink, Gem, Coins, MessageCircle, Share2, Copy, CheckCircle2 } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralLink = `https://fury-arena-web.vercel.app/?ref=${user.id}`;

  const handleShare = () => {
    // We only put the message in text, and let the url parameter handle the link.
    // This prevents the duplicate link issue which causes WhatsApp to shrink the preview image.
    const shareMessage = `Play tournaments on Fury Arena and win real rewards! Sign up using my link below, or manually enter my Referral Code: ${user.id} during sign-up to get started!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Fury Arena',
        text: shareMessage,
        url: referralLink,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers without navigator.share
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + '\n' + referralLink)}`;
      window.location.href = whatsappUrl;
    }
  };

  const handleCopy = () => {
    const fullText = `Play tournaments on Fury Arena and win real rewards!\n\nReferral Code: ${user.id}\n\nLink: ${referralLink}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [codeCopied, setCodeCopied] = useState(false);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.id);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

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
        
        {/* REFERRAL SECTION */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-6 mt-6 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/20 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Share2 className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-gaming font-bold text-white italic tracking-tighter">REFER & EARN</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Get 20 <Gem className="w-3 h-3 inline text-cyan-400 mb-[2px]"/> for every friend!</p>
            </div>
          </div>
          
          <div className="mb-4 bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center relative z-10">
             <div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Your Referral Code</p>
                <p className="text-sm font-mono font-bold text-yellow-400">{user.id}</p>
             </div>
             <button onClick={handleCopyCode} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded uppercase font-bold hover:bg-slate-700 transition-colors">
                {codeCopied ? 'Copied!' : 'Copy'}
             </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <button 
              onClick={handleShare}
              className="flex-1 bg-green-500 text-slate-950 font-black py-3 rounded-xl uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Share WhatsApp
            </button>
            <button 
              onClick={handleCopy}
              className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
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
