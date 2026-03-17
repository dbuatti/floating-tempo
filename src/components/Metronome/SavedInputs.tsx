"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { History, Play, Trash2, Loader2 } from 'lucide-react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { showSuccess, showError } from '@/utils/toast';

interface SavedInput {
  id: string;
  input_text: string;
  sequence: any;
  created_at: string;
}

interface SavedInputsProps {
  onLoad: (sequence: TempoBlock[]) => void;
}

const SavedInputs = ({ onLoad }: SavedInputsProps) => {
  const [saved, setSaved] = useState<SavedInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSaved = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('metronome_inputs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) showError(error.message);
    else setSaved(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchSaved();
    else setSaved([]);
  }, [user]);

  const deleteInput = async (id: string) => {
    const { error } = await supabase.from('metronome_inputs').delete().eq('id', id);
    if (error) showError(error.message);
    else {
      setSaved(saved.filter(s => s.id !== id));
      showSuccess("Input deleted");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
          <History size={14} /> Recent Inputs
        </h3>
        {loading && <Loader2 size={14} className="animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {saved.length === 0 && !loading && (
          <p className="text-[10px] text-white/20 font-bold uppercase py-4 px-2">No saved inputs yet</p>
        )}
        {saved.map((item) => (
          <Card key={item.id} className="p-4 bg-white/[0.02] border-white/5 hover:border-white/10 transition-all group rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/60 truncate italic">"{item.input_text}"</p>
                <p className="text-[9px] font-black text-white/20 uppercase mt-1">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onLoad(item.sequence)}
                  className="w-8 h-8 rounded-lg text-primary hover:bg-primary/10"
                >
                  <Play size={14} fill="currentColor" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteInput(item.id)}
                  className="w-8 h-8 rounded-lg text-white/20 hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedInputs;