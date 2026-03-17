"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Music2, Zap, Wand2, ChevronDown, ChevronUp, Save, Loader2, Layers } from 'lucide-react';
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
  const [isBulkMode, setIsBulkMode] = useState(false);
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
    // Split by double newlines or specific keywords to identify potential blocks
    const parts = input.split(/\n\n|(?=then|and)/i);
    const blocks: TempoBlock[] = [];
    
    parts.forEach(part => {
      const cleanPart = part.trim();
      if (!cleanPart) return;
      
      // 1. Extract Name (First line if it doesn't look like a command)
      const lines = cleanPart.split('\n');
      let sectionName = `Section ${blocks.length + 1}`;
      if (lines[0] && !lines[0].match(/\d+/) && lines[0].length < 50) {
        sectionName = lines[0].trim();
      }

      // 2. Extract Bars (e.g., "16 bars" or "Bars\n50")
      const barsMatch = cleanPart.match(/bars?\s*(\d+)/i) || cleanPart.match(/(\d+)\s*bars?/i);
      const bars = barsMatch ? parseInt(barsMatch[1], 10) : 4;
      
      // 3. Extract Time Signature (e.g., "6/8", "4/4")
      const tsMatch = cleanPart.match(/(\d+)\/(\d+)/);
      let timeSignature = tsMatch ? parseInt(tsMatch[1], 10) : 4;
      
      // 4. Extract BPM
      const isDotted = /dotted/i.test(cleanPart);
      const bpmMatch = cleanPart.match(/(?:bpm|@|=)\s*(\d+)/i) || cleanPart.match(/(\d+)\s*bpm/i) || cleanPart.match(/bpm\n(\d+)/i);
      let bpmVal = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;
      
      // Fallback for BPM if just a number is found near "BPM" text
      if (!bpmVal) {
        const allNumbers = cleanPart.match(/\d+/g);
        if (allNumbers && allNumbers.length > 0) {
          // If we found "BPM" but no direct match, take the first number that isn't the bar count
          bpmVal = parseInt(allNumbers.find(n => n !== (barsMatch?.[1])) || '120', 10);
        }
      }

      if (bpmVal > 0) {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          name: sectionName,
          bars: isNaN(bars) ? 4 : bars,
          bpm: bpmVal,
          timeSignature: [2, 3, 4, 5, 6].includes(timeSignature) ? timeSignature : 4,
          subdivision: 1,
          autoAdvance: true
        });
      }
    });
    
    return blocks;
  };

  const handleAddSong = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (showAdvanced && advancedText.trim()) {
      const sequence = parseAdvancedText(advancedText);
      if (sequence.length === 0) {
        showError("Could not parse sequence. Try: 'Song Name\nBPM 120\nBars 16'");
        return;
      }

      if (isBulkMode) {
        // Create separate songs
        sequence.forEach(block => {
          onAdd({
            id: Math.random().toString(36).substr(2, 9),
            name: block.name || 'Untitled Song',
            sequence: [{ ...block, name: 'Main' }],
            shouldLoop: true
          });
        });
        showSuccess(`Imported ${sequence.length} songs`);
      } else {
        // Create one song with multiple parts
        const newSong: Song = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim() || 'Imported Setlist',
          sequence,
          shouldLoop: false
        };
        onAdd(newSong);
        showSuccess(`Added "${newSong.name}" with ${sequence.length} parts`);
      }
      
      setAdvancedText('');
      setName('');
    } else {
      if (!name.trim()) {
        showError("Please enter a song name");
        return;
      }
      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        sequence: [{
          id: Math.random().toString(36).substr(2, 9),
          name: 'Main',
          bpm: parseInt(bpm, 10) || 120,
          bars: 4,
          timeSignature: 4,
          subdivision: 1
        }],
        shouldLoop: false
      };
      onAdd(newSong);
      setName('');
      setBpm('');
      showSuccess(`Added "${newSong.name}"`);
    }
    
    nameInputRef.current?.focus();
  };

  const handleSaveToLibrary = async () => {
    if (!user) {
      showError("Please login to save to library");
      return;
    }
    if (!advancedText.trim()) {
      showError("Enter a sequence first");
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
              {showAdvanced ? (isBulkMode ? 'Bulk Import' : 'Add Setlist') : 'Add Song'}
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Wand2 size={12} className="text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Advanced Parser</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <Layers size={10} className={isBulkMode ? "text-primary" : "text-white/20"} />
                    <Label htmlFor="bulk-mode" className="text-[9px] font-black uppercase tracking-widest text-white/40 cursor-pointer">Bulk Import</Label>
                    <Switch 
                      id="bulk-mode" 
                      checked={isBulkMode} 
                      onCheckedChange={setIsBulkMode}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-white/10 uppercase tracking-tighter hidden sm:block">
                  Separate items with double newlines
                </p>
              </div>
              
              <Textarea 
                placeholder="Song Name&#10;BPM 120&#10;Bars 16&#10;&#10;Next Song Name..."
                value={advancedText}
                onChange={(e) => setAdvancedText(e.target.value)}
                className="min-h-[150px] bg-white/5 border-none rounded-2xl resize-none focus-visible:ring-primary/30 placeholder:text-white/10 text-xs font-medium p-4 leading-relaxed"
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
                  Save Template
                </Button>
                <Button 
                  size="sm"
                  onClick={handleAddSong}
                  disabled={!advancedText.trim()}
                  className="flex-1 h-10 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Wand2 size={14} />
                  {isBulkMode ? 'Create Songs' : 'Create Setlist'}
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