
import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Ghost, Trophy, Zap, Swords } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-red-600/10 blur-[120px] rounded-full animate-pulse"></div>
      
      {/* Main Animation Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
         
         {/* Gaming Cartoon Animation */}
         <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Floating Icons */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1, x: -60, y: -60 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute text-yellow-500"
            >
              <Zap className="w-8 h-8" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1, x: 60, y: -60 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute text-red-500"
            >
              <Swords className="w-8 h-8" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1, x: -60, y: 60 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute text-blue-500"
            >
              <Trophy className="w-8 h-8" />
            </motion.div>

            {/* Central Character (Ghost) */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative z-20"
            >
              <div className="relative">
                <Ghost className="w-24 h-24 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                {/* Eyes Animation */}
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
                  className="absolute top-7 left-6 w-2 h-2 bg-slate-950 rounded-full"
                />
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
                  className="absolute top-7 right-6 w-2 h-2 bg-slate-950 rounded-full"
                />
              </div>
            </motion.div>

            {/* Controller Orbiting */}
            <motion.div
              animate={{ 
                rotate: 360 
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-40 h-40 border border-dashed border-slate-800 rounded-full"
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 p-2 rounded-lg border border-slate-800 shadow-lg"
              >
                <Gamepad2 className="w-6 h-6 text-red-500" />
              </motion.div>
            </motion.div>
         </div>

         {/* Subtext Status */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1 }}
           className="mt-12 flex flex-col items-center gap-4"
         >
            <div className="flex items-center gap-4">
               <div className="flex gap-1">
                  <span className="w-1 h-4 bg-red-600 skew-x-[-12deg]"></span>
                  <span className="w-1 h-4 bg-red-600 skew-x-[-12deg] opacity-50"></span>
               </div>
               <p className="text-white text-[10px] sm:text-xs font-gaming font-bold uppercase tracking-[0.4em] sm:tracking-[0.6em] italic">
                  Loading Arena...
               </p>
               <div className="flex gap-1">
                  <span className="w-1 h-4 bg-yellow-500 skew-x-[-12deg] opacity-50"></span>
                  <span className="w-1 h-4 bg-yellow-500 skew-x-[-12deg]"></span>
               </div>
            </div>
            
            {/* Loading Bar */}
            <div className="w-48 sm:w-64 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-[1px]">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 2.5, ease: "easeInOut" }}
                 className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-full"
               />
            </div>
         </motion.div>

      </div>

      <style>{`
        @font-face {
          font-family: 'Gaming';
          src: url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
