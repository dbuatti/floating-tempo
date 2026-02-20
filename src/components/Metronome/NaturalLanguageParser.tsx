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
    // Simple regex: "X bars of Y bpm" or "X bars @ Y"
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
    <div className="space-y-3">
      <div className="relative">
        <Textarea 
          placeholder="Try: '4 bars of 120bpm then 8 bars of 80bpm'"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[100px] bg-card/50 border-none resize-none focus-visible:ring-primary/30"
        />
        <Button 
          size="sm" 
          className="absolute bottom-2 right-2 gap-2"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          <Wand2 size={14} />
          Parse
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground px-1">
        Format: [Number] bars of [Number] bpm
      </p>
    </div>
  );
};

export default NaturalLanguageParser;