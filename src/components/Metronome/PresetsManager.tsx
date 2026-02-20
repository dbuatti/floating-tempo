import React, { useState, useEffect } from 'react';
import { TempoBlock } from '@/hooks/use-metronome-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Save, FolderOpen, Trash2, X } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface Preset {
  id: string;
  name: string;
  sequence: TempoBlock[];
}

interface PresetsManagerProps {
  currentSequence: TempoBlock[];
  onLoad: (sequence: TempoBlock[]) => void;
}

const PresetsManager = ({ currentSequence, onLoad }: PresetsManagerProps) => {
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('metronome-presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('metronome-presets', JSON.stringify(presets));
  }, [presets]);

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPresetName,
      sequence: currentSequence
    };
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    showSuccess(`Preset "${newPresetName}" saved`);
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
      >
        <FolderOpen size={14} className="text-primary" />
        Presets
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-4 w-72 p-4 bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl z-50 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">My Presets</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="w-6 h-6 rounded-full">
              <X size={14} />
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {presets.length === 0 && (
              <p className="text-[10px] text-center py-4 text-white/20 font-bold uppercase">No presets saved</p>
            )}
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center gap-2 group">
                <Button 
                  variant="ghost" 
                  className="flex-1 justify-start text-xs font-bold truncate rounded-xl hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    onLoad(preset.sequence);
                    setIsOpen(false);
                    showSuccess(`Loaded "${preset.name}"`);
                  }}
                >
                  {preset.name}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deletePreset(preset.id)}
                  className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 text-white/20 hover:text-destructive transition-all"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2">
            <Input 
              placeholder="Preset Name..." 
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="h-9 bg-white/5 border-none rounded-xl text-xs font-bold focus-visible:ring-primary/30"
            />
            <Button 
              className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90 h-9 text-xs font-bold"
              onClick={savePreset}
              disabled={!newPresetName.trim()}
            >
              <Save size={14} />
              Save Current
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PresetsManager;