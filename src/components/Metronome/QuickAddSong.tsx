"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Music2, Zap } from 'lucide-react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { showSuccess } from '@/utils/toast';

interface QuickAddSongProps {
  onAdd: (song: Partial<TempoBlock>) => void;
  onAdvancedClick: () => void;
}

const QuickAddSong = ({ onAdd, onAdvancedClick }: QuickAddSongProps) => {
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || !bpm.trim()) return;

    onAdd({
      name: name.trim(),
      bpm: parseInt(bpm) || 120,
      bars: 4,
      timeSignature: 4,
      subdivision: 1
    });

    setName('');
    setBpm('');
    nameInputRef.current?.focus();
    showSuccess(`Added "${name}"`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 bg-white/[0.02] rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Music2 size={14} className="text-primary" />
        </div>
        <Input
          ref={nameInputRef}
          placeholder="Song Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-white/5 border-none h-10 rounded-xl text-xs font-bold focus-visible:ring-primary/30 placeholder:text-white/10"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Zap size={14} className="text-primary" />
        </div>
        <Input
          type="number"
          placeholder="BPM"
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-white/5 border-none h-10 w-24 rounded-xl text-xs font-mono font-black focus-visible:ring-primary/30 placeholder:text-white/10"
        />
        <Button 
          onClick={handleSubmit}
          disabled={!name.trim() || !bpm.trim()}
          className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          Add Song
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={onAdvancedClick}
          className="h-10 w-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white/40 hover:text-primary transition-all"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};

export default QuickAddSong;