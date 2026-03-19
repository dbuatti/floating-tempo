"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMetronomeEngine, Song, TempoBlock, SoundType } from '@/hooks/use-metronome-engine';
import MetronomePlayer from '@/components/metronome/MetronomePlayer';
import TapTempo from '@/components/metronome/TapTempo';
import PresetsManager from '@/components/metronome/PresetsManager';
import PracticeTimer from '@/components/metronome/PracticeTimer';
import SoundSelector from '@/components/metronome/SoundSelector';
import AuthButton from '@/components/auth/AuthButton';
import QuickAddSong from '@/components/metronome/QuickAddSong';
import SongListItem from '@/components/metronome/SongListItem';
import SongEditorModal from '@/components/metronome/SongEditorModal';
import StageView from '@/components/metronome/StageView';
import SavedInputs from '@/components/metronome/SavedInputs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Music2, 
  Maximize2,
  LayoutGrid,
  ListMusic,
  Repeat,
  Cloud,
  CloudOff,
  SortAsc,
  AlertCircle,
  History,
  Settings2,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const DEFAULT_SONGS: Song[] = [
  { 
    id: '1', 
    name: 'Warmup', 
    sequence: [{ id: 'b1', name: 'Main', bpm: 120, bars: 4, timeSignature: 4, subdivision: 1 }],
    shouldLoop: false
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
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('metronome-songs');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return (parsed as Song[]).map(song => ({
          ...song,
          sequence: Array.isArray(song.sequence) ? song.sequence : [{ id: Math.random().toString(36).substr(2, 9), name: 'Main', bpm: 120, bars: 4, timeSignature: 4, subdivision: 1 as const }]
        }));
      }
      return DEFAULT_SONGS;
    } catch (e) {
      return DEFAULT_SONGS;
    }
  });
  
  const [activeSongId, setActiveSongId] = useState<string>(() => localStorage.getItem('active-song-id') || (songs[0]?.id || ''));
  const [activeSetlistName, setActiveSetlistName] = useState<string>(() => localStorage.getItem('active-setlist-name') || 'Untitled Setlist');
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(() => localStorage.getItem('active-setlist-id'));
  const [isCloudSetlist, setIsCloudSetlist] = useState<boolean>(() => localStorage.getItem('is-cloud-setlist') === 'true');
  
  const [soundType, setSoundType] = useState<SoundType>('woodblock');
  const [volume, setVolume] = useState(0.5);
  const [pan, setPan] = useState(0);
  const [useCountIn, setUseCountIn] = useState(false);
  const [isStageMode, setIsStageMode] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (songs.length > 0) localStorage.setItem('metronome-songs', JSON.stringify(songs));
    localStorage.setItem('active-song-id', activeSongId);
    localStorage.setItem('active-setlist-name', activeSetlistName);
    localStorage.setItem('active-setlist-id', activeSetlistId || '');
    localStorage.setItem('is-cloud-setlist', String(isCloudSetlist));

    const syncSetlist = async () => {
      if (!activeSetlistId) return;
      setIsSyncing(true);
      try {
        if (isCloudSetlist && user) {
          await supabase.from('setlists').update({ songs }).eq('id', activeSetlistId);
        } else {
          const savedLocal = localStorage.getItem('metronome-presets');
          const localSets = savedLocal ? JSON.parse(savedLocal) : [];
          const updated = localSets.map((s: any) => s.id === activeSetlistId ? { ...s, songs } : s);
          localStorage.setItem('metronome-presets', JSON.stringify(updated));
        }
      } finally {
        setTimeout(() => setIsSyncing(false), 1000);
      }
    };

    const timeoutId = setTimeout(syncSetlist, 3000);
    return () => clearTimeout(timeoutId);
  }, [songs, activeSongId, activeSetlistName, activeSetlistId, isCloudSetlist, user]);

  const activeSong = useMemo(() => songs.find(s => s.id === activeSongId) || songs[0] || DEFAULT_SONGS[0], [songs, activeSongId]);
  const editingSong = useMemo(() => songs.find(s => s.id === editingSongId) || null, [songs, editingSongId]);

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
  } = useMetronomeEngine(
    activeSong?.sequence || [], 
    soundType, 
    volume, 
    pan,
    useCountIn, 
    0, 
    activeSong?.shouldLoop || false,
    !!editingSongId
  );

  const currentBlock = activeSong?.sequence?.[currentBlockIndex];
  const displayBpm = (currentBlock?.bpm || 120) + bpmOffset;
  const accentColor = useMemo(() => getBpmColor(displayBpm), [displayBpm]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (e.code === 'Space') {
        if (isInputFocused) return;
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'r') {
        if (isInputFocused) return;
        reset();
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

  const handleLoadSetlist = (newSongs: Song[], name: string, id: string, isCloud: boolean) => {
    setSongs(newSongs);
    setActiveSongId(newSongs[0]?.id || '');
    setActiveSetlistName(name);
    setActiveSetlistId(id);
    setIsCloudSetlist(isCloud);
    reset();
  };

  const sortSongsAlphabetically = () => {
    const sorted = [...songs].sort((a, b) => a.name.localeCompare(b.name));
    setSongs(sorted);
    showSuccess("Sorted A-Z");
  };

  const handleLoadSequence = (sequence: TempoBlock[]) => {
    const newSong: Song = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Imported Sequence ${songs.length + 1}`,
      sequence,
      shouldLoop: false
    };
    addSong(newSong);
    showSuccess("Sequence loaded as new song");
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
            totalBlocks={activeSong?.sequence?.length || 0}
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
            onNextBlock={() => currentBlockIndex < (activeSong?.sequence?.length || 0) - 1 && jumpToBlock(currentBlockIndex + 1)}
          />
        )}
      </AnimatePresence>

      <SongEditorModal 
        song={editingSong}
        isOpen={!!editingSongId}
        onClose={() => setEditingSongId(null)}
        onUpdate={updateSong}
        onJumpToBlock={jumpToBlock}
        currentBlockIndex={activeSongId === editingSongId ? currentBlockIndex : -1}
      />

      <div className="max-w-7xl mx-auto px-8 py-16 space-y-20 relative z-10">
        <header className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-50">
          <div className="flex items-center gap-8">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-[0_25px_60px_rgba(168,85,247,0.4)]"
            >
              <Music2 className="text-white w-10 h-10" />
            </motion.div>
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-black tracking-tighter text-white leading-none">Fluid</h1>
                <div className="h-8 w-[2px] bg-white/10 mx-1" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-primary tracking-tight truncate max-w-[250px]">{activeSetlistName}</span>
                    {isCloudSetlist ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <Cloud size={12} className={cn("text-primary", isSyncing && "animate-pulse")} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Synced</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <CloudOff size={12} className="text-white/20" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Local</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/20">Studio Elite Metronome • v2.0</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 p-3 bg-white/[0.02] rounded-[2.5rem] border border-white/5 backdrop-blur-3xl relative z-50 shadow-2xl">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/challenge')}
              className="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider h-10 px-4 hover:bg-primary/10 hover:text-primary"
            >
              <Trophy size={14} className="text-primary" />
              Challenge
            </Button>
            <div className="w-[1px] h-10 bg-white/5 mx-1" />
            <PresetsManager currentSongs={songs} onLoad={handleLoadSetlist} />
            <div className="w-[1px] h-10 bg-white/5 mx-1" />
            <PracticeTimer onTimeUp={() => isPlaying && togglePlay()} isActive={isPlaying} />
            <div className="w-[1px] h-10 bg-white/5 mx-1" />
            <AuthButton />
          </div>
        </header>

        {user && !isCloudSetlist && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-between gap-6 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="text-amber-500" size={20} />
              </div>
              <p className="text-sm font-bold text-amber-200/80">This setlist is currently <span className="text-amber-500">Local Only</span>. Save it to your library to sync it to the cloud.</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => document.querySelector<HTMLButtonElement>('[data-presets-trigger]')?.click()}
              className="text-[11px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 h-11 px-6 rounded-2xl"
            >
              Save to Library
            </Button>
          </motion.div>
        )}

        <section className="space-y-12 relative z-10">
          <div className="flex items-center justify-between px-8">
            <div className="flex items-center gap-5">
              <div className="w-4 h-8 rounded-full bg-primary shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
              <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white/40">Performance Focus</h2>
            </div>
            <Button 
              onClick={() => setIsStageMode(true)} 
              className="rounded-[2rem] bg-primary hover:bg-primary/90 h-14 px-10 gap-4 text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(168,85,247,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <Maximize2 size={20} />
              Enter Stage Mode
            </Button>
          </div>

          <MetronomePlayer 
            activeSong={activeSong}
            volume={volume}
            setVolume={setVolume}
            pan={pan}
            setPan={setPan}
            accentColor={accentColor}
            displayBpm={displayBpm}
            isPlaying={isPlaying}
            currentBlockIndex={currentBlockIndex}
            currentBeat={currentBeat}
            currentBar={currentBar}
            subdivisionProgress={subdivisionProgress}
            onTogglePlay={togglePlay}
            onReset={reset}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ListMusic className="text-primary" size={22} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white/40">Song List</h2>
              </div>
              <div className="flex items-center gap-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={sortSongsAlphabetically}
                  className="h-10 px-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/20 hover:text-primary hover:bg-primary/10 gap-3 transition-all"
                >
                  <SortAsc size={16} />
                  Sort A-Z
                </Button>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/10 bg-white/5 px-4 py-2 rounded-full">{songs.length} Songs Total</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {songs.map((song) => (
                <SongListItem 
                  key={song.id}
                  song={song}
                  isActive={activeSongId === song.id}
                  isPlaying={isPlaying && activeSongId === song.id}
                  onSelect={() => {
                    if (activeSongId !== song.id) {
                      setActiveSongId(song.id);
                      reset();
                    }
                  }}
                  onTogglePlay={togglePlay}
                  onEdit={() => {
                    setActiveSongId(song.id);
                    setEditingSongId(song.id);
                  }}
                  onDelete={() => deleteSong(song.id)}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <div className="flex items-center gap-4 px-8">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="text-primary" size={22} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white/40">Quick Tools</h2>
            </div>
            <div className="space-y-8">
              <QuickAddSong onAdd={addSong} />
              
              <div className="p-8 bg-white/[0.02] rounded-[3rem] border border-white/5 space-y-8 shadow-2xl backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Settings2 size={14} className="text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Audio Engine</span>
                  </div>
                  <SoundSelector value={soundType} onChange={setSoundType} />
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Repeat size={16} className={cn(activeSong?.shouldLoop ? "text-primary" : "text-white/20")} />
                    <Label htmlFor="loop-toggle" className="text-[11px] font-black uppercase tracking-widest text-white/40 cursor-pointer">Loop Song</Label>
                  </div>
                  <Switch id="loop-toggle" checked={activeSong?.shouldLoop || false} onCheckedChange={(checked) => activeSong && updateSong({ ...activeSong, shouldLoop: checked })} className="data-[state=checked]:bg-primary" />
                </div>

                <TapTempo onTempoChange={(bpm) => {
                  if (activeSong) {
                    const updatedSequence = [...activeSong.sequence];
                    if (updatedSequence[0]) {
                      updatedSequence[0] = { ...updatedSequence[0], bpm };
                      updateSong({ ...activeSong, sequence: updatedSequence });
                    }
                  }
                }} />
              </div>

              {user && (
                <div className="p-8 bg-white/[0.02] rounded-[3rem] border border-white/5 space-y-6 shadow-2xl backdrop-blur-xl">
                  <SavedInputs onLoad={handleLoadSequence} />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;