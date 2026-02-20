import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';

interface TapTempoProps {
  onTempoChange: (bpm: number) => void;
}

const TapTempo = ({ onTempoChange }: TapTempoProps) => {
  const [taps, setTaps] = useState<number[]>([]);
  const lastTapRef = useRef<number>(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    
    // Reset if more than 2 seconds between taps
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
      onTempoChange(Math.min(Math.max(bpm, 30), 300));
    }
  }, [taps, onTempoChange]);

  // Expose tap to window for keyboard shortcut
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
    <Button 
      variant="outline" 
      onClick={handleTap}
      className="gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
    >
      <Fingerprint size={14} className="text-primary" />
      Tap Tempo (T)
    </Button>
  );
};

export default TapTempo;