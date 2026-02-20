import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PracticeTimerProps {
  onTimeUp: () => void;
  isActive: boolean;
}

const PracticeTimer = ({ onTimeUp, isActive }: PracticeTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (mins: number) => {
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    setIsRunning(true);
  };

  return (
    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
      <div className="flex items-center gap-2">
        <Timer size={14} className={cn(isRunning ? "text-primary animate-pulse" : "text-white/20")} />
        <span className={cn(
          "text-xs font-mono font-bold",
          timeLeft > 0 ? "text-white" : "text-white/20"
        )}>
          {timeLeft > 0 ? formatTime(timeLeft) : "0:00"}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {[5, 10, 15].map((m) => (
          <Button
            key={m}
            variant="ghost"
            size="sm"
            onClick={() => startTimer(m)}
            className={cn(
              "h-7 px-2 text-[10px] font-bold rounded-lg hover:bg-primary/10 hover:text-primary",
              selectedMinutes === m && timeLeft > 0 ? "text-primary bg-primary/10" : "text-white/30"
            )}
          >
            {m}m
          </Button>
        ))}
        {timeLeft > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTimeLeft(0)}
            className="h-7 w-7 text-white/20 hover:text-destructive"
          >
            <RotateCcw size={12} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PracticeTimer;