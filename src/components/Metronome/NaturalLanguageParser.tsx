"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Wand2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface NaturalLanguageParserProps {
  onParse: (blocks: TempoBlock[]) => void;
}

const NaturalLanguageParser = ({ onParse }: NaturalLanguageParserProps) => {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const parseText = (input: string): TempoBlock[] => {
    // Improved regex: 
    // Group 1: Number of bars
    // Group 2: BPM (optional "bpm" suffix)
    // Handles "16 bars @ 114", "16 bars of 114bpm", "16 bars @ 114 then..."
    const regex = /(\d+)\s*bars?\s*(?:of|@)\s*(\d+)(?:\s*bpm)?/gi;
    const blocks: TempoBlock[] = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
      const bars = parseInt(match[1]);
      const bpm = parseInt(match[2]);
      
      if (!isNaN(bars) && !isNaN(bpm)) {
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          name: `Section ${blocks.length + 1}`,
          bars: bars,
          bpm: bpm,
          timeSignature: 4,
          subdivision: 1
        });
      }
    }
    return blocks;
  };

  const handleParse = () => {
    const blocks = parseText(text);
    if (blocks.length > 0) {
      onParse(blocks);
      showSuccess(`Generated ${blocks.length} sections`);
    } else {
      showError("Could not parse input. Try: '16 bars @ 114 then 31 bars @ 146'");
    }
  };

  const handleSave = async () => {
    if (!user) {
      showError("Please login to save inputs");
      return;
    }

    const blocks = parseText(text);
    if (blocks.length === 0) {
      showError("Nothing to save. Enter a valid sequence first.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('metronome_inputs').insert({
      user_id: user.id,
      input_text: text,
      sequence: blocks
    });

    if (error) showError(error.message);
    else {
      showSuccess("Input saved to your library");
      handleParse();
      setText('');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <Textarea 
          placeholder="Try: '16 bars @ 114 then 31 bars @ 146'"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="relative min-h-[100px] bg-white/[0.03] border-white/5 border-2 rounded-3xl resize-none focus-visible:ring-primary/30 focus-visible:border-primary/20 transition-all placeholder:text-white/20 text-sm font-medium p-5 pr-32"
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
          {user && (
            <Button 
              size="sm" 
              variant="outline"
              className="gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={handleSave}
              disabled={!text.trim() || isSaving}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </Button>
          )}
          <Button 
            size="sm" 
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={handleParse}
            disabled={!text.trim()}
          >
            <Wand2 size={14} />
            Parse
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-2">
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          Format: [Number] bars @ [Number] (optional: bpm)
        </p>
      </div>
    </div>
  );
};

export default NaturalLanguageParser;