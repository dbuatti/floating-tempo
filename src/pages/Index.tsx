import React, { useState, useEffect } from 'react';
import { useMetronomeEngine, TempoBlock, SoundType } from '@/hooks/use-metronome-engine';
import TempoBlockItem from '@/components/metronome/TempoBlockItem';
import VisualFeedback from '@/components/metronome/VisualFeedback';
import NaturalLanguageParser from '@/components/metronome/NaturalLanguageParser';
import TapTempo from '@/components/metronome/TapTempo';
import PresetsManager from '@/components/metronome/PresetsManager';
import PracticeTimer from '@/components/metronome/PracticeTimer';
import SoundSelector from '@/components/metronome/SoundSelector';
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
  Keyboard
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
      "min-h-screen bg-[#0a0a0c] text-foreground selection:bg-primary/30 transition-all duration-75 overflow-x-hidden",
      isPlaying && currentBeat === 0 && !isCountingIn && visualFlash ? "bg-primary/10" : ""
    )}>
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <motion.div 
              whileHover={{ rotate: 0, scale: 1.1 }}
              className="w-14 h-14 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 transition-all duration-500"
            >
              <Music2 className="text-primary-foreground w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/30">Fluid Metronome</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Professional Grade Engine</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <PracticeTimer onTimeUp={() => isPlaying && togglePlay()} isActive={isPlaying} />
            <SoundSelector value={soundType} onChange={setSoundType} />
            <PresetsManager currentSequence={sequence} onLoad={setSequence} />
            <TapTempo onTempoChange={(bpm) => updateBlock(currentBlock.id, { bpm })} />
          </div>
        </header>

        {/* Main Display */}
        <Card className="bg-white/[0.03] border-white/5 p-12 relative overflow-hidden backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3rem]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
            <motion.div 
              className="h-full bg-primary shadow-[0_0_20px_rgba(168,85,247,0.8)]"
              animate={{ width: `${totalProgress * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>

          <div className="flex flex-col items-center text-center space-y-6 mb-12">
            <div className="relative">
              <AnimatePresence mode="wait">
                {isCountingIn && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 text-primary font-black uppercase tracking-[0.4em] animate-pulse text-sm"
                  >
                    Count In
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative flex items-center justify-center">
                <motion.div
                  key={displayBpm}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "text-[10rem] font-black tracking-tighter font-mono leading-none transition-all duration-75",
                    isPlaying && currentBeat === 0 ? "text-primary drop-shadow-[0_0_60px_rgba(168,85,247,0.5)]" : "text-white",
                    isCountingIn && "text-white/20"
                  )}
                >
                  {displayBpm}
                </motion.div>
                <div className="absolute -right-16 bottom-6 text-2xl font-black text-primary/40 uppercase tracking-widest">BPM</div>
                
                <AnimatePresence>
                  {bpmOffset > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute -right-20 top-4 text-primary font-black text-lg flex items-center gap-1"
                    >
                      <TrendingUp size={18} />
                      +{bpmOffset}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                key={getTempoName(displayBpm)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-black italic text-primary/60 tracking-[0.2em] uppercase"
              >
                {getTempoName(displayBpm)}
              </motion.div>
              
              <div className="flex items-center gap-4 px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.2em]">
                  Block {currentBlockIndex + 1}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                <span className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.2em]">
                  Bar {currentBar + 1} / {currentBlock?.bars}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {sequence.length > 1 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-4"
                >
                  <span>Next</span>
                  <ArrowRight size={12} className="text-primary/40" />
                  <span className="text-white/40">{nextBlock.bpm + bpmOffset} BPM</span>
                  <span className="text-white/40">{nextBlock.timeSignature}/4</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <VisualFeedback 
            currentBeat={currentBeat} 
            totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
            isPlaying={isPlaying}
          />

          <div className="flex flex-col items-center gap-10 mt-12">
            <div className="flex justify-center items-center gap-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={reset}
                      className="rounded-[1.5rem] w-16 h-16 p-0 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      <RotateCcw size={24} className="text-white/70" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Reset Sequence (R)</TooltipContent>
              </Tooltip>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  onClick={togglePlay}
                  className="rounded-[3rem] w-28 h-28 p-0 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.6)] bg-primary hover:bg-primary/90 transition-all duration-500"
                >
                  {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                </Button>
              </motion.div>

              <div className="flex flex-col items-center gap-3 w-16">
                <Volume2 size={20} className="text-white/40" />
                <Slider 
                  value={[volume * 100]} 
                  onValueChange={(v) => setVolume(v[0] / 100)}
                  max={100}
                  step={1}
                  className="w-24 -rotate-90 mt-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-10">
              <div className="flex items-center space-x-3">
                <Switch 
                  id="count-in" 
                  checked={useCountIn} 
                  onCheckedChange={setUseCountIn}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="count-in" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 cursor-pointer flex items-center gap-2 hover:text-white/60 transition-colors">
                  <Timer size={14} /> Count In
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch 
                  id="visual-flash" 
                  checked={visualFlash} 
                  onCheckedChange={setVisualFlash}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="visual-flash" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 cursor-pointer flex items-center gap-2 hover:text-white/60 transition-colors">
                  <Zap size={14} /> Flash
                </Label>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="auto-inc" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <TrendingUp size={14} /> Auto-Inc
                </Label>
                <select 
                  id="auto-inc"
                  value={autoIncrement}
                  onChange={(e) => setAutoIncrement(parseInt(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black text-primary outline-none cursor-pointer hover:bg-white/10 transition-all"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Sequence Timeline</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={exportSequence} className="gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <Share2 size={14} /> Export
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                  <Trash2 size={14} /> Clear
                </Button>
                <Button variant="ghost" size="sm" onClick={addBlock} className="gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <Plus size={14} /> Add Block
                </Button>
              </div>
            </div>
            
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
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
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-3 px-4">
              <div className="w-2 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Smart Parser</h2>
            </div>
            
            <NaturalLanguageParser onParse={handleParse} />
            
            <div className="space-y-6">
              <Card className="p-8 bg-primary/[0.03] border-primary/10 rounded-[2.5rem] relative overflow-hidden group backdrop-blur-md">
                <div className="absolute -right-6 -bottom-6 text-primary/5 group-hover:text-primary/10 transition-all duration-700 rotate-12 group-hover:rotate-0">
                  <Sparkles size={120} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-primary flex items-center gap-2">
                  <Sparkles size={14} />
                  Pro Tip
                </h3>
                <p className="text-xs text-white/40 leading-relaxed font-bold">
                  Use <span className="text-white/70">Mute Block</span> to practice "Gap Clicking" and test your internal timing.
                </p>
              </Card>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  className="w-full gap-3 rounded-[1.5rem] border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-[0.2em] h-14 transition-all"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                >
                  <Keyboard size={18} className="text-primary" />
                  Keyboard Shortcuts
                </Button>
              </motion.div>

              <AnimatePresence>
                {showShortcuts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="p-6 bg-white/[0.02] border-white/5 rounded-[2rem] space-y-4 backdrop-blur-md">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Space</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Play / Pause</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">T</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Tap Tempo</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">R</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Reset</span>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;