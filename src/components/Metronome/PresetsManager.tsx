"use client";

import React, { useState, useEffect } from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Save, FolderOpen, Trash2, X, Cloud, CloudOff, Loader2, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface Preset {
  id: string;
  name: string;
  sequence: TempoBlock[];
  is_cloud?: boolean;
}

interface PresetsManagerProps {
  currentSequence: TempoBlock[];
  onLoad: (sequence: TempoBlock[]) => void;
}

const PresetsManager = ({ currentSequence, onLoad }: PresetsManagerProps) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Handle Auth State
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Presets (Local + Cloud)
  const fetchPresets = async () => {
    setLoading(true);
    
    // 1. Get Local Presets
    const savedLocal = localStorage.getItem('metronome-presets');
    const localPresets: Preset[] = savedLocal ? JSON.parse(savedLocal) : [];

    if (!user) {
      setPresets(localPresets);
      setLoading(false);
      return;
    }

    // 2. Get Cloud Presets
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      showError("Failed to fetch cloud setlists");
      setPresets(localPresets);
    } else {
      const cloudPresets: Preset[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sequence: item.songs as TempoBlock[],
        is_cloud: true
      }));
      
      // Merge (Cloud takes priority for same names)
      setPresets([...cloudPresets, ...localPresets.filter(lp => !cloudPresets.find(cp => cp.name === lp.name))]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPresets();
  }, [user, isOpen]);

  const savePreset = async () => {
    if (!newPresetName.trim()) return;
    setLoading(true);

    if (user) {
      // Save to Supabase
      const { error } = await supabase
        .from('setlists')
        .insert({
          user_id: user.id,
          name: newPresetName,
          songs: currentSequence
        });

      if (error) {
        showError(error.message);
      } else {
        showSuccess(`"${newPresetName}" saved to cloud`);
        setNewPresetName('');
        fetchPresets();
      }
    } else {
      // Save to Local
      const newPreset: Preset = {
        id: Math.random().toString(36).substr(2, 9),
        name: newPresetName,
        sequence: currentSequence
      };
      const updated = [newPreset, ...presets];
      setPresets(updated);
      localStorage.setItem('metronome-presets', JSON.stringify(updated.filter(p => !p.is_cloud)));
      showSuccess(`"${newPresetName}" saved locally`);
      setNewPresetName('');
    }
    setLoading(false);
  };

  const deletePreset = async (preset: Preset) => {
    if (preset.is_cloud && user) {
      const { error } = await supabase.from('setlists').delete().eq('id', preset.id);
      if (error) showError(error.message);
      else {
        showSuccess("Deleted from cloud");
        fetchPresets();
      }
    } else {
      const updated = presets.filter(p => p.id !== preset.id);
      setPresets(updated);
      localStorage.setItem('metronome-presets', JSON.stringify(updated.filter(p => !p.is_cloud)));
      showSuccess("Deleted locally");
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider h-10",
          isOpen && "border-primary/50 bg-primary/5"
        )}
      >
        <FolderOpen size={14} className="text-primary" />
        Setlist Library
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-4 w-80 p-5 bg-[#0c0c0e]/95 backdrop-blur-2xl border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-50 rounded-[2rem] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music2 size={14} className="text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">My Auditions</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/5">
              <X size={14} />
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {loading && presets.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <Loader2 size={20} className="animate-spin text-primary/40" />
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Syncing...</p>
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-[10px] text-white/20 font-bold uppercase">No setlists found</p>
                {!user && <p className="text-[8px] text-white/10 uppercase tracking-tighter">Login to sync across devices</p>}
              </div>
            ) : (
              presets.map(preset => (
                <div key={preset.id} className="flex items-center gap-2 group">
                  <Button 
                    variant="ghost" 
                    className="flex-1 justify-start text-xs font-bold truncate rounded-xl hover:bg-primary/10 hover:text-primary h-10 px-3"
                    onClick={() => {
                      onLoad(preset.sequence);
                      setIsOpen(false);
                      showSuccess(`Loaded "${preset.name}"`);
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {preset.is_cloud ? <Cloud size={10} className="text-primary/40 shrink-0" /> : <CloudOff size={10} className="text-white/10 shrink-0" />}
                      <span className="truncate">{preset.name}</span>
                    </div>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deletePreset(preset)}
                    className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 text-white/20 hover:text-destructive transition-all"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-1">New Setlist Name</label>
              <Input 
                placeholder="e.g. Mrs Doubtfire Audition" 
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="h-10 bg-white/5 border-none rounded-xl text-xs font-bold focus-visible:ring-primary/30"
              />
            </div>
            <Button 
              className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90 h-10 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              onClick={savePreset}
              disabled={!newPresetName.trim() || loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Current Setlist
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PresetsManager;