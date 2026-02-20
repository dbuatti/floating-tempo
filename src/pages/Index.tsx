import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Keyboard,
  Maximize2,
  Minimize2,
  Settings2
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

const getBpmColor = (bpm: number) => {
  if (bpm < 60) return "#3b82f6"; // Blue
  if (bpm < 90) return "#06b6d4"; // Cyan
  if (bpm < 120) return "#8b5cf6"; // Purple
  if (bpm < 160) return "#d946ef"; // Pink
  return "#ef4444"; // Red
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
  const [isFocusMode, setIsFocusMode] = useState(false);

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
    subdivisionProgress,
    bpmOffset,
    togglePlay, 
    reset 
  } = useMetronomeEngine(sequence, soundType, volume, useCountIn, autoIncrement);

  const currentBlock = sequence[currentBlockIndex];
  const displayBpm = (currentBlock?.bpm || 120) + bpmOffset;
  const accentColor = useMemo(() => getBpmColor(displayBpm), [displayBpm]);

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
      } else if (e.key.toLowerCase() === 'f') {
        setIsFocusMode(prev => !prev);
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

  const handleSeek = useCallback((progress: number) => {
    showSuccess(`Seeking to ${Math.round(progress * 100)}%`);
  }, []);

  return (
    <div className={cn(
      "min-h-screen bg-[#08080a] text-foreground selection:bg-primary/30 transition-all duration-700 overflow-x-hidden analog-noise",
      isPlaying && currentBeat === 0 && !isCountingIn && visualFlash ? "brightness-150" : ""
    )}>
      {/* Immersive Background Engine */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            backgroundColor: accentColor,
            scale: isPlaying && currentBeat === 0 ? 1.2 : 1,
            opacity: isPlaying && currentBeat === 0 ? 0.15 : 0.05
          }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] blur-[200px] rounded-full transition-colors duration-1000" 
        />
        <motion.div 
          animate={{ 
            backgroundColor: accentColor,
            scale: isPlaying && currentBeat === 0 ? 1.1 : 1,
            opacity: isPlaying && currentBeat === 0 ? 0.1 : 0.03
          }}
          transition={{ type: "spring", stiffness: 200, damping: 35 }}
          className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] blur-[200px] rounded-full transition-colors duration-1000" 
        />
      </div>

      <div className={cn(
        "max-w-6xl mx-auto px-6 py-12 space-y-16 relative z-10 transition-all duration-1000",
        isFocusMode ? "py-32" : "py-12"
      )}>
        
        {/* Header */}
        <AnimatePresence>
          {!isFocusMode && (
            <motion.header 
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col md:flex-row items-center justify-between gap-10"
            >
              <div className="flex items-center gap-6">
                <motion.div 
                  animate={{ 
                    backgroundColor: accentColor, 
                    boxShadow: `0 25px 50px ${accentColor}44, inset 0 0 20px rgba(255,255,255,0.3)` 
                  }}
                  whileHover={{ scale: 1.1, rotate: 0 }}
                  className="w-16 h-16 rounded-[2rem] flex items-center justify-center rotate-12 transition-all duration-500 cursor-pointer"
                >
                  <Music2 className="text-white w-8 h-8" />
                </motion.div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter text-white leading-none">Fluid</h1>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] mt-1" style={{ color: accentColor }}>Studio Elite Metronome</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-5 p-2 bg-white/[0.02] rounded-[2rem] border border-white/5 backdrop-blur-xl">
                <PracticeTimer onTimeUp={() => isPlaying && togglePlay()} isActive={isPlaying} />
                <div className="w-[1px] h-8 bg-white/5 mx-2" />
                <SoundSelector value={soundType} onChange={setSoundType} />
                <PresetsManager currentSequence={sequence} onLoad={setSequence} />
                <TapTempo onTempoChange={(bpm) => updateBlock(currentBlock.id, { bpm })} />
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Main Display Engine */}
        <Card className={cn(
          "bg-white/[0.02] border-white/5 relative overflow-hidden backdrop-blur-[100px] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.8)] rounded-[4rem] transition-all duration-1000",
          isFocusMode ? "p-24 scale-110 border-white/10" : "p-16"
        )}>
          {/* Inner Glows */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="flex flex-col items-center text-center space-y-10 mb-16">
            <div className="relative">
              <AnimatePresence mode="wait">
                {isCountingIn && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    style={{ color: accentColor }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 font-black uppercase tracking-[0.6em] animate-pulse text-xs"
                  >
                    Ready
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative flex items-center justify-center">
                <motion.div
                  key={displayBpm}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ 
                    scale: isPlaying && currentBeat === 0 ? 1.08 : 1,
                    opacity: 1 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={cn(
                    "text-[12rem] font-black tracking-tighter font-mono leading-none transition-all duration-100",
                    isPlaying && currentBeat === 0 ? "drop-shadow-[0_0_80px_rgba(255,255,255,0.3)]" : "text-white",
                    isCountingIn && "text-white/10"
                  )}
                  style={{ color: isPlaying && currentBeat === 0 ? accentColor : 'white' }}
                >
                  {displayBpm}
                </motion.div>
                <div className="absolute -right-20 bottom-8 text-3xl font-black uppercase tracking-widest opacity-10">BPM</div>
                
                <AnimatePresence>
                  {bpmOffset > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      style={{ color: accentColor }}
                      className="absolute -right-24 top-6 font-black text-2xl flex items-center gap-2"
                    >
                      <TrendingUp size={24} />
                      +{bpmOffset}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <motion.div 
                key={getTempoName(displayBpm)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: accentColor }}
                className="text-2xl font-black italic tracking-[0.3em] uppercase opacity-40"
              >
                {getTempoName(displayBpm)}
              </motion.div>
              
              <div className="flex items-center gap-6 px-8 py-3 bg-white/[0.03] rounded-full border border-white/10 backdrop-blur-2xl shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] opacity-40">Block</span>
                  <span className="text-[11px] font-mono font-black text-white">{currentBlockIndex + 1}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] opacity-40">Bar</span>
                  <span className="text-[11px] font-mono font-black text-white">{currentBar + 1} / {currentBlock?.bars}</span>
                </div>
              </div>
            </div>
          </div>

          <VisualFeedback 
            currentBeat={currentBeat} 
            totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
            isPlaying={isPlaying}
            accentColor={accentColor}
            onSeek={handleSeek}
            subdivisionProgress={subdivisionProgress}
          />

          <div className="flex flex-col items-center gap-12 mt-16">
            <div className="flex justify-center items-center gap-12">
              <AnimatePresence>
                {!isFocusMode && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={reset}
                            className="rounded-[2rem] w-20 h-20 p-0 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl"
                          >
                            <RotateCcw size={28} className="text-white/60" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>Reset (R)</TooltipContent>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  onClick={togglePlay}
                  style={{ 
                    backgroundColor: accentColor, 
                    boxShadow: `0 30px 80px -20px ${accentColor}aa, inset 0 0 30px rgba(255,255,255,0.4)` 
                  }}
                  className="rounded-[4rem] w-32 h-32 p-0 transition-all duration-500 border-none"
                >
                  {isPlaying ? <Pause size={56} fill="currentColor" /> : <Play size={56} fill="currentColor" className="ml-3" />}
                </Button>
              </motion.div>

              <div className="flex flex-col items-center gap-4 w-20">
                <Volume2 size={24} className="text-white/30" />
                <Slider 
                  value={[volume * 100]} 
                  onValueChange={(v) => setVolume(v[0] / 100)}
                  max={100}
                  step={1}
                  className="w-28 -rotate-90 mt-12"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-12 p-6 bg-white/[0.02] rounded-[3rem] border border-white/5">
              <div className="flex items-center space-x-4">
                <Switch 
                  id="count-in" 
                  checked={useCountIn} 
                  onCheckedChange={setUseCountIn}
                  style={{ '--primary': accentColor } as any}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="count-in" className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 cursor-pointer flex items-center gap-2 hover:text-white/60 transition-colors">
                  <Timer size={16} /> Count In
                </Label>
              </div>

              <div className="flex items-center space-x-4">
                <Switch 
                  id="visual-flash" 
                  checked={visualFlash} 
                  onCheckedChange={setVisualFlash}
                  style={{ '--primary': accentColor } as any}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="visual-flash" className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 cursor-pointer flex items-center gap-2 hover:text-white/60 transition-colors">
                  <Zap size={16} /> Flash
                </Label>
              </div>

              <div className="flex items-center space-x-4">
                <Switch 
                  id="focus-mode" 
                  checked={isFocusMode} 
                  onCheckedChange={setIsFocusMode}
                  style={{ '--primary': accentColor } as any}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="focus-mode" className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 cursor-pointer flex items-center gap-2 hover:text-white/60 transition-colors">
                  {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />} Focus
                </Label>
              </div>

              <div className="flex items-center gap-5">
                <Label htmlFor="auto-inc" className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                  <TrendingUp size={16} /> Auto-Inc
                </Label>
                <select 
                  id="auto-inc"
                  value={autoIncrement}
                  onChange={(e) => setAutoIncrement(parseInt(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[11px] font-black outline-none cursor-pointer hover:bg-white/10 transition-all"
                  style={{ color: accentColor }}
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

        {/* Timeline & Input Engine */}
        <AnimatePresence>
          {!isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              <div className="lg:col-span-8 space-y-10">
                <div className="flex items-center justify-between px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-6 rounded-full shadow-2xl" style={{ backgroundColor: accentColor }} />
                    <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Timeline</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={exportSequence} className="gap-2 text-[11px] font-black uppercase tracking-widest text-white/20 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                      <Share2 size={16} /> Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="gap-2 text-[11px] font-black uppercase tracking-widest text-white/20 hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all">
                      <Trash2 size={16} /> Clear
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={addBlock} 
                      style={{ color: accentColor }}
                      className="gap-2 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all"
                    >
                      <Plus size={16} /> Add Block
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-8 max-h-[700px] overflow-y-auto pr-6 custom-scrollbar">
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

              <div className="lg:col-span-4 space-y-10">
                <div className="flex items-center gap-4 px-6">
                  <div className="w-3 h-6 rounded-full shadow-2xl" style={{ backgroundColor: accentColor }} />
                  <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Smart Input</h2>
                </div>
                
                <NaturalLanguageParser onParse={handleParse} />
                
                <div className="space-y-8">
                  <Card className="p-10 bg-white/[0.01] border-white/5 rounded-[3rem] relative overflow-hidden group backdrop-blur-3xl">
                    <div className="absolute -right-10 -bottom-10 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-1000 rotate-45 group-hover:rotate-0" style={{ color: accentColor }}>
                      <Settings2 size={180} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3" style={{ color: accentColor }}>
                      <Sparkles size={18} />
                      Pro Tip
                    </h3>
                    <p className="text-sm text-white/30 leading-relaxed font-bold">
                      The <span className="text-white/60">Radial Ring</span> shows the exact subdivision progress. Use it to master complex polyrhythms.
                    </p>
                  </Card>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="outline" 
                      className="w-full gap-4 rounded-[2rem] border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-[11px] font-black uppercase tracking-[0.3em] h-16 transition-all shadow-lg"
                      onClick={() => setShowShortcuts(!showShortcuts)}
                    >
                      <Keyboard size={20} style={{ color: accentColor }} />
                      Shortcuts
                    </Button>
                  </motion.div>

                  <AnimatePresence>
                    {showShortcuts && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Card className="p-8 bg-white/[0.01] border-white/5 rounded-[2.5rem] space-y-5 backdrop-blur-md">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">Space</span>
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Play</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">F</span>
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Focus</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">T</span>
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Tap</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">R</span>
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Reset</span>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Index;