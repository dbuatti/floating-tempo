import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualFeedbackProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
  accentColor: string;
  onSeek?: (progress: number) => void;
  subdivisionProgress?: number; // 0 to 1
}

const VisualFeedback = ({ 
  currentBeat, 
  totalBeats, 
  isPlaying, 
  accentColor, 
  onSeek,
  subdivisionProgress = 0 
}: VisualFeedbackProps) => {
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    onSeek(progress);
  };

  return (
    <div className="flex flex-col items-center gap-16 py-10">
      <div className="flex flex-wrap justify-center gap-10">
        {Array.from({ length: totalBeats }).map((_, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isDownbeat = i === 0;
          
          return (
            <div key={i} className="relative flex items-center justify-center">
              {/* Radial Subdivision Ring */}
              {isActive && (
                <svg className="absolute w-16 h-16 -rotate-90 pointer-events-none">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeDasharray="175.9"
                    strokeDashoffset={175.9 * (1 - subdivisionProgress)}
                    className="opacity-20 transition-all duration-75 ease-linear"
                  />
                </svg>
              )}

              <motion.div
                animate={{
                  scale: isActive ? (isDownbeat ? 2.4 : 1.8) : 1,
                  backgroundColor: isActive 
                    ? accentColor 
                    : "rgba(255, 255, 255, 0.02)",
                  boxShadow: isActive 
                    ? `0 0 50px ${accentColor}88, inset 0 0 15px rgba(255,255,255,0.5)` 
                    : "inset 0 0 0px transparent",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  mass: 0.5
                }}
                className={cn(
                  "w-7 h-7 rounded-full transition-colors duration-200 relative z-10",
                  isDownbeat && !isActive && "border-2 border-white/5"
                )}
              />
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    style={{ backgroundColor: accentColor }}
                    className="absolute inset-0 rounded-full opacity-20"
                  />
                )}
              </AnimatePresence>

              <div 
                className={cn(
                  "absolute -bottom-8 text-[9px] font-black uppercase tracking-widest transition-all duration-500",
                  isActive ? "opacity-100 translate-y-0" : "opacity-20 translate-y-1"
                )}
                style={{ color: isActive ? accentColor : 'white' }}
              >
                {isDownbeat ? "Down" : i + 1}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="w-full max-w-2xl space-y-3">
        <div 
          className="relative h-4 bg-white/[0.02] rounded-2xl overflow-hidden border border-white/5 cursor-pointer group backdrop-blur-sm"
          onClick={handleProgressClick}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div 
            className="absolute top-0 left-0 h-full"
            style={{ 
              backgroundColor: accentColor, 
              boxShadow: `0 0 30px ${accentColor}`,
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent), ${accentColor}`
            }}
            animate={{ width: `${((currentBeat + 1) / totalBeats) * 100}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
          />
        </div>
        <div className="flex justify-between px-1">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10">Start</span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10">End</span>
        </div>
      </div>
    </div>
  );
};

export default VisualFeedback;