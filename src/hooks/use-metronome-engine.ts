import { useState, useEffect, useRef, useCallback } from 'react';

export interface TempoBlock {
  id: string;
  bpm: number;
  bars: number;
  timeSignature: number;
  subdivision: 1 | 2 | 4;
}

export type SoundType = 'woodblock' | 'digital' | 'cowbell';

export const useMetronomeEngine = (
  sequence: TempoBlock[], 
  soundType: SoundType, 
  volume: number = 0.5,
  useCountIn: boolean = false,
  autoIncrement: number = 0 // BPM to add after each full loop
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [bpmOffset, setBpmOffset] = useState(0);
  
  const audioContext = useRef<AudioContext | null>(null);
  const timerID = useRef<number | null>(null);
  const nextNoteTime = useRef(0);
  const lookahead = 25.0;
  const scheduleAheadTime = 0.1;
  
  const stateRef = useRef({
    isPlaying: false,
    isCountingIn: false,
    currentBlockIndex: 0,
    currentBeat: 0,
    currentBar: 0,
    sequence,
    volume,
    useCountIn,
    autoIncrement,
    bpmOffset: 0
  });

  useEffect(() => {
    stateRef.current = { 
      isPlaying, 
      isCountingIn,
      currentBlockIndex, 
      currentBeat, 
      currentBar, 
      sequence, 
      volume,
      useCountIn,
      autoIncrement,
      bpmOffset
    };
  }, [isPlaying, isCountingIn, currentBlockIndex, currentBeat, currentBar, sequence, volume, useCountIn, autoIncrement, bpmOffset]);

  const playTone = useCallback((time: number, isFirstBeat: boolean, isCountInTone: boolean = false) => {
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

    if (isCountInTone && !isFirstBeat) osc.frequency.value *= 0.8;

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
      const { currentBlockIndex, currentBeat, currentBar, sequence, isCountingIn, autoIncrement, bpmOffset } = stateRef.current;
      const block = sequence[currentBlockIndex];
      
      if (!block) {
        setIsPlaying(false);
        return;
      }

      const isFirstBeat = currentBeat === 0;
      playTone(nextNoteTime.current, isFirstBeat, isCountingIn);

      const currentBpm = block.bpm + bpmOffset;
      const secondsPerBeat = 60.0 / currentBpm / block.subdivision;
      nextNoteTime.current += secondsPerBeat;

      let nextBeat = currentBeat + 1;
      let nextBar = currentBar;
      let nextBlockIdx = currentBlockIndex;
      let nextIsCountingIn = isCountingIn;
      let nextBpmOffset = bpmOffset;

      if (nextBeat >= block.timeSignature * block.subdivision) {
        nextBeat = 0;
        nextBar++;
      }

      if (isCountingIn) {
        if (nextBar >= 1) {
          nextBar = 0;
          nextIsCountingIn = false;
        }
      } else if (nextBar >= block.bars) {
        nextBar = 0;
        nextBlockIdx++;
        if (nextBlockIdx >= sequence.length) {
          nextBlockIdx = 0;
          nextBpmOffset += autoIncrement;
        }
      }

      setCurrentBeat(nextBeat);
      setCurrentBar(nextBar);
      setCurrentBlockIndex(nextBlockIdx);
      setIsCountingIn(nextIsCountingIn);
      setBpmOffset(nextBpmOffset);
      
      stateRef.current.currentBeat = nextBeat;
      stateRef.current.currentBar = nextBar;
      stateRef.current.currentBlockIndex = nextBlockIdx;
      stateRef.current.isCountingIn = nextIsCountingIn;
      stateRef.current.bpmOffset = nextBpmOffset;

      if (!nextIsCountingIn) {
        const totalBars = sequence.reduce((acc, b) => acc + b.bars, 0);
        const barsCompleted = sequence.slice(0, nextBlockIdx).reduce((acc, b) => acc + b.bars, 0) + nextBar;
        const progress = (barsCompleted + (nextBeat / (block.timeSignature * block.subdivision))) / totalBars;
        setTotalProgress(progress);
      }
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
      setIsCountingIn(false);
    } else {
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      setIsPlaying(true);
      setIsCountingIn(stateRef.current.useCountIn);
      stateRef.current.isCountingIn = stateRef.current.useCountIn;
      scheduler();
    }
  }, [isPlaying, scheduler]);

  const reset = useCallback(() => {
    setCurrentBlockIndex(0);
    setCurrentBeat(0);
    setCurrentBar(0);
    setTotalProgress(0);
    setIsCountingIn(false);
    setBpmOffset(0);
    stateRef.current.currentBlockIndex = 0;
    stateRef.current.currentBeat = 0;
    stateRef.current.currentBar = 0;
    stateRef.current.isCountingIn = false;
    stateRef.current.bpmOffset = 0;
  }, []);

  return {
    isPlaying,
    isCountingIn,
    currentBlockIndex,
    currentBeat,
    currentBar,
    totalProgress,
    bpmOffset,
    togglePlay,
    reset
  };
};