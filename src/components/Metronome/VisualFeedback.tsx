import React from 'react';
import { cn } from '@/lib/utils';

interface VisualFeedbackProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
}

const VisualFeedback = ({ currentBeat, totalBeats, isPlaying }: VisualFeedbackProps) => {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="flex gap-4">
        {Array.from({ length: totalBeats }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-6 h-6 rounded-full transition-all duration-75",
              isPlaying && currentBeat === i 
                ? (i === 0 ? "bg-primary scale-150 shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "bg-primary/60 scale-125")
                : "bg-muted"
            )}
          />
        ))}
      </div>
      
      <div className="relative w-full max-w-md h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${(currentBeat / totalBeats) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default VisualFeedback;