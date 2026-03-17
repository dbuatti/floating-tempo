"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Music2, Zap, Wand2, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { Song, TempoBlock } from '@/hooks/use-metronome-engine';
import { showSuccess, showError } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface QuickAddSongProps {
  onAdd: (song: Song) => void;
}

const QuickAddSong = ({ onAdd }: QuickAddSongProps) => {
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState('');
  const [advancedText, setAdvancedText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const parseAdvancedText = (input: string): TempoBlock[] => {
    const parts = input.split(/(?:then|and|,|\+)/i);
    const blocks: TempoBlock[] = [];
    
    parts.forEach(part => {
      const cleanPart = part.trim();
      if (!cleanPart) return;
      
      // 1. Extract Bars (e.g., "16 bars")
      const barsMatch = cleanPart.match(/(\d+)\s*bars?/i);
      const bars = barsMatch ? parseInt(barsMatch[1], 10) : 4;
      
      // 2. Extract Time Signature (e.g., "6/8", "4/4")
      const tsMatch = cleanPart.match(/(\d+)\/(\d+)/);
      let timeSignature = tsMatch ? parseInt(tsMatch[1], 10) : 4;
      
      // 3. Extract BPM and check for "dotted"
      const isDotted = /dotted/i.test(cleanPart);
      const bpmMatch = cleanPart.match(/(?:@|=)\s*(\d+)/) || cleanPart.match(/(\d+)\s*bpm/i);
      let bpmVal = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;
      
      // Fallback for BPM
      if (!bpmVal) {
        const allNumbers = cleanPart.match(/\d+/g);
        if (allNumbers) {
          const usedNumbers = [];
          if (barsMatch) usedNumbers.push(barsMatch[1]);
          if (tsMatch) usedNumbers.push(tsMatch[1], tsMatch[2]);
          const remaining = allNumbers.filter(n => !usedNumbers.includes(n));
          if (remaining.length > 0) bpmVal = parseInt(remaining[0], 10);
        }
      }

      // Handle Dotted Crotchet for 6/8 (multiply by 3 for 8th note pulse)
      if (isDotted && timeSignature === 6 && bpmVal > 0) {
        bpmVal = bpmVal * 3;
      }

      if (bpmVal > 0) {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          name: `Section ${blocks.length + 1}`,
          bars: bars,
          bpm: bpmVal,
          timeSignature: [2, 3, 4, 5, 6].includes(timeSignature) ? timeSignature : 4,
          subdivision: 1
        });
      }
    });
    
    return blocks;
  };

  const handleAddSong = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      showError("Please enter a song name");
      return;
    }

    let sequence: TempoBlock[] = [];

    if (showAdvanced && advancedText.trim()) {
      sequence = parseAdvancedText(advancedText);
      if (sequence.length === 0) {
        showError("Could not parse sequence. Try: '16 bars 6/8 @ dotted crotchet = 56'");
        return;
      }
    } else {
      sequence = [{
        id: Math.random().toString(36).substr(2, 9),
        name: 'Main',
        bpm: parseInt(bpm, 10) || 120,
        bars: 4,
        timeSignature: 4,
        subdivision: 1
      }];
    }

    const newSong: Song = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      sequence,
      shouldLoop: false
    };

    onAdd(newSong);
    setName('');
    setBpm('');
    setAdvancedText('');
    nameInputRef.current?.focus();
    showSuccess(`Added "${newSong.name}"`);
  };

  const handleSaveToLibrary = async () => {
    if (!user) {
      showError("Please login to save to library");
      return;
    }
    if (!name.trim() || !advancedText.trim()) {
      showError("Enter a name and sequence first");
      return;
    }

    const blocks = parseAdvancedText(advancedText);
    if (blocks.length === 0) {
      showError("Invalid sequence format");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('metronome_inputs').insert({
      user_id: user.id,
      input_text: advancedText,
      sequence: blocks
    });

    if (error) showError(error.message);
    else showSuccess("Sequence saved to library");
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Music2 size={18} className="text-primary" />
            </div>
            <Input
              ref={nameInputRef}
              placeholder="Song Title"
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
              disabled={showAdvanced}
              className="bg-white/5 border-none h-12 w-28 rounded-2xl text-sm font-mono font-black focus-visible:ring-primary/30 placeholder:text-white/10 disabled:opacity-20"
            />
            <Button 
              onClick={handleAddSong}
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
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Wand2 size={12} className="text-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Advanced Parser</span>
                </div>
                <p className="text-[9px] text-white/10 uppercase tracking-tighter">
                  Supports "dotted crotchet" for 6/8
                </p>
              </div>
              
              <Textarea 
                placeholder="e.g. 16 bars 6/8 @ dotted crotchet = 56"
                value={advancedText}
                onChange={(e) => setAdvancedText(e.target.value)}
                className="min-h-[100px] bg-white/5 border-none rounded-2xl resize-none focus-visible:ring-primary/30 placeholder:text-white/10 text-xs font-medium p-4"
              />

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSaveToLibrary}
                  disabled={!advancedText.trim() || isSaving}
                  className="flex-1 h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save to Library
                </Button>
                <Button 
                  size="sm"
                  onClick={handleAddSong}
                  disabled={!advancedText.trim()}
                  className="flex-1 h-10 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Wand2 size={14} />
                  Parse & Add
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickAddSong;