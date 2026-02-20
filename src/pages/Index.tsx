import React, { useState, useEffect } from 'react';
import { useMetronomeEngine, TempoBlock, SoundType } from '@/hooks/use-metronome-engine';
import TempoBlockItem from '@/components/metronome/TempoBlockItem';
import VisualFeedback from '@/components/metronome/VisualFeedback';
import NaturalLanguageParser from '@/components/metronome/NaturalLanguageParser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Plus, Music2, Settings2, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Music2 className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">Fluid Metronome</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Professional Grade Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <div className={isPlaying ? "w-2 h-2 rounded-full bg-green-500 animate-pulse" : "w-2 h-2 rounded-full bg-white/20"} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{isPlaying ? 'Live' : 'Standby'}</span>
            </div>
            <select 
              value={soundType}
              onChange={(e) => setSoundType(e.target.value as SoundType)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider focus:ring-2 ring-primary/50 outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="woodblock">Wood Block</option>
              <option value="digital">Digital Click</option>
              <option value="cowbell">Cowbell</option>
            </select>
          </div>
        </header>

        {/* Main Display */}
        <Card className="bg-white/[0.02] border-white/5 p-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="relative">
              <div className="text-8xl font-black tracking-tighter font-mono text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                {currentBlock?.bpm}
              </div>
              <div className="absolute -right-12 bottom-4 text-xl font-bold text-primary/80 uppercase tracking-widest">BPM</div>
            </div>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-xs font-mono text-primary font-bold uppercase tracking-widest">
                Block {currentBlockIndex + 1}
              </span>
              <div className="w-1 h-1 rounded-full bg-primary/30" />
              <span className="text-xs font-mono text-primary font-bold uppercase tracking-widest">
                Bar {currentBar + 1} / {currentBlock?.bars}
              </span>
            </div>
          </div>

          <VisualFeedback 
            currentBeat={currentBeat} 
            totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
            isPlaying={isPlaying}
          />

          <div className="flex justify-center items-center gap-6 mt-12">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={reset}
              className="rounded-2xl w-14 h-14 p-0 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <RotateCcw size={22} className="text-white/70" />
            </Button>
            
            <Button 
              size="lg" 
              onClick={togglePlay}
              className="rounded-[2rem] w-24 h-24 p-0 shadow-[0_0_50px_-12px_rgba(var(--primary),0.5)] hover:scale-105 active:scale-95 transition-all duration-300 bg-primary hover:bg-primary/90"
            >
              {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-2xl w-14 h-14 p-0 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <Settings2 size={22} className="text-white/70" />
            </Button>
          </div>
        </Card>

        {/* Timeline & Input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-primary rounded-full" />
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Sequence Timeline</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={addBlock} className="gap-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl">
                <Plus size={14} /> Add Block
              </Button>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
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

          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Smart Parser</h2>
            </div>
            
            <NaturalLanguageParser onParse={handleParse} />
            
            <Card className="p-6 bg-primary/[0.03] border-primary/10 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-colors">
                <Sparkles size={80} />
              </div>
              <h3 className="text-xs font-bold uppercase mb-3 text-primary flex items-center gap-2">
                <Sparkles size={14} />
                Pro Tip
              </h3>
              <p className="text-xs text-white/40 leading-relaxed font-medium">
                Type commands like <span className="text-white/60">"4 bars @ 120bpm"</span> to instantly build your practice session.
              </p>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;