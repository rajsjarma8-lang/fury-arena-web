
import React, { useState, useEffect, useRef } from 'react';
import { Radio, Trophy, Loader2, RefreshCw, Play, ExternalLink } from 'lucide-react';
import { AudiencePlayer, AppSettings } from '../types';
import AudienceCard from './AudienceCard';
import { motion, AnimatePresence } from 'motion/react';

interface PlayVideoBoardProps {
  videoUrl: string;
  audiencePlayers: AudiencePlayer[];
  settings?: AppSettings;
}

const PlayVideoBoard: React.FC<PlayVideoBoardProps> = ({ videoUrl, audiencePlayers, settings }) => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset states when the URL changes
  useEffect(() => {
    if (videoUrl) {
      setVideoError(false);
      setIsVideoLoading(true);
      setIsPlaying(false);
      
      const safetyTimer = setTimeout(() => {
        setIsVideoLoading(false);
      }, 7000);

      return () => clearTimeout(safetyTimer);
    }
  }, [videoUrl]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Helper to chunk players into groups of 4 (Squads)
  const chunkedPlayers = [];
  for (let i = 0; i < audiencePlayers.length; i += 4) {
    chunkedPlayers.push(audiencePlayers.slice(i, i + 4));
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Video Section Wrapper with Enhanced Cyber-Lighting */}
      <div className="relative w-full aspect-video group">
        {/* Extreme Dynamic Background Glow */}
        <div className="absolute -inset-8 bg-gradient-to-r from-red-600/30 via-yellow-500/20 to-purple-600/30 blur-[100px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 animate-pulse"></div>
        
        {/* Cyber Frame Border */}
        <div className="absolute inset-0 rounded-[2.6rem] bg-gradient-to-r from-red-600 via-yellow-500 to-purple-600 p-[2px] shadow-[0_0_50px_rgba(220,38,38,0.15)]">
          <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-black shadow-2xl">
            
            {videoUrl ? (
              <>
                <AnimatePresence>
                  {isVideoLoading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020617]/95 backdrop-blur-2xl"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-600/30 blur-2xl animate-pulse"></div>
                        <div className="w-20 h-20 border-2 border-red-600/20 rounded-full flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-red-600 animate-spin relative z-10" />
                        </div>
                      </div>
                      <div className="mt-8 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] animate-pulse">Establishing Feed</span>
                        <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-red-600"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!videoError ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      key={videoUrl}
                      className="w-full h-full object-cover"
                      src={videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      controls={false}
                      onLoadedMetadata={() => setIsVideoLoading(false)}
                      onCanPlay={() => setIsVideoLoading(false)}
                      onPlay={() => setIsPlaying(true)}
                      onError={() => {
                        setVideoError(true);
                        setIsVideoLoading(false);
                      }}
                    ></video>

                    {/* Subtle Play Button Overlay */}
                    {!isPlaying && !isVideoLoading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handlePlayClick}
                          className="w-16 h-16 text-white/20 hover:text-white/40 transition-colors"
                        >
                          <Play className="w-full h-full fill-current" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/30 backdrop-blur-md">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-red-600/20 blur-2xl animate-pulse"></div>
                      <Radio className="w-16 h-16 text-red-500 relative z-10" />
                    </div>
                    <h3 className="text-red-500 font-gaming font-bold italic text-lg uppercase tracking-widest">SIGNAL TERMINATED</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-3 tracking-[0.2em]">Neural Link Interference Detected</p>
                    <button 
                      onClick={() => setVideoError(false)} 
                      className="mt-8 px-8 py-3 bg-red-600 text-white rounded-full font-gaming font-bold italic text-xs uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-3"
                    >
                      <RefreshCw className="w-4 h-4"/> RECONNECT
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AdMob Style Banner Segment - Admin Controlled */}
      {settings?.playBannerMedia && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-2 mb-2"
        >
          <a 
            href={settings.playBannerLink || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl active:scale-[0.98] transition-transform"
          >
            <div className="relative w-full h-[75px] sm:h-[105px]">
              {settings.playBannerType === 'video' ? (
                <video 
                  src={settings.playBannerMedia} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <img 
                  src={settings.playBannerMedia} 
                  className="w-full h-full object-cover" 
                  alt="Advertisement" 
                />
              )}
              {/* Subtle Ad Badge like AdMob */}
              <div className="absolute top-1 right-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-white/70 font-bold uppercase tracking-widest border border-white/5 pointer-events-none">
                Ad
              </div>
            </div>
          </a>
        </motion.div>
      )}

      {/* Audience Roster - Premium Redesign */}
      <div className="space-y-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.15)] border border-white/10">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-gaming font-bold text-white italic tracking-tighter uppercase leading-none mb-0.5">BATTLE ELITE</h2>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.15em]">Verified Combatants Online</p>
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg">
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">{audiencePlayers.length} ACTIVE</span>
          </div>
        </div>

        {audiencePlayers.length === 0 ? (
          <div className="py-24 text-center border border-slate-800 rounded-[3rem] bg-slate-900/20 backdrop-blur-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.03)_0%,transparent_70%)]"></div>
             <p className="text-slate-600 font-black uppercase text-[11px] tracking-[0.4em] relative z-10">Scouting for Elite Personnel...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {chunkedPlayers.map((group, groupIndex) => {
              const squadCountry = group[0]?.country;
              return (
                <div key={groupIndex} className="relative">
                  {/* Squad Header with Flag */}
                  <div className="flex items-center gap-4 mb-4 px-4">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-xl shadow-xl relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {squadCountry === 'ID' ? '🇮🇩' : '🇮🇳'}
                    </div>
                    <div>
                      <h3 className="text-white font-gaming font-bold italic uppercase text-[10px] tracking-[0.2em]">SQUAD {groupIndex + 1}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                          {squadCountry === 'ID' ? 'INDONESIA' : 'INDIA'} DIVISION
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 relative z-10">
                    {group.map((player) => (
                      <AudienceCard key={player.id} player={player} />
                    ))}
                  </div>
                  
                  {groupIndex < chunkedPlayers.length - 1 && (
                    <div className="relative py-4 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800/50 to-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          from { top: -10%; }
          to { top: 110%; }
        }
      `}} />
    </div>
  );
};

export default PlayVideoBoard;
