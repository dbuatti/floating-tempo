import { useState, useEffect, useRef, useCallback } from 'react';

export interface TempoBlock {
  id: string;
  name?: string;
  bpm: number;
  bars: number;
  timeSignature: number;
  subdivision: 1 | 2 | 4;
  isMuted?: boolean;
}

export interface Song {
  id: string;
  name: string;
  sequence: TempoBlock[];
  shouldLoop?: boolean;
}

export type SoundType = 'woodblock' | 'digital' | 'cowbell';

export const useMetronomeEngine = (
  sequence: TempoBlock[], 
  soundType: SoundType, 
  volume: number = 0.5,
  useCountIn: boolean = false,
  autoIncrement: number = 0,
  shouldLoop: boolean = false
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [subdivisionProgress, setSubdivisionProgress] = useState(0);
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
    bpmOffset: 0,
    shouldLoop
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
      bpmOffset,
      shouldLoop
    };
  }, [isPlaying, isCountingIn, currentBlockIndex, currentBeat, currentBar, sequence, volume, useCountIn, autoIncrement, bpmOffset, shouldLoop]);

  // Animation loop for smooth subdivision progress
  useEffect(() => {
    let animationFrame: number;
    const updateProgress = () => {
      if (isPlaying && audioContext.current) {
        const { currentBlockIndex, sequence, bpmOffset } = stateRef.current;
        const block = sequence[currentBlockIndex];
        if (block) {
          const currentBpm = block.bpm + bpmOffset;
          const secondsPerBeat = 60.0 / currentBpm / block.subdivision;
          const timeInBeat = audioContext.current.currentTime - (nextNoteTime.current - secondsPerBeat);
          const progress = Math.max(0, Math.min(1, timeInBeat / secondsPerBeat));
          setSubdivisionProgress(progress);
        }
      }
      animationFrame = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const playTone = useCallback((time: number, isFirstBeat: boolean, isSubdivision: boolean, isCountInTone: boolean = false) => {
    if (!audioContext.current) return;
    
    const { currentBlockIndex, sequence, isCountingIn } = stateRef.current;
    const block = sequence[currentBlockIndex];
    
    if (block?.isMuted && !isCountingIn) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    let freq = 800;
    if (soundType === 'woodblock') {
      freq = isFirstBeat ? 1200 : 800;
    } else if (soundType === 'digital') {
      freq = isFirstBeat ? 1000 : 500;
    } else {
      freq = isFirstBeat ? 800 : 400;
    }

    if (isSubdivision) {
      freq *= 0.6;
      envelope.gain.value = stateRef.current.volume * 0.4;
    } else {
      envelope.gain.value = stateRef.current.volume;
    }

    osc.frequency.value = freq;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [soundType]);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
      const { currentBlockIndex, currentBeat, currentBar, sequence, isCountingIn, autoIncrement, bpmOffset, shouldLoop } = stateRef.current;
      const block = sequence[currentBlockIndex];
      
      if (!block) {
        setIsPlaying(false);
        return;
      }

      const isFirstBeat = currentBeat === 0;
      const isSubdivision = currentBeat % block.subdivision !== 0;
      
      playTone(nextNoteTime.current, isFirstBeat, isSubdivision, isCountingIn);

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
          if (shouldLoop) {
            nextBlockIdx = 0;
            nextBpmOffset += autoIncrement;
          } else {
            // Stop playing at the end of the sequence
            setIsPlaying(false);
            if (timerID.current) clearTimeout(timerID.current);
            return;
          }
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

  const jumpToBlock = useCallback((index: number) => {
    setCurrentBlockIndex(index);
    setCurrentBeat(0);
    setCurrentBar(0);
    stateRef.current.currentBlockIndex = index;
    stateRef.current.currentBeat = 0;
    stateRef.current.currentBar = 0;
  }, []);

  return {
    isPlaying,
    isCountingIn,
    currentBlockIndex,
    currentBeat,
    currentBar,
    totalProgress,
    subdivisionProgress,
    bpmOffset,
    togglePlay,
    reset,
    jumpToBlock
  };
};