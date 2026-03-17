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
      bars: 4, // Default
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
    <div className="flex flex-col md:flex-row items-center gap-4 p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
      <div className="flex-1 flex items-center gap-4 w-full">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Music2 size={18} className="text-primary" />
        </div>
        <Input
          ref={nameInputRef}
          placeholder="Song Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-white/5 border-none h-12 rounded-2xl text-sm font-bold focus-visible:ring-primary/30 placeholder:text-white/10"
        />
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Zap size={18} className="text-primary" />
        </div>
        <Input
          type="number"
          placeholder="BPM"
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-white/5 border-none h-12 w-full md:w-24 rounded-2xl text-sm font-mono font-black focus-visible:ring-primary/30 placeholder:text-white/10"
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button 
          onClick={handleSubmit}
          disabled={!name.trim() || !bpm.trim()}
          className="flex-1 md:flex-none h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          Add Song
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={onAdvancedClick}
          className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/40 hover:text-primary transition-all"
        >
          <Plus size={20} />
        </Button>
      </div>
    </div>
  );
};

export default QuickAddSong;