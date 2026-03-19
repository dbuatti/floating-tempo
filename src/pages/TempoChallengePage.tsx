"use client";

import React from 'react';
import TempoChallenge from '@/components/metronome/TempoChallenge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trophy, Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TempoChallengePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08080a] text-foreground selection:bg-primary/30 analog-noise">
      <div className="max-w-7xl mx-auto px-8 py-16 space-y-16 relative z-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/40"
            >
              <ChevronLeft size={24} />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black tracking-tighter text-white leading-none">Tempo Challenge</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <Trophy size={12} className="text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Training Mode</span>
                </div>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/20">Internalize the beat • Master your timing</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Music2 className="text-primary" size={24} />
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TempoChallenge />
        </motion.div>
      </div>
    </div>
  );
};

export default TempoChallengePage;