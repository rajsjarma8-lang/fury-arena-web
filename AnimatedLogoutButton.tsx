
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';

interface AnimatedLogoutButtonProps {
  onLogout: () => void;
}

const AnimatedLogoutButton: React.FC<AnimatedLogoutButtonProps> = ({ onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Wait for animation to complete before calling onLogout
    setTimeout(() => {
      onLogout();
    }, 1200);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="relative flex items-center bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
      style={{ minWidth: '100px', height: '36px' }}
    >
      {/* Text Section */}
      <div className="flex-grow px-3 flex items-center justify-center">
        <span className="text-black font-gaming font-bold text-[10px] uppercase tracking-tight">
          Log Out
        </span>
      </div>

      {/* Icon Section (Purple-Blue Door) */}
      <div className="w-10 h-full bg-[#4F46E5] flex items-center justify-center relative overflow-hidden">
        {/* Door Frame */}
        <div className="w-5 h-6 border-2 border-white/30 rounded-sm relative">
          {/* Door */}
          <motion.div
            initial={{ rotateY: 0 }}
            animate={isLoggingOut ? { rotateY: -110 } : { rotateY: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: 'left' }}
            className="absolute inset-0 bg-[#4F46E5] border border-white/50 rounded-sm z-20"
          />
          
          {/* Person Icon */}
          <motion.div
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={isLoggingOut ? { 
              x: [0, 10, 15, 15], 
              y: [0, 0, 8, 40],
              rotate: [0, 0, 15, 90],
              scale: [1, 1, 1, 0.8],
              opacity: [1, 1, 1, 0] 
            } : { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            transition={isLoggingOut ? {
              times: [0, 0.3, 0.5, 1],
              duration: 1,
              ease: ["easeOut", "easeIn", "circIn"]
            } : { duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="w-2.5 h-4 relative">
              {/* Simple Person Shape */}
              <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto shadow-sm" /> {/* Head */}
              <div className="w-2.5 h-2.5 bg-white rounded-sm mt-0.5 shadow-sm" /> {/* Body */}
              
              {/* Legs (Animated walking) */}
              <motion.div 
                animate={isLoggingOut ? { rotate: [0, 20, -20, 0] } : {}}
                transition={{ repeat: 2, duration: 0.2 }}
                className="flex justify-between px-0.5 mt-[-1px]"
              >
                <div className="w-0.5 h-1 bg-white/80 rounded-full" />
                <div className="w-0.5 h-1 bg-white/80 rounded-full" />
              </motion.div>
            </div>
          </motion.div>

          {/* Dust/Impact Effect */}
          <AnimatePresence>
            {isLoggingOut && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="absolute bottom-1 right-2 w-4 h-1 bg-white/20 rounded-full blur-sm pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay for active state */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/10 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </button>
  );
};

export default AnimatedLogoutButton;
