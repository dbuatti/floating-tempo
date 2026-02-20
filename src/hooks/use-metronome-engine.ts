import { useState, useEffect, useRef, useCallback } from 'react';

export interface TempoBlock {
  id: string;
  bpm: number;
  bars: number;
  timeSignature: number; // beats per bar
  subdivision: 1 | 2 | 4; // 1: quarter, 2: 8th, 4: 16th
}

export type SoundType = 'woodblock' | 'digital' | 'cowbell';

export const useMetronomeEngine = (sequence: TempoBlock[], soundType: SoundType, volume: number = 0.5) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  
  const audioContext = useRef<AudioContext | null>(null);
  const timerID = useRef<number | null>(null);
  const nextNoteTime = useRef(0);
  const lookahead = 25.0;
  const scheduleAheadTime = 0.1;
  
  const stateRef = useRef({
    isPlaying: false,
    currentBlockIndex: 0,
    currentBeat: 0,
    currentBar: 0,
    sequence,
    volume
  });

  useEffect(() => {
    stateRef.current = { isPlaying, currentBlockIndex, currentBeat, currentBar, sequence, volume };
  }, [isPlaying, currentBlockIndex, currentBeat, currentBar, sequence, volume]);

  const playTone = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContext.current) return;
    
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    if (soundType === 'woodblock') {
      osc.type = 'sine';
      osc.frequency.value = isFirstBeat ? 1200 : 800;
    } else if (soundType === 'digital') {
      osc.type = 'square';
      osc.frequency.value = isFirstBeat ? 1000 : 500;
    } else {
      osc.type = 'triangle';
      osc.frequency.value = isFirstBeat ? 800 : 400;
    }

    envelope.gain.value = stateRef.current.volume;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [soundType]);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
      const { currentBlockIndex, currentBeat, currentBar, sequence } = stateRef.current;
      const block = sequence[currentBlockIndex];
      
      if (!block) {
        setIsPlaying(false);
        return;
      }

      const isFirstBeat = currentBeat === 0;
      playTone(nextNoteTime.current, isFirstBeat);

      const secondsPerBeat = 60.0 / block.bpm / block.subdivision;
      nextNoteTime.current += secondsPerBeat;

      let nextBeat = currentBeat + 1;
      let nextBar = currentBar;
      let nextBlockIdx = currentBlockIndex;

      if (nextBeat >= block.timeSignature * block.subdivision) {
        nextBeat = 0;
        nextBar++;
      }

      if (nextBar >= block.bars) {
        nextBar = 0;
        nextBlockIdx++;
        if (nextBlockIdx >= sequence.length) {
          nextBlockIdx = 0; 
        }
      }

      setCurrentBeat(nextBeat);
      setCurrentBar(nextBar);
      setCurrentBlockIndex(nextBlockIdx);
      
      stateRef.current.currentBeat = nextBeat;
      stateRef.current.currentBar = nextBar;
      stateRef.current.currentBlockIndex = nextBlockIdx;
    }
    timerID.current = window.setTimeout(scheduler, lookahead);
  }, [playTone]);

  const togglePlay = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (isPlaying) {
      if (timerID.current) clearTimeout(timerID.current);
      setIsPlaying(false);
    } else {
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  }, [isPlaying, scheduler]);

  const reset = useCallback(() => {
    setCurrentBlockIndex(0);
    setCurrentBeat(0);
    setCurrentBar(0);
    stateRef.current.currentBlockIndex = 0;
    stateRef.current.currentBeat = 0;
    stateRef.current.currentBar = 0;
  }, []);

  return {
    isPlaying,
    currentBlockIndex,
    currentBeat,
    currentBar,
    togglePlay,
    reset
  };
};