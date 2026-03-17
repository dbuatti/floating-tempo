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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Music2, 
  Maximize2,
  LayoutGrid,
  ListMusic,
  Repeat,
  Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'r') {
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
        currentBlockIndex={activeSongId === editingSongId ? currentBlockIndex : -1}
      />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16 relative z-10">
        <header className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-[0_20px_50px_rgba(168,85,247,0.3)]">
              <Music2 className="text-white w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white leading-none">Fluid</h1>
                <div className="h-6 w-[2px] bg-white/10 mx-1" />
                <div className="flex items-center gap-2 min-w-[100px]">
                  <span className="text-xl font-black text-primary tracking-tight truncate max-w-[200px]">{activeSetlistName}</span>
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isSyncing && <Cloud size={14} className="text-primary animate-pulse shrink-0" />}
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-1 text-white/20">Studio Elite Metronome</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-5 p-2 bg-white/[0.02] rounded-[2rem] border border-white/5 backdrop-blur-xl relative z-50">
            <PresetsManager currentSongs={songs} onLoad={handleLoadSetlist} />
            <div className="w-[1px] h-8 bg-white/5 mx-2" />
            <PracticeTimer onTimeUp={() => isPlaying && togglePlay()} isActive={isPlaying} />
            <div className="w-[1px] h-8 bg-white/5 mx-2" />
            <AuthButton />
          </div>
        </header>

        <section className="space-y-10 relative z-10">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="w-3 h-6 rounded-full bg-primary shadow-2xl" />
              <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Performance Focus</h2>
            </div>
            <Button onClick={() => setIsStageMode(true)} className="rounded-2xl bg-primary hover:bg-primary/90 h-12 px-8 gap-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              <Maximize2 size={18} />
              Enter Stage Mode
            </Button>
          </div>

          <MetronomePlayer 
            activeSong={activeSong}
            volume={volume}
            setVolume={setVolume}
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

          <div className="lg:col-span-4 space-y-10">
            <div className="flex items-center gap-3 px-6">
              <LayoutGrid className="text-primary" size={20} />
              <h2 className="text-lg font-black uppercase tracking-[0.4em] text-white/50">Quick Tools</h2>
            </div>
            <div className="space-y-6">
              <QuickAddSong onAdd={addSong} />
              
              <div className="p-6 bg-white/[0.02] rounded-[2.5rem] border border-white/5 space-y-6">
                <SoundSelector value={soundType} onChange={setSoundType} />
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Repeat size={14} className={cn(activeSong?.shouldLoop ? "text-primary" : "text-white/20")} />
                    <Label htmlFor="loop-toggle" className="text-[10px] font-black uppercase tracking-widest text-white/40 cursor-pointer">Loop Song</Label>
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
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;