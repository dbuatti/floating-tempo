"use client";

import React from 'react';
import { Song } from '@/hooks/use-metronome-engine';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Settings2, Trash2, Music, Layers, Repeat, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SongListItemProps {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onTogglePlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SongListItem = ({ song, isActive, isPlaying, onSelect, onTogglePlay, onEdit, onDelete }: SongListItemProps) => {
  const sequence = song?.sequence || [];
  const totalBars = sequence.reduce((acc, b) => {
    const bars = Number(b?.bars);
    return acc + (isNaN(bars) ? 0 : bars);
  }, 0);
  const mainBpm = sequence[0]?.bpm || 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        onClick={onSelect}
        className={cn(
          "p-6 flex items-center gap-6 transition-all duration-500 border-2 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden group cursor-pointer",
          isActive 
            ? "border-primary/50 bg-primary/[0.08] shadow-[0_30px_60px_-12px_rgba(168,85,247,0.3)]" 
            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 shadow-xl"
        )}
      >
        {isActive && (
          <motion.div 
            layoutId="active-glow-song"
            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none"
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            if (!isActive) onSelect();
            onTogglePlay();
          }}
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-[1.5rem] shrink-0 transition-all duration-500 relative z-10 border-none",
            isActive 
              ? "bg-primary text-primary-foreground shadow-[0_15px_40px_rgba(168,85,247,0.5)] scale-110 hover:bg-primary/90" 
              : "bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-primary"
          )}
        >
          {isActive && isPlaying ? <Pause size={28} fill="currentColor" /> : (isActive ? <Play size={28} fill="currentColor" /> : <Music size={28} />)}
        </Button>

        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-3">
            <h3 className={cn(
              "text-xl font-black tracking-tight truncate transition-colors",
              isActive ? "text-white" : "text-white/70 group-hover:text-white"
            )}>
              {song?.name || "Untitled Song"}
            </h3>
            {song?.shouldLoop && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                <Repeat size={10} className="text-primary animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Loop</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-5 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">BPM</span>
              <span className="text-sm font-mono font-black text-white/60">{mainBpm}</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Bars</span>
              <span className="text-sm font-mono font-black text-white/60">{totalBars}</span>
            </div>
            {sequence.length > 1 && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="flex items-center gap-2 text-primary/60">
                  <Layers size={12} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{sequence.length} Parts</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10" onClick={e => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            className="w-12 h-12 rounded-2xl text-white/10 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Settings2 size={22} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="w-12 h-12 rounded-2xl text-white/10 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 size={22} />
          </Button>
          <div className="w-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={20} className="text-white/10" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SongListItem;