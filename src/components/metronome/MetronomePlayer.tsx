"use client";

import React from 'react';
import { Song } from '@/hooks/use-metronome-engine';
import MetronomeVisuals from './MetronomeVisuals';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Play, Pause, Volume2, MoveHorizontal, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MetronomePlayerProps {
  activeSong: Song;
  volume: number;
  setVolume: (v: number) => void;
  pan: number;
  setPan: (p: number) => void;
  accentColor: string;
  displayBpm: number;
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
    <Card className="bg-[#0a0a0c] border-white/5 p-12 relative overflow-hidden rounded-[3rem] shadow-2xl">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            opacity: isPlaying && currentBeat === 0 ? 0.15 : 0.05,
            scale: isPlaying && currentBeat === 0 ? 1.2 : 1
          }}
          style={{ backgroundColor: accentColor }}
          className="absolute -top-1/2 -left-1/2 w-full h-full blur-[120px] rounded-full transition-all duration-300"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Header Info */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Music2 size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{activeSong?.name}</span>
          </div>
          
          <div className="relative">
            <motion.div
              key={displayBpm}
              animate={{ scale: isPlaying && currentBeat === 0 ? 1.05 : 1 }}
              className="text-[10rem] font-black tracking-tighter font-mono leading-none text-white drop-shadow-2xl"
              style={{ color: isPlaying && currentBeat === 0 ? accentColor : 'white' }}
            >
              {displayBpm}
            </motion.div>
            <div className="absolute -right-16 bottom-6 text-2xl font-black uppercase tracking-widest opacity-10">BPM</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="text-xl font-black text-white/80 tracking-widest uppercase">
              {currentBlock?.name || "Untitled Section"}
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-mono font-black uppercase tracking-widest text-white/20">
              <span>Part {currentBlockIndex + 1}</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span>Bar {currentBar + 1} / {currentBlock?.bars || 0}</span>
            </div>
          </div>
        </div>

        {/* Visual Feedback */}
        <div className="w-full max-w-3xl mb-16">
          <MetronomeVisuals 
            currentBeat={currentBeat} 
            totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
            isPlaying={isPlaying}
            accentColor={accentColor}
            subdivisionProgress={subdivisionProgress}
          />
        </div>

        {/* Console Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl items-end">
          
          {/* Panning Section */}
          <div className="flex flex-col gap-6 p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 group">
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] font-black transition-colors", pan < -0.1 ? "text-primary" : "text-white/20")}>LEFT</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <MoveHorizontal size={12} className="text-white/20" />
                <span className="text-[10px] font-mono font-black text-white/60">
                  {pan === 0 ? "CENTER" : `${Math.abs(Math.round(pan * 100))}${pan < 0 ? 'L' : 'R'}`}
                </span>
              </div>
              <span className={cn("text-[10px] font-black transition-colors", pan > 0.1 ? "text-primary" : "text-white/20")}>RIGHT</span>
            </div>
            <div className="relative h-12 flex items-center">
              <Slider 
                value={[pan * 100]} 
                onValueChange={(v) => setPan(v[0] / 100)} 
                min={-100}
                max={100} 
                step={1}
                className="cursor-pointer"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 text-center group-hover:text-white/30 transition-colors">Stereo Image</span>
          </div>

          {/* Transport Section */}
          <div className="flex items-center justify-center gap-8">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onReset} 
              className="w-20 h-20 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <RotateCcw size={28} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </Button>
            
            <Button 
              onClick={onTogglePlay}
              style={{ 
                backgroundColor: accentColor,
                boxShadow: isPlaying ? `0 0 80px ${accentColor}44` : 'none'
              }}
              className="w-36 h-36 rounded-[4.5rem] border-none transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl"
            >
              {isPlaying ? <Pause size={56} fill="currentColor" /> : <Play size={56} fill="currentColor" className="ml-3" />}
            </Button>
          </div>

          {/* Volume Section */}
          <div className="flex flex-col gap-6 p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={14} className={cn("transition-colors", volume > 0 ? "text-primary" : "text-white/20")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Output</span>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] font-mono font-black text-white/60">{Math.round(volume * 100)}%</span>
              </div>
            </div>
            <div className="relative h-12 flex items-center">
              <Slider 
                value={[volume * 100]} 
                onValueChange={(v) => setVolume(v[0] / 100)} 
                max={100} 
                step={1}
                className="cursor-pointer"
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 text-center group-hover:text-white/30 transition-colors">Master Gain</span>
          </div>

        </div>
      </div>
    </Card>
  );
};

export default MetronomePlayer;