import React from 'react';
import { SoundType } from '@/hooks/use-metronome-engine';
import { Button } from '@/components/ui/button';
import { Music, Zap, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SoundSelectorProps {
  value: SoundType;
  onChange: (value: SoundType) => void;
}

const SoundSelector = ({ value, onChange }: SoundSelectorProps) => {
  const options: { id: SoundType; icon: any; label: string }[] = [
    { id: 'woodblock', icon: Music, label: 'Wood' },
    { id: 'digital', icon: Zap, label: 'Digital' },
    { id: 'cowbell', icon: Bell, label: 'Bell' },
  ];

  return (
    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              isActive ? "text-primary-foreground" : "text-white/40 hover:text-white/60"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="sound-bg"
                className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10 hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SoundSelector;