"use client";

import React, { useState, useEffect } from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Cloud, 
  CloudOff, 
  Loader2, 
  Music2, 
  Plus,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface Setlist {
  id: string;
  name: string;
  songs: TempoBlock[];
  is_cloud?: boolean;
  updated_at?: string;
}

interface SetlistManagerProps {
  currentSequence: TempoBlock[];
  onLoad: (sequence: TempoBlock[], name: string) => void;
  activeSetlistName: string;
}

const SetlistManager = ({ currentSequence, onLoad, activeSetlistName }: SetlistManagerProps) => {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchSetlists = async () => {
    setLoading(true);
    const savedLocal = localStorage.getItem('metronome-presets');
    const localSets: Setlist[] = savedLocal ? JSON.parse(savedLocal) : [];

    if (!user) {
      setSetlists(localSets);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      showError("Sync failed");
      setSetlists(localSets);
    } else {
      const cloudSets: Setlist[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        songs: item.songs as TempoBlock[],
        is_cloud: true,
        updated_at: item.updated_at
      }));
      setSetlists([...cloudSets, ...localSets.filter(ls => !cloudSets.find(cs => cs.name === ls.name))]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSetlists();
  }, [user]);

  const saveSetlist = async () => {
    if (!newSetName.trim()) return;
    setLoading(true);

    if (user) {
      const { error } = await supabase
        .from('setlists')
        .insert({
          user_id: user.id,
          name: newSetName,
          songs: currentSequence
        });

      if (error) showError(error.message);
      else {
        showSuccess(`"${newSetName}" synced to cloud`);
        setNewSetName('');
        fetchSetlists();
      }
    } else {
      const newSet: Setlist = {
        id: Math.random().toString(36).substr(2, 9),
        name: newSetName,
        songs: currentSequence
      };
      const updated = [newSet, ...setlists];
      localStorage.setItem('metronome-presets', JSON.stringify(updated.filter(s => !s.is_cloud)));
      setSetlists(updated);
      showSuccess(`"${newSetName}" saved locally`);
      setNewSetName('');
    }
    setLoading(false);
  };

  const deleteSetlist = async (set: Setlist) => {
    if (set.is_cloud && user) {
      const { error } = await supabase.from('setlists').delete().eq('id', set.id);
      if (error) showError(error.message);
      else fetchSetlists();
    } else {
      const updated = setlists.filter(s => s.id !== set.id);
      localStorage.setItem('metronome-presets', JSON.stringify(updated.filter(s => !s.is_cloud)));
      setSetlists(updated);
    }
  };

  const filteredSets = setlists.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <LayoutGrid className="text-primary" size={24} />
            Setlist Library
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Manage your audition sequences</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <Input 
              placeholder="Search setlists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/5 rounded-2xl h-11 text-xs font-bold focus-visible:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
            <Input 
              placeholder="New Setlist Name" 
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              className="bg-transparent border-none h-9 w-40 text-xs font-bold focus-visible:ring-0"
            />
            <Button 
              size="sm" 
              onClick={saveSetlist}
              disabled={!newSetName.trim() || loading}
              className="rounded-xl bg-primary hover:bg-primary/90 h-9 px-4 text-[10px] font-black uppercase tracking-widest"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && setlists.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-[2rem] bg-white/[0.02] animate-pulse border border-white/5" />
          ))
        ) : filteredSets.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5">
            <Music2 size={40} className="mx-auto text-white/10" />
            <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No setlists found</p>
          </div>
        ) : (
          filteredSets.map(set => (
            <Card 
              key={set.id} 
              className={cn(
                "p-6 bg-white/[0.02] border-white/5 hover:border-primary/30 transition-all group rounded-[2.5rem] relative overflow-hidden cursor-pointer",
                activeSetlistName === set.name && "border-primary/50 bg-primary/[0.03]"
              )}
              onClick={() => onLoad(set.songs, set.name)}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {set.is_cloud ? <Cloud size={12} className="text-primary" /> : <CloudOff size={12} className="text-white/20" />}
                    <h3 className="text-sm font-black text-white truncate max-w-[180px]">{set.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Songs</span>
                      <span className="text-xs font-mono font-black text-white/60">{set.songs.length}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/5" />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Total Bars</span>
                      <span className="text-xs font-mono font-black text-white/60">
                        {set.songs.reduce((acc, s) => acc + s.bars, 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSetlist(set);
                  }}
                  className="w-10 h-10 rounded-2xl opacity-0 group-hover:opacity-100 text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {activeSetlistName === set.name && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary" />
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SetlistManager;