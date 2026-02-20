import React from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronUp, ChevronDown, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TempoBlockItemProps {
  block: TempoBlock;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<TempoBlock>) => void;
  onDelete: (id: string) => void;
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
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast
}: TempoBlockItemProps) => {
  return (
    <Card className={cn(
      "p-4 flex items-center gap-4 transition-all duration-500 border-2 rounded-3xl backdrop-blur-sm",
      isActive 
        ? "border-primary/40 bg-primary/[0.08] shadow-[0_20px_40px_-15px_rgba(var(--primary),0.2)] scale-[1.01]" 
        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
    )}>
      <div className="flex flex-col gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={isFirst}
          onClick={onMoveUp}
          className="w-8 h-8 rounded-lg text-white/20 hover:text-primary disabled:opacity-0"
        >
          <ChevronUp size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={isLast}
          onClick={onMoveDown}
          className="w-8 h-8 rounded-lg text-white/20 hover:text-primary disabled:opacity-0"
        >
          <ChevronDown size={16} />
        </Button>
      </div>

      <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/5 text-white/20 shrink-0">
        <Music size={18} className={cn(isActive && "text-primary")} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[8px] uppercase font-black text-white/30 tracking-widest ml-1">BPM</label>
          <Input 
            type="number" 
            value={block.bpm} 
            onChange={(e) => onUpdate(block.id, { bpm: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-none h-9 font-mono text-base font-bold rounded-xl focus-visible:ring-primary/30"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[8px] uppercase font-black text-white/30 tracking-widest ml-1">Bars</label>
          <Input 
            type="number" 
            value={block.bars} 
            onChange={(e) => onUpdate(block.id, { bars: parseInt(e.target.value) || 0 })}
            className="bg-white/5 border-none h-9 font-mono text-base font-bold rounded-xl focus-visible:ring-primary/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[8px] uppercase font-black text-white/30 tracking-widest ml-1">Time Sig</label>
          <select 
            value={block.timeSignature}
            onChange={(e) => onUpdate(block.id, { timeSignature: parseInt(e.target.value) })}
            className="w-full bg-white/5 border-none h-9 rounded-xl px-2 text-xs font-mono font-bold focus:ring-2 ring-primary/30 outline-none appearance-none cursor-pointer"
          >
            <option value={2}>2/4</option>
            <option value={3}>3/4</option>
            <option value={4}>4/4</option>
            <option value={5}>5/4</option>
            <option value={6}>6/8</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] uppercase font-black text-white/30 tracking-widest ml-1">Subdiv</label>
          <select 
            value={block.subdivision}
            onChange={(e) => onUpdate(block.id, { subdivision: parseInt(e.target.value) as any })}
            className="w-full bg-white/5 border-none h-9 rounded-xl px-2 text-xs font-mono font-bold focus:ring-2 ring-primary/30 outline-none appearance-none cursor-pointer"
          >
            <option value={1}>1/4</option>
            <option value={2}>1/8</option>
            <option value={4}>1/16</option>
          </select>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onDelete(block.id)}
        className="w-10 h-10 rounded-2xl text-white/20 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
      >
        <Trash2 size={18} />
      </Button>
    </Card>
  );
};

export default TempoBlockItem;