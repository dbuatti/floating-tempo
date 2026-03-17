"use client";

import React from 'react';
import { Song } from '@/hooks/use-metronome-engine';
import MetronomeVisuals from './MetronomeVisuals';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Play, Pause, Volume2, MoveHorizontal } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-16 w-full max-w-4xl">
          
          {/* Panning Control (Horizontal) */}
          <div className="flex flex-col items-center gap-6 order-2 md:order-1 group">
            <div className="flex items-center justify-between w-full px-4">
              <span className={cn("text-[10px] font-black transition-colors", pan < -0.1 ? "text-primary" : "text-white/20")}>L</span>
              <div className="flex items-center gap-2">
                <MoveHorizontal size={12} className="text-white/10" />
                <span className="text-[9px] font-mono font-black text-white/40">
                  {pan === 0 ? "C" : `${Math.abs(Math.round(pan * 100))}${pan < 0 ? 'L' : 'R'}`}
                </span>
              </div>
              <span className={cn("text-[10px] font-black transition-colors", pan > 0.1 ? "text-primary" : "text-white/20")}>R</span>
            </div>
            <div className="w-full px-2 py-4">
              <Slider 
                value={[pan * 100]} 
                onValueChange={(v) => setPan(v[0] / 100)} 
                min={-100}
                max={100} 
                step={1}
                className="cursor-pointer"
              />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white/30 transition-colors">Stereo Position</span>
          </div>

          {/* Main Transport Controls */}
          <div className="flex items-center justify-center gap-10 order-1 md:order-2">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onReset} 
              className="rounded-[2.5rem] w-24 h-24 p-0 border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <RotateCcw size={32} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </Button>
            
            <Button 
              size="lg" 
              onClick={onTogglePlay}
              style={{ 
                backgroundColor: accentColor,
                boxShadow: isPlaying ? `0 0 60px ${accentColor}44` : 'none'
              }}
              className="rounded-[5rem] w-40 h-40 p-0 border-none transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl"
            >
              {isPlaying ? <Pause size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" className="ml-4" />}
            </Button>
          </div>

          {/* Volume Control (Vertical Fader) */}
          <div className="flex flex-col items-center gap-6 order-3 group">
            <div className="h-48 flex items-center justify-center px-8 py-4 bg-white/[0.02] rounded-[2rem] border border-white/5 group-hover:border-white/10 transition-all">
              <Slider 
                value={[volume * 20]} // volume is 0-5, slider is 0-100
                onValueChange={(v) => setVolume(v[0] / 20)} 
                max={100} 
                step={1}
                orientation="vertical"
                className="h-full cursor-pointer" 
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Volume2 size={14} className={cn("transition-colors", volume > 0 ? "text-primary" : "text-white/20")} />
                <span className="text-xs font-mono font-black text-white/60">{Math.round(volume * 100)}%</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white/30 transition-colors">Output Gain</span>
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
};

export default MetronomePlayer;