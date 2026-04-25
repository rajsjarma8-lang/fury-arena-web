
import React from 'react';
import { AudiencePlayer } from '../types';

interface AudienceCardProps {
  player: AudiencePlayer;
}

const AudienceCard: React.FC<AudienceCardProps> = ({ player }) => {
  return (
    <div className="group perspective-1000 h-full">
      <div className="relative w-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(10deg)_rotateX(5deg)]">
        {/* Card Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group-hover:border-yellow-500/50 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all flex flex-col">
          
          {/* Player Image Section */}
          <div className="relative aspect-square overflow-hidden bg-slate-950">
            <img 
              src={player.photo} 
              alt={player.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            {/* Subtle Gradient on Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
          </div>
          
          {/* Info Box Section (Below Photo) - Ultra compact */}
          <div className="p-0.5 bg-slate-950 border-t border-slate-800/50 relative">
            {/* Country Flag - Integrated into the box with ultra-tight positioning */}
            <div className="absolute top-0.5 right-0.5 px-0.5 py-0.5 bg-slate-900 rounded border border-white/5 shadow-inner">
              <span className="text-[6px] leading-none">{player.country === 'ID' ? '🇮🇩' : '🇮🇳'}</span>
            </div>

            <div className="pr-3 pl-1 py-0.5">
              <h4 className="text-white font-gaming text-[8px] font-bold truncate italic tracking-tight leading-none">
                {player.name}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-0.5 h-0.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_2px_#eab308]"></div>
                <p className="text-[5px] text-yellow-500 font-black tracking-[0.05em] uppercase truncate opacity-60">
                  {player.ffId}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating PRO Badge - Scaled down for better fit */}
        <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center -rotate-12 border-2 border-slate-900 shadow-lg transform translate-z-40 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="text-[7px] font-black text-slate-950">PRO</span>
        </div>
      </div>
    </div>
  );
};

export default AudienceCard;
