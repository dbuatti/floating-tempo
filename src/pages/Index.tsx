import React, { useState, useEffect } from 'react';
import { useMetronomeEngine, TempoBlock, SoundType } from '@/hooks/use-metronome-engine';
import TempoBlockItem from '@/components/metronome/TempoBlockItem';
import VisualFeedback from '@/components/metronome/VisualFeedback';
import NaturalLanguageParser from '@/components/metronome/NaturalLanguageParser';
import TapTempo from '@/components/metronome/TapTempo';
import PresetsManager from '@/components/metronome/PresetsManager';
import PracticeTimer from '@/components/metronome/PracticeTimer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Music2, 
  Volume2, 
  Trash2, 
  Sparkles, 
  Timer,
  ArrowRight,
  TrendingUp,
  Zap,
  Share2,
  HelpCircle,
  Keyboard
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const DEFAULT_SEQUENCE: TempoBlock[] = [
  { id: '1', bpm: 120, bars: 4, timeSignature: 4, subdivision: 1 },
];

const getTempoName = (bpm: number) => {
  if (bpm < 40) return "Grave";
  if (bpm < 60) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 156) return "Allegro";
  if (bpm < 176) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
};

const Index = () => {
  const [sequence, setSequence] = useState<TempoBlock[]>(() => {
    const saved = localStorage.getItem('metronome-sequence');
    return saved ? JSON.parse(saved) : DEFAULT_SEQUENCE;
  });
  
  const [soundType, setSoundType] = useState<SoundType>('woodblock');
  const [volume, setVolume] = useState(0.5);
  const [useCountIn, setUseCountIn] = useState(false);
  const [autoIncrement, setAutoIncrement] = useState(0);
  const [visualFlash, setVisualFlash] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    localStorage.setItem('metronome-sequence', JSON.stringify(sequence));
  }, [sequence]);

  const { 
    isPlaying, 
    isCountingIn,
    currentBlockIndex, 
    currentBeat, 
    currentBar, 
    totalProgress,
    bpmOffset,
    togglePlay, 
    reset 
  } = useMetronomeEngine(sequence, soundType, volume, useCountIn, autoIncrement);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'r') {
        reset();
        showSuccess("Sequence reset");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, reset]);

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

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = sequence.find(b => b.id === id);
    if (blockToDuplicate) {
      const index = sequence.findIndex(b => b.id === id);
      const newBlock = { ...blockToDuplicate, id: Math.random().toString(36).substr(2, 9) };
      const newSequence = [...sequence];
      newSequence.splice(index + 1, 0, newBlock);
      setSequence(newSequence);
      showSuccess("Block duplicated");
    }
  };

  const updateBlock = (id: string, updates: Partial<TempoBlock>) => {
    setSequence(sequence.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    if (sequence.length > 1) {
      setSequence(sequence.filter(b => b.id !== id));
    }
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newSequence = [...sequence];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sequence.length) return;
    
    [newSequence[index], newSequence[targetIndex]] = [newSequence[targetIndex], newSequence[index]];
    setSequence(newSequence);
  };

  const clearAll = () => {
    setSequence(DEFAULT_SEQUENCE);
    showSuccess("Sequence cleared");
  };

  const handleParse = (newBlocks: TempoBlock[]) => {
    setSequence(newBlocks);
    showSuccess(`Generated ${newBlocks.length} tempo blocks`);
  };

  const exportSequence = () => {
    const data = JSON.stringify(sequence);
    navigator.clipboard.writeText(data);
    showSuccess("Sequence copied to clipboard");
  };

  const currentBlock = sequence[currentBlockIndex];
  const nextBlock = sequence[(currentBlockIndex + 1) % sequence.length];
  const displayBpm = (currentBlock?.bpm || 120) + bpmOffset;

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground selection:bg-primary/30 transition-all duration-75",
      isPlaying && currentBeat === 0 && !isCountingIn && visualFlash ? "bg-primary/20" : ""
    )}>
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
          
          <div className="flex items-center gap-6">
            <PracticeTimer onTimeUp={() => isPlaying && togglePlay()} isActive={isPlaying} />
            <PresetsManager currentSequence={sequence} onLoad={setSequence} />
            <TapTempo onTempoChange={(bpm) => updateBlock(currentBlock.id, { bpm })} />
          </div>
        </header>

        {/* Main Display */}
        <Card className="bg-white/[0.02] border-white/5 p-10 relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              style={{ width: `${totalProgress * 100}%` }}
            />
          </div>

          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="relative">
              {isCountingIn && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-primary font-black uppercase tracking-[0.3em] animate-pulse text-sm">
                  Count In
                </div>
              )}
              <div className={cn(
                "text-8xl font-black tracking-tighter font-mono text-white transition-all duration-75",
                isPlaying && currentBeat === 0 ? "scale-110 drop-shadow-[0_0_40px_rgba(var(--primary),0.4)]" : "scale-100",
                isCountingIn ? "text-primary/50" : "text-white"
              )}>
                {displayBpm}
              </div>
              <div className="absolute -right-12 bottom-4 text-xl font-bold text-primary/80 uppercase tracking-widest">BPM</div>
              {bpmOffset > 0 && (
                <div className="absolute -right-16 top-0 text-primary font-black text-sm flex items-center gap-1">
                  <TrendingUp size={14} />
                  +{bpmOffset}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm font-black italic text-primary/60 tracking-widest uppercase">
                {getTempoName(displayBpm)}
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

            {sequence.length > 1 && (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20 mt-2">
                <span>Next</span>
                <ArrowRight size={10} />
                <span className="text-white/40">{nextBlock.bpm + bpmOffset} BPM</span>
                <span className="text-white/40">{nextBlock.timeSignature}/4</span>
              </div>
            )}
          </div>

          <VisualFeedback 
            currentBeat={currentBeat} 
            totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
            isPlaying={isPlaying}
          />

          <div className="flex flex-col items-center gap-8 mt-12">
            <div className="flex justify-center items-center gap-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={reset}
                    className="rounded-2xl w-14 h-14 p-0 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <RotateCcw size={22} className="text-white/70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Sequence (R)</TooltipContent>
              </Tooltip>
              
              <Button 
                size="lg" 
                onClick={togglePlay}
                className="rounded-[2rem] w-24 h-24 p-0 shadow-[0_0_50px_-12px_rgba(var(--primary),0.5)] hover:scale-105 active:scale-95 transition-all duration-300 bg-primary hover:bg-primary/90"
              >
                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
              </Button>

              <div className="flex flex-col items-center gap-2 w-14">
                <Volume2 size={18} className="text-white/40" />
                <Slider 
                  value={[volume * 100]} 
                  onValueChange={(v) => setVolume(v[0] / 100)}
                  max={100}
                  step={1}
                  className="w-20 -rotate-90 mt-8"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="count-in" 
                  checked={useCountIn} 
                  onCheckedChange={setUseCountIn}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="count-in" className="text-[10px] font-bold uppercase tracking-widest text-white/40 cursor-pointer flex items-center gap-1">
                  <Timer size={12} /> Count In
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="visual-flash" 
                  checked={visualFlash} 
                  onCheckedChange={setVisualFlash}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="visual-flash" className="text-[10px] font-bold uppercase tracking-widest text-white/40 cursor-pointer flex items-center gap-1">
                  <Zap size={12} /> Flash
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="auto-inc" className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                  <TrendingUp size={12} /> Auto-Inc
                </Label>
                <select 
                  id="auto-inc"
                  value={autoIncrement}
                  onChange={(e) => setAutoIncrement(parseInt(e.target.value))}
                  className="bg-white/5 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-primary outline-none cursor-pointer"
                >
                  <option value={0}>Off</option>
                  <option value={1}>+1 BPM</option>
                  <option value={2}>+2 BPM</option>
                  <option value={5}>+5 BPM</option>
                  <option value={10}>+10 BPM</option>
                </select>
              </div>
            </div>
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={exportSequence} className="gap-2 text-xs font-bold text-white/30 hover:text-primary hover:bg-primary/10 rounded-xl">
                  <Share2 size={14} /> Export
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="gap-2 text-xs font-bold text-white/30 hover:text-destructive hover:bg-destructive/10 rounded-xl">
                  <Trash2 size={14} /> Clear All
                </Button>
                <Button variant="ghost" size="sm" onClick={addBlock} className="gap-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl">
                  <Plus size={14} /> Add Block
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {sequence.map((block, idx) => (
                <TempoBlockItem 
                  key={block.id}
                  block={block}
                  isActive={currentBlockIndex === idx}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onDuplicate={duplicateBlock}
                  onMoveUp={() => moveBlock(idx, 'up')}
                  onMoveDown={() => moveBlock(idx, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === sequence.length - 1}
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
            
            <div className="space-y-4">
              <Card className="p-6 bg-primary/[0.03] border-primary/10 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-colors">
                  <Sparkles size={80} />
                </div>
                <h3 className="text-xs font-bold uppercase mb-3 text-primary flex items-center gap-2">
                  <Sparkles size={14} />
                  Pro Tip
                </h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  Use <span className="text-white/60">Mute Block</span> to practice "Gap Clicking" and test your internal timing.
                </p>
              </Card>

              <Button 
                variant="outline" 
                className="w-full gap-2 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold uppercase tracking-widest h-12"
                onClick={() => setShowShortcuts(!showShortcuts)}
              >
                <Keyboard size={16} className="text-primary" />
                Keyboard Shortcuts
              </Button>

              {showShortcuts && (
                <Card className="p-5 bg-white/[0.02] border-white/5 rounded-3xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Space</span>
                    <span className="text-[10px] font-bold text-primary uppercase">Play / Pause</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">T</span>
                    <span className="text-[10px] font-bold text-primary uppercase">Tap Tempo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">R</span>
                    <span className="text-[10px] font-bold text-primary uppercase">Reset Sequence</span>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;