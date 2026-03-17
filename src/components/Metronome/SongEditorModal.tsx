"use client";

import React, { useState, useEffect } from 'react';
import { Song, TempoBlock } from '@/hooks/use-metronome-engine';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Save, X, Music2, Edit3, Repeat } from 'lucide-react';
import TempoBlockItem from './TempoBlockItem';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SongEditorModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSong: Song) => void;
  currentBlockIndex: number;
}

const SongEditorModal = ({ song, isOpen, onClose, onUpdate, currentBlockIndex }: SongEditorModalProps) => {
  const [localName, setLocalName] = useState('');

  // Sync local name when song changes or modal opens
  useEffect(() => {
    if (song) {
      setLocalName(song.name);
    }
  }, [song?.id, isOpen]);

  if (!song) return null;

  const handleNameChange = (newName: string) => {
    setLocalName(newName);
    onUpdate({ ...song, name: newName });
  };

  const handleLoopToggle = (checked: boolean) => {
    onUpdate({ ...song, shouldLoop: checked });
  };

  const updateBlock = (blockId: string, updates: Partial<TempoBlock>) => {
    const updatedSequence = song.sequence.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    onUpdate({ ...song, sequence: updatedSequence });
  };

  const deleteBlock = (blockId: string) => {
    if (song.sequence.length <= 1) return;
    const updatedSequence = song.sequence.filter(b => b.id !== blockId);
    onUpdate({ ...song, sequence: updatedSequence });
  };

  const duplicateBlock = (blockId: string) => {
    const block = song.sequence.find(b => b.id === blockId);
    if (block) {
      const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
      const index = song.sequence.findIndex(b => b.id === blockId);
      const updatedSequence = [...song.sequence];
      updatedSequence.splice(index + 1, 0, newBlock);
      onUpdate({ ...song, sequence: updatedSequence });
    }
  };

  const addBlock = () => {
    const lastBlock = song.sequence[song.sequence.length - 1];
    const newBlock: TempoBlock = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Section ${song.sequence.length + 1}`,
      bpm: lastBlock?.bpm || 120,
      bars: 4,
      timeSignature: 4,
      subdivision: 1
    };
    onUpdate({ ...song, sequence: [...song.sequence, newBlock] });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newSeq = [...song.sequence];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSeq.length) return;
    [newSeq[index], newSeq[targetIndex]] = [newSeq[targetIndex], newSeq[index]];
    onUpdate({ ...song, sequence: newSeq });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0c0c0e] border-white/10 rounded-[3rem] p-0 overflow-hidden">
        <div className="p-8 space-y-8">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4 flex-1 mr-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Music2 className="text-primary" size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 group relative">
                  <Input 
                    value={localName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-white/5 border-none px-4 h-12 text-2xl font-black text-white tracking-tight focus-visible:ring-primary/30 rounded-xl placeholder:text-white/10 transition-all"
                    placeholder="Enter Song Name..."
                  />
                  <Edit3 size={14} className="absolute right-4 text-white/20 pointer-events-none" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Detailed Sequence Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mr-4">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                <Repeat size={14} className={song.shouldLoop ? "text-primary" : "text-white/20"} />
                <Label htmlFor="modal-loop-toggle" className="text-[10px] font-black uppercase tracking-widest text-white/40 cursor-pointer">Loop Song</Label>
                <Switch 
                  id="modal-loop-toggle" 
                  checked={song.shouldLoop || false} 
                  onCheckedChange={handleLoopToggle}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5 shrink-0">
                <X size={20} />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {song.sequence.map((block, idx) => (
                <TempoBlockItem 
                  key={block.id}
                  block={block}
                  isActive={idx === currentBlockIndex}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onDuplicate={duplicateBlock}
                  onSelect={() => {}}
                  onMoveUp={() => moveBlock(idx, 'up')}
                  onMoveDown={() => moveBlock(idx, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === song.sequence.length - 1}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <Button 
              variant="outline" 
              onClick={addBlock}
              className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 h-12 px-6 gap-2 text-xs font-black uppercase tracking-widest"
            >
              <Plus size={18} />
              Add Section
            </Button>
            <Button 
              onClick={onClose}
              className="rounded-2xl bg-primary hover:bg-primary/90 h-12 px-8 gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              Done Editing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongEditorModal;