import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdOverlayProps {
  onComplete: () => void;
  onClose: () => void;
}

const AdOverlay: React.FC<AdOverlayProps> = ({ onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setIsFinished(true);
    }
  }, [timeLeft]);

  const handleFinish = () => {
    if (isFinished) {
      onComplete();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6"
    >
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {!isFinished ? (
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span className="text-white font-gaming text-sm">REWARD IN {timeLeft}S</span>
          </div>
        ) : (
          <button 
            onClick={onClose}
            className="p-2 bg-slate-900 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      <div className="max-w-md w-full space-y-6 text-center">
        {/* Placeholder for the real AdSense Banner */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-slate-800/50 p-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Advertisement
          </div>
          <div className="aspect-[9/16] bg-slate-950 flex flex-col items-center justify-center p-8 relative">
             {/* SIMULATED AD CONTENT */}
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
             </div>

             <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/40">
                   <ExternalLink className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-gaming font-bold italic uppercase text-white tracking-tight">Fury Arena Pro</h2>
                   <p className="text-slate-400 text-sm leading-relaxed">Join the world's most intense gaming tournaments. Win real coins and become elite!</p>
                </div>
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all active:scale-95">
                   INSTALL NOW
                </button>
             </div>
             
             {/* AdSense ins tag would go here in production */}
             {/* 
             <ins className="adsbygoogle"
                  style={{display:'block'}}
                  data-ad-client="ca-pub-6143426799651234"
                  data-ad-slot="0987654321"
                  data-ad-format="auto"
                  data-full-width-responsive="true"></ins>
             */}
          </div>
        </div>

        {isFinished ? (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleFinish}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] uppercase italic tracking-wider text-lg"
          >
            COLLECT 10 COINS
          </motion.button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Do not close this window to receive reward</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdOverlay;
