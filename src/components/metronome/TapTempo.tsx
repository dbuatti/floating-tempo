import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TapTempoProps {
  onTempoChange: (bpm: number) => void;
}

const TapTempo = ({ onTempoChange }: TapTempoProps) => {
  const [taps, setTaps] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const lastTapRef = useRef<number>(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    
    let newTaps = diff > 2000 ? [now] : [...taps, now];
    if (newTaps.length > 4) newTaps.shift();
    
    setTaps(newTaps);
    lastTapRef.current = now;

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i-1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.min(Math.max(bpm, 30), 300);
      
      onTempoChange(clampedBpm);
      setHistory(prev => [clampedBpm, ...prev].slice(0, 3));
    }
  }, [taps, onTempoChange]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 't' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        variant="outline" 
        onClick={handleTap}
        className="gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider h-10"
      >
        <Fingerprint size={14} className="text-primary" />
        Tap Tempo (T)
      </Button>
      {history.length > 0 && (
        <div className="flex gap-1.5 px-1">
          {history.map((bpm, i) => (
            <span 
              key={i} 
              className={cn(
                "text-[9px] font-mono font-bold transition-opacity",
                i === 0 ? "text-primary" : "text-white/20"
              )}
            >
              {bpm}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TapTempo;