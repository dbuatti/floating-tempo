import React from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronUp, ChevronDown, Music, Copy, Volume2, VolumeX, GripVertical, Play, FastForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

interface TempoBlockItemProps {
  block: TempoBlock;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<TempoBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TempoBlockItem = ({ 
  block, 
  isActive, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  onSelect,
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast
}: TempoBlockItemProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", bounce: 0.3 }}
    >
      <Card 
        onClick={onSelect}
        className={cn(
          "p-5 flex items-center gap-5 transition-all duration-500 border-2 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group cursor-pointer",
          isActive 
            ? "border-primary/60 bg-primary/[0.08] shadow-[0_20px_40px_-12px_rgba(168,85,247,0.3)]" 
            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10",
          block.isMuted && "opacity-50 grayscale-[0.5]"
        )}
      >
        {isActive && (
          <motion.div 
            layoutId="active-glow"
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
          />
        )}

        {/* Reorder Controls */}
        <div className="flex flex-col gap-0.5 relative z-10 shrink-0" onClick={e => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isFirst}
            onClick={onMoveUp}
            className="w-7 h-7 rounded-lg text-white/10 hover:text-primary hover:bg-primary/10 disabled:opacity-0 transition-all"
          >
            <ChevronUp size={16} />
          </Button>
          <div className="flex justify-center text-white/5">
            <GripVertical size={12} />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isLast}
            onClick={onMoveDown}
            className="w-7 h-7 rounded-lg text-white/10 hover:text-primary hover:bg-primary/10 disabled:opacity-0 transition-all"
          >
            <ChevronDown size={16} />
          </Button>
        </div>

        {/* Status Icon */}
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-all duration-500 relative z-10",
          isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110" : "bg-white/5 text-white/20 group-hover:bg-white/10"
        )}>
          {isActive ? <Play size={20} fill="currentColor" /> : (block.isMuted ? <VolumeX size={20} /> : <Music size={20} />)}
        </div>
        
        {/* Main Inputs Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[2.5fr_1fr_1fr_1.2fr_1.2fr] gap-4 relative z-10" onClick={e => e.stopPropagation()}>
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-widest ml-1">Song Name</label>
            <Input 
              value={block.name || ''} 
              onChange={(e) => onUpdate(block.id, { name: e.target.value })}
              placeholder="Untitled Section"
              className="bg-white/5 border-none h-10 font-bold text-sm rounded-xl focus-visible:ring-primary/30 transition-all placeholder:text-white/5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-widest ml-1">BPM</label>
            <Input 
              type="number" 
              value={block.bpm} 
              onChange={(e) => onUpdate(block.id, { bpm: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-none h-10 font-mono text-base font-black rounded-xl focus-visible:ring-primary/30 transition-all text-center"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-widest ml-1">Bars</label>
            <Input 
              type="number" 
              value={block.bars} 
              onChange={(e) => onUpdate(block.id, { bars: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-none h-10 font-mono text-base font-black rounded-xl focus-visible:ring-primary/30 transition-all text-center"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-widest ml-1">Time Sig</label>
            <div className="relative">
              <select 
                value={block.timeSignature}
                onChange={(e) => onUpdate(block.id, { timeSignature: parseInt(e.target.value) })}
                className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-mono font-black focus:ring-2 ring-primary/30 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option value={2}>2/4</option>
                <option value={3}>3/4</option>
                <option value={4}>4/4</option>
                <option value={5}>5/4</option>
                <option value={6}>6/8</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-widest ml-1">Subdiv</label>
            <div className="relative">
              <select 
                value={block.subdivision}
                onChange={(e) => onUpdate(block.id, { subdivision: parseInt(e.target.value) as any })}
                className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-mono font-black focus:ring-2 ring-primary/30 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option value={1}>1/4</option>
                <option value={2}>1/8</option>
                <option value={4}>1/16</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 relative z-10 shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onUpdate(block.id, { autoAdvance: !block.autoAdvance })}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all",
                  block.autoAdvance ? "text-primary bg-primary/10" : "text-white/10 hover:text-primary hover:bg-primary/10"
                )}
              >
                <FastForward size={18} className={cn(!block.autoAdvance && "opacity-40")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{block.autoAdvance ? "Auto-Advance ON" : "Auto-Advance OFF (Manual Trigger)"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onUpdate(block.id, { isMuted: !block.isMuted })}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all",
                  block.isMuted ? "text-primary bg-primary/10" : "text-white/10 hover:text-primary hover:bg-primary/10"
                )}
              >
                {block.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mute</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDuplicate(block.id)}
                className="w-10 h-10 rounded-xl text-white/10 hover:text-primary hover:bg-primary/10 transition-all"
              >
                <Copy size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(block.id)}
                className="w-10 h-10 rounded-xl text-white/10 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </Card>
    </motion.div>
  );
};

export default TempoBlockItem;