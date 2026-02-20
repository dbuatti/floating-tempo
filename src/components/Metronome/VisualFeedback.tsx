import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualFeedbackProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
}

const VisualFeedback = ({ currentBeat, totalBeats, isPlaying }: VisualFeedbackProps) => {
  return (
    <div className="flex flex-col items-center gap-12 py-10">
      <div className="flex flex-wrap justify-center gap-6">
        {Array.from({ length: totalBeats }).map((_, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isDownbeat = i === 0;
          
          return (
            <div key={i} className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isActive ? (isDownbeat ? 1.8 : 1.4) : 1,
                  backgroundColor: isActive 
                    ? (isDownbeat ? "rgb(168, 85, 247)" : "rgba(168, 85, 247, 0.6)") 
                    : "rgba(255, 255, 255, 0.05)",
                }}
                className={cn(
                  "w-5 h-5 rounded-full transition-colors duration-200",
                  isDownbeat && !isActive && "border border-white/10"
                )}
              />
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-primary/40"
                  />
                )}
              </AnimatePresence>

              {isDownbeat && (
                <div className="absolute -bottom-4 text-[8px] font-black text-primary/40 uppercase tracking-tighter">
                  1
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="relative w-full max-w-xl h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          animate={{ width: `${((currentBeat + 1) / totalBeats) * 100}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.1 }}
        />
      </div>
    </div>
  );
};

export default VisualFeedback;