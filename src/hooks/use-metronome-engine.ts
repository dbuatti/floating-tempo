import { useState, useEffect, useRef, useCallback } from 'react';

export interface TempoBlock {
  id: string;
  name?: string;
  bpm: number;
  bars: number;
  timeSignature: number;
  subdivision: 1 | 2 | 4;
  isMuted?: boolean;
  autoAdvance?: boolean; // New property: if true, continues to next block automatically
}

export interface Song {
  id: string;
  name: string;
  sequence: TempoBlock[];
  shouldLoop?: boolean;
}

export type SoundType = 'woodblock' | 'digital' | 'cowbell';

type BeatType = 'accent' | 'secondary' | 'normal' | 'subdivision';

export const useMetronomeEngine = (
  sequence: TempoBlock[], 
  soundType: SoundType, 
  volume: number = 0.5,
  useCountIn: boolean = false,
  autoIncrement: number = 0,
  shouldLoop: boolean = false,
  stopAtEndOfBlock: boolean = false // This is now largely superseded by per-block autoAdvance
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
    shouldLoop,
    stopAtEndOfBlock
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
      shouldLoop,
      stopAtEndOfBlock
    };
  }, [isPlaying, isCountingIn, currentBlockIndex, currentBeat, currentBar, sequence, volume, useCountIn, autoIncrement, bpmOffset, shouldLoop, stopAtEndOfBlock]);

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

  const playTone = useCallback((time: number, type: BeatType) => {
    if (!audioContext.current) return;
    
    const { currentBlockIndex, sequence, isCountingIn } = stateRef.current;
    const block = sequence[currentBlockIndex];
    
    if (block?.isMuted && !isCountingIn) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    let freq = 800;
    let gainMult = 1.0;

    if (soundType === 'woodblock') {
      switch (type) {
        case 'accent': freq = 1200; break;
        case 'secondary': freq = 1000; gainMult = 0.8; break;
        case 'normal': freq = 800; gainMult = 0.7; break;
        case 'subdivision': freq = 600; gainMult = 0.4; break;
      }
    } else if (soundType === 'digital') {
      switch (type) {
        case 'accent': freq = 1000; break;
        case 'secondary': freq = 800; gainMult = 0.8; break;
        case 'normal': freq = 500; gainMult = 0.7; break;
        case 'subdivision': freq = 400; gainMult = 0.4; break;
      }
    } else { // cowbell
      switch (type) {
        case 'accent': freq = 800; break;
        case 'secondary': freq = 700; gainMult = 0.8; break;
        case 'normal': freq = 400; gainMult = 0.7; break;
        case 'subdivision': freq = 300; gainMult = 0.4; break;
      }
    }

    envelope.gain.value = stateRef.current.volume * gainMult;
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
      const { 
        currentBlockIndex, 
        currentBeat, 
        currentBar, 
        sequence, 
        isCountingIn, 
        autoIncrement, 
        bpmOffset, 
        shouldLoop,
        stopAtEndOfBlock 
      } = stateRef.current;
      
      const block = sequence[currentBlockIndex];
      
      if (!block) {
        setIsPlaying(false);
        return;
      }

      // Determine Beat Type
      let type: BeatType = 'normal';
      const isSubdivision = currentBeat % block.subdivision !== 0;
      
      if (isSubdivision) {
        type = 'subdivision';
      } else {
        const mainBeat = currentBeat / block.subdivision;
        if (mainBeat === 0) {
          type = 'accent';
        } else if (block.timeSignature === 6 && mainBeat === 3) {
          type = 'secondary';
        } else {
          type = 'normal';
        }
      }
      
      playTone(nextNoteTime.current, type);

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
        // Handle Step Mode / Manual Trigger
        // If autoAdvance is NOT set (or false), we stop and select the next block
        if (!block.autoAdvance && sequence.length > 1) {
          setIsPlaying(false);
          const advancedIdx = (currentBlockIndex + 1) % sequence.length;
          setCurrentBlockIndex(advancedIdx);
          setCurrentBar(0);
          setCurrentBeat(0);
          stateRef.current.currentBlockIndex = advancedIdx;
          stateRef.current.currentBar = 0;
          stateRef.current.currentBeat = 0;
          if (timerID.current) clearTimeout(timerID.current);
          return;
        }

        nextBar = 0;
        nextBlockIdx++;
        if (nextBlockIdx >= sequence.length) {
          if (shouldLoop) {
            nextBlockIdx = 0;
            nextBpmOffset += autoIncrement;
          } else {
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