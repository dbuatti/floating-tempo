"use client";

import React from 'react';
import { Song } from '@/hooks/use-metronome-engine';
import MetronomeVisuals from './MetronomeVisuals';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Play, Pause, Volume2, MoveHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetronomePlayerProps {
  activeSong: Song;
  volume: number;
  setVolume: (v: number) => void;
  pan: number;
  setPan: (p: number) => void;
  accentColor: string;
  displayBpm: number;
  // Engine Props
  isPlaying: boolean;
  currentBlockIndex: number;
  currentBeat: number;
  currentBar: number;
  subdivisionProgress: number;
  onTogglePlay: () => void;
  onReset: () => void;
}

const MetronomePlayer = ({ 
  activeSong, 
  volume, 
  setVolume, 
  pan,
  setPan,
  accentColor, 
  displayBpm,
  isPlaying,
  currentBlockIndex,
  currentBeat,
  currentBar,
  subdivisionProgress,
  onTogglePlay,
  onReset
}: MetronomePlayerProps) => {
  const currentBlock = activeSong?.sequence?.[currentBlockIndex];

  return (
    <Card className="bg-white/[0.02] border-white/5 p-16 relative overflow-hidden backdrop-blur-[100px] rounded-[4rem]">
      <div className="flex flex-col items-center text-center space-y-10 mb-16">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">{activeSong?.name}</h2>
        </div>

        <div className="relative flex items-center justify-center">
          <motion.div
            key={displayBpm}
            animate={{ scale: isPlaying && currentBeat === 0 ? 1.08 : 1 }}
            className="text-[12rem] font-black tracking-tighter font-mono leading-none text-white"
            style={{ color: isPlaying && currentBeat === 0 ? accentColor : 'white' }}
          >
            {displayBpm}
          </motion.div>
          <div className="absolute -right-20 bottom-8 text-3xl font-black uppercase tracking-widest opacity-10">BPM</div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-2xl font-black text-white/80 tracking-widest uppercase">
            {currentBlock?.name || "Untitled Block"}
          </h3>
          <div className="flex items-center gap-6 px-8 py-3 bg-white/[0.03] rounded-full border border-white/10">
            <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] opacity-40">Part {currentBlockIndex + 1}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] opacity-40">Bar {currentBar + 1} / {currentBlock?.bars || 0}</span>
          </div>
        </div>
      </div>

      <MetronomeVisuals 
        currentBeat={currentBeat} 
        totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
        isPlaying={isPlaying}
        accentColor={accentColor}
        subdivisionProgress={subdivisionProgress}
      />

      <div className="flex flex-col items-center gap-12 mt-16">
        <div className="flex justify-center items-center gap-12">
          <div className="flex flex-col items-center gap-4 w-20">
            <MoveHorizontal size={24} className="text-white/30" />
            <Slider 
              value={[pan * 100]} 
              onValueChange={(v) => setPan(v[0] / 100)} 
              min={-100}
              max={100} 
              className="w-28 -rotate-90 mt-12" 
            />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-2">Pan</span>
          </div>

          <Button size="lg" variant="outline" onClick={onReset} className="rounded-[2rem] w-20 h-20 p-0 border-white/10 bg-white/5">
            <RotateCcw size={28} className="text-white/60" />
          </Button>
          
          <Button 
            size="lg" 
            onClick={onTogglePlay}
            style={{ backgroundColor: accentColor }}
            className="rounded-[4rem] w-32 h-32 p-0 shadow-2xl border-none"
          >
            {isPlaying ? <Pause size={56} fill="currentColor" /> : <Play size={56} fill="currentColor" className="ml-3" />}
          </Button>

          <div className="flex flex-col items-center gap-4 w-20">
            <Volume2 size={24} className="text-white/30" />
            <Slider 
              value={[volume * 20]} // volume is 0-5, slider is 0-100
              onValueChange={(v) => setVolume(v[0] / 20)} 
              max={100} 
              className="w-28 -rotate-90 mt-12" 
            />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-2">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MetronomePlayer;