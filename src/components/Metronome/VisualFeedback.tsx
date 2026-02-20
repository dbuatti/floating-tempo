import React from 'react';
import { cn } from '@/lib/utils';

interface VisualFeedbackProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
}

const VisualFeedback = ({ currentBeat, totalBeats, isPlaying }: VisualFeedbackProps) => {
  return (
    <div className="flex flex-col items-center gap-10 py-8">
      <div className="flex flex-wrap justify-center gap-5">
        {Array.from({ length: totalBeats }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full transition-all duration-150 relative",
              isPlaying && currentBeat === i 
                ? (i === 0 
                    ? "bg-primary scale-[1.75] shadow-[0_0_30px_rgba(168,85,247,0.8)]" 
                    : "bg-primary/80 scale-150 shadow-[0_0_20px_rgba(168,85,247,0.4)]")
                : "bg-white/10 scale-100"
            )}
          >
            {isPlaying && currentBeat === i && (
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
            )}
          </div>
        ))}
      </div>
      
      <div className="relative w-full max-w-lg h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          style={{ width: `${((currentBeat + 1) / totalBeats) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default VisualFeedback;