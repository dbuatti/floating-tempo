import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Wand2 } from 'lucide-react';

interface NaturalLanguageParserProps {
  onParse: (blocks: TempoBlock[]) => void;
}

const NaturalLanguageParser = ({ onParse }: NaturalLanguageParserProps) => {
  const [text, setText] = useState('');

  const handleParse = () => {
    const regex = /(\d+)\s*bars?\s*(?:of|@)\s*(\d+)\s*bpm/gi;
    const blocks: TempoBlock[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        id: Math.random().toString(36).substr(2, 9),
        bars: parseInt(match[1]),
        bpm: parseInt(match[2]),
        timeSignature: 4,
        subdivision: 1
      });
    }

    if (blocks.length > 0) {
      onParse(blocks);
      setText('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <Textarea 
          placeholder="Try: '4 bars @ 120bpm then 8 bars @ 80bpm'"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="relative min-h-[120px] bg-white/[0.03] border-white/5 border-2 rounded-3xl resize-none focus-visible:ring-primary/30 focus-visible:border-primary/20 transition-all placeholder:text-white/20 text-sm font-medium p-5"
        />
        <Button 
          size="sm" 
          className="absolute bottom-4 right-4 gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          <Wand2 size={14} />
          Parse
        </Button>
      </div>
      <div className="flex items-center gap-2 px-2">
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          Format: [Number] bars @ [Number] bpm
        </p>
      </div>
    </div>
  );
};

export default NaturalLanguageParser;