import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualFeedbackProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
  accentColor: string;
}

const VisualFeedback = ({ currentBeat, totalBeats, isPlaying, accentColor }: VisualFeedbackProps) => {
  return (
    <div className="flex flex-col items-center gap-12 py-10">
      <div className="flex flex-wrap justify-center gap-8">
        {Array.from({ length: totalBeats }).map((_, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isDownbeat = i === 0;
          
          return (
            <div key={i} className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isActive ? (isDownbeat ? 2.2 : 1.6) : 1,
                  backgroundColor: isActive 
                    ? accentColor 
                    : "rgba(255, 255, 255, 0.03)",
                  boxShadow: isActive 
                    ? `0 0 40px ${accentColor}66` 
                    : "0 0 0px transparent",
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  mass: 0.8
                }}
                className={cn(
                  "w-6 h-6 rounded-full transition-colors duration-200",
                  isDownbeat && !isActive && "border border-white/10"
                )}
              />
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ backgroundColor: accentColor }}
                    className="absolute inset-0 rounded-full opacity-20"
                  />
                )}
              </AnimatePresence>

              {isDownbeat && (
                <div 
                  className="absolute -bottom-6 text-[10px] font-black uppercase tracking-tighter transition-colors duration-500"
                  style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.2)' }}
                >
                  Downbeat
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="relative w-full max-w-2xl h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="absolute top-0 left-0 h-full shadow-lg"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 20px ${accentColor}` }}
          animate={{ width: `${((currentBeat + 1) / totalBeats) * 100}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.15 }}
        />
      </div>
    </div>
  );
};

export default VisualFeedback;