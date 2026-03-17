"use client";

import React from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import VisualFeedback from './VisualFeedback.tsx';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Minimize2, ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StageViewProps {
  isPlaying: boolean;
  isCountingIn: boolean;
  currentBlock: TempoBlock;
  currentBlockIndex: number;
  totalBlocks: number;
  currentBeat: number;
  currentBar: number;
  accentColor: string;
  displayBpm: number;
  subdivisionProgress: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onClose: () => void;
  onPrevBlock: () => void;
  onNextBlock: () => void;
}

const StageView = ({
  isPlaying,
  isCountingIn,
  currentBlock,
  currentBlockIndex,
  totalBlocks,
  currentBeat,
  currentBar,
  accentColor,
  displayBpm,
  subdivisionProgress,
  onTogglePlay,
  onReset,
  onClose,
  onPrevBlock,
  onNextBlock
}: StageViewProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050507] flex flex-col items-center justify-center p-10 overflow-hidden"
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            backgroundColor: accentColor,
            scale: isPlaying && currentBeat === 0 ? 1.5 : 1,
            opacity: isPlaying && currentBeat === 0 ? 0.2 : 0.05
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[300px] rounded-full transition-all duration-500"
        />
      </div>

      {/* Top Navigation */}
      <div className="absolute top-10 left-10 right-10 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <Music2 className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase">Stage Mode</h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Performance Focus</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="rounded-2xl h-14 px-6 gap-3 text-white/40 hover:text-white hover:bg-white/5 border border-white/5"
        >
          <Minimize2 size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Exit Stage</span>
        </Button>
      </div>

      {/* Main Display */}
      <div className="relative flex flex-col items-center text-center space-y-16 w-full max-w-4xl">
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isCountingIn && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ color: accentColor }}
                className="text-2xl font-black uppercase tracking-[1em] animate-pulse"
              >
                Ready
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div 
            key={displayBpm}
            animate={{ scale: isPlaying && currentBeat === 0 ? 1.1 : 1 }}
            className="text-[20rem] font-black tracking-tighter font-mono leading-none text-white drop-shadow-[0_0_100px_rgba(255,255,255,0.1)]"
            style={{ color: isPlaying && currentBeat === 0 ? accentColor : 'white' }}
          >
            {displayBpm}
          </motion.div>
          
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-4xl font-black text-white/90 tracking-widest uppercase">
              {currentBlock?.name || "Untitled Block"}
            </h3>
            <div className="flex items-center gap-8 px-10 py-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-3xl">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black uppercase tracking-widest text-white/20">Song</span>
                <span className="text-xl font-mono font-black text-white">{currentBlockIndex + 1} / {totalBlocks}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-white/10" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-black uppercase tracking-widest text-white/20">Bar</span>
                <span className="text-xl font-mono font-black text-white">{currentBar + 1} / {currentBlock?.bars}</span>
              </div>
            </div>
          </div>
        </div>

        <VisualFeedback 
          currentBeat={currentBeat} 
          totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
          isPlaying={isPlaying}
          accentColor={accentColor}
          subdivisionProgress={subdivisionProgress}
        />

        {/* Controls */}
        <div className="flex items-center gap-16">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPrevBlock}
            disabled={currentBlockIndex === 0}
            className="w-20 h-20 rounded-[2.5rem] text-white/20 hover:text-primary hover:bg-primary/10 disabled:opacity-0"
          >
            <ChevronLeft size={40} />
          </Button>

          <div className="flex items-center gap-10">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onReset}
              className="w-24 h-24 rounded-[3rem] border-white/10 bg-white/5 hover:bg-white/10 text-white/40"
            >
              <RotateCcw size={32} />
            </Button>

            <Button 
              size="lg" 
              onClick={onTogglePlay}
              style={{ 
                backgroundColor: accentColor, 
                boxShadow: `0 40px 100px -20px ${accentColor}aa` 
              }}
              className="w-40 h-40 rounded-[5rem] border-none transition-all duration-500 hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause size={70} fill="currentColor" /> : <Play size={70} fill="currentColor" className="ml-4" />}
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNextBlock}
            disabled={currentBlockIndex === totalBlocks - 1}
            className="w-20 h-20 rounded-[2.5rem] text-white/20 hover:text-primary hover:bg-primary/10 disabled:opacity-0"
          >
            <ChevronRight size={40} />
          </Button>
        </div>
      </div>

      {/* Bottom Progress */}
      <div className="absolute bottom-10 left-20 right-20 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          animate={{ width: `${((currentBlockIndex + 1) / totalBlocks) * 100}%` }}
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </motion.div>
  );
};

export default StageView;