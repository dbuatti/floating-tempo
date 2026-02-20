import React, { useState, useEffect } from 'react';
import { useMetronomeEngine, TempoBlock, SoundType } from '@/hooks/use-metronome-engine';
import TempoBlockItem from '@/components/metronome/TempoBlockItem';
import VisualFeedback from '@/components/metronome/VisualFeedback';
import NaturalLanguageParser from '@/components/metronome/NaturalLanguageParser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Plus, Music2, Settings2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const DEFAULT_SEQUENCE: TempoBlock[] = [
  { id: '1', bpm: 120, bars: 4, timeSignature: 4, subdivision: 1 },
  { id: '2', bpm: 80, bars: 2, timeSignature: 4, subdivision: 1 },
];

const Index = () => {
  const [sequence, setSequence] = useState<TempoBlock[]>(() => {
    const saved = localStorage.getItem('metronome-sequence');
    return saved ? JSON.parse(saved) : DEFAULT_SEQUENCE;
  });
  
  const [soundType, setSoundType] = useState<SoundType>('woodblock');

  useEffect(() => {
    localStorage.setItem('metronome-sequence', JSON.stringify(sequence));
  }, [sequence]);

  const { 
    isPlaying, 
    currentBlockIndex, 
    currentBeat, 
    currentBar, 
    togglePlay, 
    reset 
  } = useMetronomeEngine(sequence, soundType);

  const addBlock = () => {
    const lastBlock = sequence[sequence.length - 1];
    const newBlock: TempoBlock = {
      id: Math.random().toString(36).substr(2, 9),
      bpm: lastBlock?.bpm || 120,
      bars: 4,
      timeSignature: 4,
      subdivision: 1
    };
    setSequence([...sequence, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<TempoBlock>) => {
    setSequence(sequence.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    if (sequence.length > 1) {
      setSequence(sequence.filter(b => b.id !== id));
    }
  };

  const handleParse = (newBlocks: TempoBlock[]) => {
    setSequence(newBlocks);
    showSuccess(`Generated ${newBlocks.length} tempo blocks`);
  };

  const currentBlock = sequence[currentBlockIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Music2 className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fluid Metronome</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Studio Precision Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={soundType}
              onChange={(e) => setSoundType(e.target.value as SoundType)}
              className="bg-card border-none rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider focus:ring-1 ring-primary/50 outline-none"
            >
              <option value="woodblock">Wood Block</option>
              <option value="digital">Digital Click</option>
              <option value="cowbell">Cowbell</option>
            </select>
          </div>
        </header>

        {/* Main Display */}
        <Card className="bg-[#111] border-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <div className="text-7xl font-black tracking-tighter font-mono text-primary">
              {currentBlock?.bpm}
              <span className="text-xl text-muted-foreground ml-2">BPM</span>
            </div>
            <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
              Block {currentBlockIndex + 1} • Bar {currentBar + 1}/{currentBlock?.bars}
            </div>
          </div>

          <VisualFeedback 
            currentBeat={currentBeat} 
            totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
            isPlaying={isPlaying}
          />

          <div className="flex justify-center gap-4 mt-8">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={reset}
              className="rounded-full w-14 h-14 p-0 border-white/10 hover:bg-white/5"
            >
              <RotateCcw size={24} />
            </Button>
            
            <Button 
              size="lg" 
              onClick={togglePlay}
              className="rounded-full w-20 h-20 p-0 shadow-2xl shadow-primary/40 hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-full w-14 h-14 p-0 border-white/10 hover:bg-white/5"
            >
              <Settings2 size={24} />
            </Button>
          </div>
        </Card>

        {/* Timeline & Input */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sequence Timeline</h2>
              <Button variant="ghost" size="sm" onClick={addBlock} className="gap-2 text-xs">
                <Plus size={14} /> Add Block
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {sequence.map((block, idx) => (
                <TempoBlockItem 
                  key={block.id}
                  block={block}
                  isActive={currentBlockIndex === idx}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Natural Language</h2>
            <NaturalLanguageParser onParse={handleParse} />
            
            <Card className="p-4 bg-primary/5 border-primary/10">
              <h3 className="text-xs font-bold uppercase mb-2 text-primary">Pro Tip</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the parser to quickly draft complex polyrhythmic structures or tempo ramps.
              </p>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;