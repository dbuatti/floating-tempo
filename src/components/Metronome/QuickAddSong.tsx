"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Music2, Zap, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { Song, TempoBlock } from '@/hooks/use-metronome-engine';
import { showSuccess, showError } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickAddSongProps {
  onAdd: (song: Song) => void;
}

const QuickAddSong = ({ onAdd }: QuickAddSongProps) => {
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState('');
  const [advancedText, setAdvancedText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const parseAdvancedText = (input: string): TempoBlock[] => {
    const regex = /(\d+)\s*bars?\s*(?:of|@)\s*(\d+)(?:\s*bpm)?/gi;
    const blocks: TempoBlock[] = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
      const bars = parseInt(match[1]);
      const bpmVal = parseInt(match[2]);
      
      if (!isNaN(bars) && !isNaN(bpmVal)) {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          name: `Section ${blocks.length + 1}`,
          bars: bars,
          bpm: bpmVal,
          timeSignature: 4,
          subdivision: 1
        });
      }
    }
    return blocks;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      showError("Please enter a song name");
      return;
    }

    let sequence: TempoBlock[] = [];

    if (showAdvanced && advancedText.trim()) {
      sequence = parseAdvancedText(advancedText);
      if (sequence.length === 0) {
        showError("Could not parse advanced sequence. Using default.");
        sequence = [{
          id: Math.random().toString(36).substr(2, 9),
          name: 'Main',
          bpm: parseInt(bpm) || 120,
          bars: 4,
          timeSignature: 4,
          subdivision: 1
        }];
      }
    } else {
      sequence = [{
        id: Math.random().toString(36).substr(2, 9),
        name: 'Main',
        bpm: parseInt(bpm) || 120,
        bars: 4,
        timeSignature: 4,
        subdivision: 1
      }];
    }

    const newSong: Song = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      sequence
    };

    onAdd(newSong);
    setName('');
    setBpm('');
    setAdvancedText('');
    nameInputRef.current?.focus();
    showSuccess(`Added "${newSong.name}"`);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Music2 size={18} className="text-primary" />
          </div>
          <Input
            ref={nameInputRef}
            placeholder="Song Title (e.g. He Lied To Me)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/5 border-none h-12 rounded-2xl text-sm font-bold focus-visible:ring-primary/30 placeholder:text-white/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-primary" />
          </div>
          <Input
            type="number"
            placeholder="BPM"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className="bg-white/5 border-none h-12 w-28 rounded-2xl text-sm font-mono font-black focus-visible:ring-primary/30 placeholder:text-white/10"
          />
          <Button 
            onClick={handleSubmit}
            className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Add Song
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "h-12 w-12 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all",
              showAdvanced ? "text-primary border-primary/20" : "text-white/40"
            )}
          >
            {showAdvanced ? <ChevronUp size={20} /> : <Plus size={20} />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Wand2 size={12} className="text-primary/40" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Advanced Sequence</span>
              </div>
              <Textarea 
                placeholder="e.g. 16 bars @ 114bpm then 31 bars @ 146bpm"
                value={advancedText}
                onChange={(e) => setAdvancedText(e.target.value)}
                className="min-h-[100px] bg-white/5 border-none rounded-2xl resize-none focus-visible:ring-primary/30 placeholder:text-white/10 text-xs font-medium p-4"
              />
              <p className="text-[9px] text-white/10 uppercase tracking-tighter px-1">
                Format: [Number] bars @ [Number] bpm
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickAddSong;