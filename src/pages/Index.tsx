import React, { useState, useEffect, useMemo } from 'react';
import { useMetronomeEngine, Song, TempoBlock, SoundType } from '@/hooks/use-metronome-engine';
import VisualFeedback from '@/components/metronome/VisualFeedback.tsx';
import TapTempo from '@/components/metronome/TapTempo.tsx';
import PresetsManager from '@/components/metronome/PresetsManager.tsx';
import StageView from '@/components/metronome/StageView.tsx';
import PracticeTimer from '@/components/metronome/PracticeTimer.tsx';
import SoundSelector from '@/components/metronome/SoundSelector.tsx';
import AuthButton from '@/components/auth/AuthButton.tsx';
import QuickAddSong from '@/components/metronome/QuickAddSong.tsx';
import SongListItem from '@/components/metronome/SongListItem.tsx';
import SongEditorModal from '@/components/metronome/SongEditorModal.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Music2, 
  Volume2, 
  RotateCcw, 
  Play, 
  Pause, 
  Maximize2,
  LayoutGrid,
  ListMusic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SONGS: Song[] = [
  { 
    id: '1', 
    name: 'Warmup', 
    sequence: [{ id: 'b1', name: 'Main', bpm: 120, bars: 4, timeSignature: 4, subdivision: 1 }] 
  },
];

const getBpmColor = (bpm: number) => {
  if (bpm < 60) return "#3b82f6";
  if (bpm < 90) return "#06b6d4";
  if (bpm < 120) return "#8b5cf6";
  if (bpm < 160) return "#d946ef";
  return "#ef4444";
};

const Index = () => {
  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('metronome-songs');
    return saved ? JSON.parse(saved) : DEFAULT_SONGS;
  });
  
  const [activeSongId, setActiveSongId] = useState<string>(() => {
    return localStorage.getItem('active-song-id') || (songs[0]?.id || '');
  });

  const [activeSetlistName, setActiveSetlistName] = useState<string>(() => {
    return localStorage.getItem('active-setlist-name') || 'Untitled Setlist';
  });
  
  const [soundType, setSoundType] = useState<SoundType>('woodblock');
  const [volume, setVolume] = useState(0.5);
  const [useCountIn, setUseCountIn] = useState(false);
  const [isStageMode, setIsStageMode] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  useEffect(() => {
    localStorage.setItem('metronome-songs', JSON.stringify(songs));
    localStorage.setItem('active-song-id', activeSongId);
    localStorage.setItem('active-setlist-name', activeSetlistName);
  }, [songs, activeSongId, activeSetlistName]);

  const activeSong = useMemo(() => 
    songs.find(s => s.id === activeSongId) || songs[0], 
  [songs, activeSongId]);

  const { 
    isPlaying, 
    isCountingIn,
    currentBlockIndex, 
    currentBeat, 
    currentBar, 
    subdivisionProgress,
    bpmOffset,
    togglePlay, 
    reset,
    jumpToBlock
  } = useMetronomeEngine(activeSong?.sequence || [], soundType, volume, useCountIn);

  const currentBlock = activeSong?.sequence[currentBlockIndex];
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
      } else if (e.key.toLowerCase() === 's') {
        setIsStageMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, reset]);

  const addSong = (newSong: Song) => {
    setSongs([...songs, newSong]);
    setActiveSongId(newSong.id);
    reset();
  };

  const updateSong = (updatedSong: Song) => {
    setSongs(songs.map(s => s.id === updatedSong.id ? updatedSong : s));
  };

  const deleteSong = (id: string) => {
    if (songs.length <= 1) return;
    const newSongs = songs.filter(s => s.id !== id);
    setSongs(newSongs);
    if (activeSongId === id) {
      setActiveSongId(newSongs[0].id);
      reset();
    }
  };

  const handleLoadSetlist = (newSequence: TempoBlock[]) => {
    // For backward compatibility with the old preset manager
    const newSong: Song = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Imported Setlist',
      sequence: newSequence
    };
    setSongs([newSong]);
    setActiveSongId(newSong.id);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-foreground selection:bg-primary/30 transition-all duration-700 overflow-x-hidden analog-noise">
      <AnimatePresence>
        {isStageMode && (
          <StageView 
            isPlaying={isPlaying}
            isCountingIn={isCountingIn}
            currentBlock={currentBlock}
            currentBlockIndex={currentBlockIndex}
            totalBlocks={activeSong?.sequence.length || 0}
            currentBeat={currentBeat}
            currentBar={currentBar}
            accentColor={accentColor}
            displayBpm={displayBpm}
            subdivisionProgress={subdivisionProgress}
            activeSetlistName={activeSong?.name || activeSetlistName}
            onTogglePlay={togglePlay}
            onReset={reset}
            onClose={() => setIsStageMode(false)}
            onPrevBlock={() => currentBlockIndex > 0 && jumpToBlock(currentBlockIndex - 1)} 
            onNextBlock={() => currentBlockIndex < (activeSong?.sequence.length || 0) - 1 && jumpToBlock(currentBlockIndex + 1)} 
          />
        )}
      </AnimatePresence>

      <SongEditorModal 
        song={editingSong}
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        onUpdate={updateSong}
      />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-[0_20px_50px_rgba(168,85,247,0.3)]">
              <Music2 className="text-white w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white leading-none">Fluid</h1>
                <div className="h-6 w-[2px] bg-white/10 mx-1" />
                <span className="text-xl font-black text-primary tracking-tight truncate max-w-[200px]">{activeSetlistName}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-1 text-white/20">Studio Elite Metronome</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-5 p-2 bg-white/[0.02] rounded-[2rem] border border-white/5 backdrop-blur-xl relative z-50">
            <PresetsManager currentSequence={activeSong?.sequence || []} onLoad={handleLoadSetlist} />
            <div className="w-[1px] h-8 bg-white/5 mx-2" />
            <PracticeTimer onTimeUp={() => isPlaying && togglePlay()} isActive={isPlaying} />
            <div className="w-[1px] h-8 bg-white/5 mx-2" />
            <AuthButton />
          </div>
        </header>

        {/* Active Song Focus */}
        <section className="space-y-10 relative z-10">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-3 h-6 rounded-full bg-primary shadow-2xl" />
              <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Now Playing: {activeSong?.name}</h2>
            </div>
            <Button 
              onClick={() => setIsStageMode(true)}
              className="rounded-2xl bg-primary hover:bg-primary/90 h-12 px-8 gap-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              <Maximize2 size={18} />
              Enter Stage Mode
            </Button>
          </div>

          <Card className="bg-white/[0.02] border-white/5 p-16 relative overflow-hidden backdrop-blur-[100px] rounded-[4rem]">
            <div className="flex flex-col items-center text-center space-y-10 mb-16">
              <div className="relative flex items-center justify-center">
                <motion.div
                  key={displayBpm}
                  animate={{ scale: isPlaying && currentBeat === 0 ? 1.08 : 1 }}
                  className="text-[12rem] font-black tracking-tighter font-mono leading-none text-white"
                  style={{ color: isPlaying && currentBeat === 0 ? accentColor : 'white' }}
                >
                  {displayBpm}
                </motion.div>
                <div className="absolute -right-20 bottom-8 text-3xl font-black uppercase tracking-widest opacity-10">BPM</div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-2xl font-black text-white/80 tracking-widest uppercase">
                  {currentBlock?.name || "Untitled Block"}
                </h3>
                <div className="flex items-center gap-6 px-8 py-3 bg-white/[0.03] rounded-full border border-white/10">
                  <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] opacity-40">Part {currentBlockIndex + 1}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] opacity-40">Bar {currentBar + 1} / {currentBlock?.bars}</span>
                </div>
              </div>
            </div>

            <VisualFeedback 
              currentBeat={currentBeat} 
              totalBeats={(currentBlock?.timeSignature || 4) * (currentBlock?.subdivision || 1)} 
              isPlaying={isPlaying}
              accentColor={accentColor}
              subdivisionProgress={subdivisionProgress}
            />

            <div className="flex flex-col items-center gap-12 mt-16">
              <div className="flex justify-center items-center gap-12">
                <Button size="lg" variant="outline" onClick={reset} className="rounded-[2rem] w-20 h-20 p-0 border-white/10 bg-white/5">
                  <RotateCcw size={28} className="text-white/60" />
                </Button>
                
                <Button 
                  size="lg" 
                  onClick={togglePlay}
                  style={{ backgroundColor: accentColor }}
                  className="rounded-[4rem] w-32 h-32 p-0 shadow-2xl border-none"
                >
                  {isPlaying ? <Pause size={56} fill="currentColor" /> : <Play size={56} fill="currentColor" className="ml-3" />}
                </Button>

                <div className="flex flex-col items-center gap-4 w-20">
                  <Volume2 size={24} className="text-white/30" />
                  <Slider value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} className="w-28 -rotate-90 mt-12" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Song List & Tools */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <ListMusic className="text-primary" size={20} />
                <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Song List</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{songs.length} Songs Total</span>
            </div>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-6 custom-scrollbar">
              {songs.map((song) => (
                <SongListItem 
                  key={song.id}
                  song={song}
                  isActive={activeSongId === song.id}
                  onSelect={() => {
                    if (activeSongId !== song.id) {
                      setActiveSongId(song.id);
                      reset();
                    }
                  }}
                  onEdit={() => setEditingSong(song)}
                  onDelete={() => deleteSong(song.id)}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="flex items-center gap-3 px-6">
              <LayoutGrid className="text-primary" size={20} />
              <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Quick Tools</h2>
            </div>
            <div className="space-y-6">
              <QuickAddSong onAdd={addSong} />
              
              <div className="p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <Volume2 size={12} className="text-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Audio Settings</span>
                </div>
                <SoundSelector value={soundType} onChange={setSoundType} />
                <TapTempo onTempoChange={(bpm) => {
                  if (activeSong) {
                    const updatedSequence = [...activeSong.sequence];
                    updatedSequence[0] = { ...updatedSequence[0], bpm };
                    updateSong({ ...activeSong, sequence: updatedSequence });
                  }
                }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;