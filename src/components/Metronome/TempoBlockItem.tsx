import React from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TempoBlockItemProps {
  block: TempoBlock;
  isActive: boolean;
  onUpdate: (id: string, updates: Partial<TempoBlock>) => void;
  onDelete: (id: string) => void;
}

const TempoBlockItem = ({ block, isActive, onUpdate, onDelete }: TempoBlockItemProps) => {
  return (
    <Card className={cn(
      "p-4 flex items-center gap-4 transition-all duration-300 border-2",
      isActive ? "border-primary bg-primary/5 scale-[1.02] shadow-lg" : "border-transparent bg-card/50"
    )}>
      <div className="text-muted-foreground cursor-grab">
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">BPM</label>
          <Input 
            type="number" 
            value={block.bpm} 
            onChange={(e) => onUpdate(block.id, { bpm: parseInt(e.target.value) || 0 })}
            className="bg-background/50 border-none h-8 font-mono text-lg"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Bars</label>
          <Input 
            type="number" 
            value={block.bars} 
            onChange={(e) => onUpdate(block.id, { bars: parseInt(e.target.value) || 0 })}
            className="bg-background/50 border-none h-8 font-mono text-lg"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Time Sig</label>
          <select 
            value={block.timeSignature}
            onChange={(e) => onUpdate(block.id, { timeSignature: parseInt(e.target.value) })}
            className="w-full bg-background/50 border-none h-8 rounded-md px-2 text-sm font-mono"
          >
            <option value={2}>2/4</option>
            <option value={3}>3/4</option>
            <option value={4}>4/4</option>
            <option value={5}>5/4</option>
            <option value={6}>6/8</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Subdiv</label>
          <select 
            value={block.subdivision}
            onChange={(e) => onUpdate(block.id, { subdivision: parseInt(e.target.value) as any })}
            className="w-full bg-background/50 border-none h-8 rounded-md px-2 text-sm font-mono"
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
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 size={18} />
      </Button>
    </Card>
  );
};

export default TempoBlockItem;