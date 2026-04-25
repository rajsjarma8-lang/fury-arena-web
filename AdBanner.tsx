
import React, { useEffect } from 'react';
import { Megaphone } from 'lucide-react';

interface AdBannerProps {
  slotId?: string; // Optional: If you have different ad slots
  format?: 'auto' | 'fluid' | 'rectangle';
}

const AdBanner: React.FC<AdBannerProps> = ({ slotId = "XXXXXXXXXX", format = "auto" }) => {
  return (
    <div className="w-full my-6 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden relative group">
      {/* Decorative Label */}
      <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-1 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest z-10 flex items-center gap-1 border border-slate-800">
        <Megaphone className="w-3 h-3" /> SPONSORED
      </div>

      {/* Generic Ad Placeholder */}
      <div className="flex items-center justify-center min-h-[100px] bg-slate-950/30 text-slate-700 text-sm font-bold uppercase tracking-widest">
        ADVERTISEMENT SPACE
      </div>
    </div>
  );
};

export default AdBanner;
