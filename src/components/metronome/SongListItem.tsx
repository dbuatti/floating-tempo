"use client";

import React from 'react';
import { Song } from '@/hooks/use-metronome-engine';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Settings2, Trash2, Music, Layers, Repeat } from 'lucide-react';
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
  const totalBars = song.sequence.reduce((acc, b) => acc + b.bars, 0);
  const mainBpm = song.sequence[0]?.bpm || 120;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card 
        onClick={onSelect}
        className={cn(
          "p-5 flex items-center gap-5 transition-all duration-500 border-2 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group cursor-pointer",
          isActive 
            ? "border-primary/60 bg-primary/[0.08] shadow-[0_20px_40px_-12px_rgba(168,85,247,0.3)]" 
            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            if (!isActive) onSelect();
            onTogglePlay();
          }}
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 transition-all duration-500 relative z-10 border-none",
            isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110 hover:bg-primary/90" : "bg-white/5 text-white/20 group-hover:bg-white/10 hover:text-primary"
          )}
        >
          {isActive && isPlaying ? <Pause size={24} fill="currentColor" /> : (isActive ? <Play size={24} fill="currentColor" /> : <Music size={24} />)}
        </Button>

        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white truncate tracking-tight">{song.name}</h3>
            {song.shouldLoop && (
              <Repeat size={14} className="text-primary animate-pulse shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">BPM</span>
              <span className="text-xs font-mono font-black text-white/60">{mainBpm}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Bars</span>
              <span className="text-xs font-mono font-black text-white/60">{totalBars}</span>
            </div>
            {song.sequence.length > 1 && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-1.5 text-primary/60">
                  <Layers size={10} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{song.sequence.length} Parts</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10" onClick={e => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onEdit}
            className="w-11 h-11 rounded-2xl text-white/10 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <Settings2 size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="w-11 h-11 rounded-2xl text-white/10 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 size={20} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default SongListItem;