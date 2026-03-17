import React from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronUp, ChevronDown, Music, Copy, Volume2, VolumeX, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

interface TempoBlockItemProps {
  block: TempoBlock;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<TempoBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
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
      <Card className={cn(
        "p-5 flex items-center gap-5 transition-all duration-500 border-2 rounded-[2rem] backdrop-blur-xl relative overflow-hidden",
        isActive 
          ? "border-primary/40 bg-primary/[0.05] shadow-[0_25px_50px_-12px_rgba(168,85,247,0.25)]" 
          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10",
        block.isMuted && "opacity-50 grayscale-[0.5]"
      )}>
        {isActive && (
          <motion.div 
            layoutId="active-glow"
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
          />
        )}

        <div className="flex flex-col gap-1 relative z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isFirst}
            onClick={onMoveUp}
            className="w-8 h-8 rounded-xl text-white/20 hover:text-primary hover:bg-primary/10 disabled:opacity-0"
          >
            <ChevronUp size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isLast}
            onClick={onMoveDown}
            className="w-8 h-8 rounded-xl text-white/20 hover:text-primary hover:bg-primary/10 disabled:opacity-0"
          >
            <ChevronDown size={16} />
          </Button>
        </div>

        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors relative z-10",
          isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-white/5 text-white/20"
        )}>
          {block.isMuted ? <VolumeX size={20} /> : <Music size={20} />}
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em] ml-1">Song Name</label>
            <Input 
              value={block.name || ''} 
              onChange={(e) => onUpdate(block.id, { name: e.target.value })}
              placeholder="Untitled"
              className="bg-white/5 border-none h-10 font-bold text-sm rounded-2xl focus-visible:ring-primary/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em] ml-1">BPM</label>
            <Input 
              type="number" 
              value={block.bpm} 
              onChange={(e) => onUpdate(block.id, { bpm: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-none h-10 font-mono text-lg font-black rounded-2xl focus-visible:ring-primary/30 transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em] ml-1">Bars</label>
            <Input 
              type="number" 
              value={block.bars} 
              onChange={(e) => onUpdate(block.id, { bars: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-none h-10 font-mono text-lg font-black rounded-2xl focus-visible:ring-primary/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em] ml-1">Time Sig</label>
            <select 
              value={block.timeSignature}
              onChange={(e) => onUpdate(block.id, { timeSignature: parseInt(e.target.value) })}
              className="w-full bg-white/5 border-none h-10 rounded-2xl px-3 text-xs font-mono font-black focus:ring-2 ring-primary/30 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
            >
              <option value={2}>2/4</option>
              <option value={3}>3/4</option>
              <option value={4}>4/4</option>
              <option value={5}>5/4</option>
              <option value={6}>6/8</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em] ml-1">Subdiv</label>
            <select 
              value={block.subdivision}
              onChange={(e) => onUpdate(block.id, { subdivision: parseInt(e.target.value) as any })}
              className="w-full bg-white/5 border-none h-10 rounded-2xl px-3 text-xs font-mono font-black focus:ring-2 ring-primary/30 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all"
            >
              <option value={1}>1/4</option>
              <option value={2}>1/8</option>
              <option value={4}>1/16</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onUpdate(block.id, { isMuted: !block.isMuted })}
                className={cn(
                  "w-11 h-11 rounded-2xl transition-all",
                  block.isMuted ? "text-primary bg-primary/10" : "text-white/20 hover:text-primary hover:bg-primary/10"
                )}
              >
                {block.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mute Block</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDuplicate(block.id)}
                className="w-11 h-11 rounded-2xl text-white/20 hover:text-primary hover:bg-primary/10 transition-all"
              >
                <Copy size={20} />
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
                className="w-11 h-11 rounded-2xl text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 size={20} />
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