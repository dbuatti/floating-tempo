"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Fingerprint, 
  RotateCcw, 
  Play, 
  Pause, 
  History,
  TrendingUp,
  Zap,
  EyeOff,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const TempoChallenge = () => {
  const [targetBpm, setTargetBpm] = useState<number>(120);
  const [isTesting, setIsTesting] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastBpm, setLastBpm] = useState<number | null>(null);
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchHistory();
    });
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('metronome_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!error && data) setHistory(data);
  };

  const handleTap = useCallback(() => {
    if (!isTesting) return;

    const now = Date.now();
    const diff = now - lastTapRef.current;
    
    // Reset if too long between taps (2 seconds)
    let newTaps = diff > 2000 ? [now] : [...taps, now];
    if (newTaps.length > 16) newTaps.shift();
    
    setTaps(newTaps);
    lastTapRef.current = now;

    if (newTaps.length >= 4) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i-1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const currentBpm = 60000 / avgInterval;
      setLastBpm(Math.round(currentBpm));

      // Calculate accuracy
      const diffBpm = Math.abs(targetBpm - currentBpm);
      const acc = Math.max(0, 100 - (diffBpm / targetBpm) * 100);
      setAccuracy(acc);
    }
  }, [taps, isTesting, targetBpm]);

  const startChallenge = () => {
    setIsTesting(true);
    setTaps([]);
    setAccuracy(null);
    setLastBpm(null);
    lastTapRef.current = 0;
  };

  const stopChallenge = async () => {
    setIsTesting(false);
    if (accuracy !== null && lastBpm !== null && taps.length >= 8) {
      if (user) {
        setLoading(true);
        const { error } = await supabase.from('metronome_scores').insert({
          user_id: user.id,
          target_bpm: targetBpm,
          actual_bpm: lastBpm,
          accuracy_percent: accuracy,
          taps_count: taps.length
        });
        if (!error) {
          showSuccess(`Challenge saved! ${Math.round(accuracy)}% Accuracy`);
          fetchHistory();
        }
        setLoading(false);
      } else {
        showSuccess(`Great job! ${Math.round(accuracy)}% Accuracy (Login to save)`);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isTesting) {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap, isTesting]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Challenge Area */}
      <Card className="lg:col-span-8 p-10 bg-white/[0.02] border-white/5 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={cn(
              "w-12 h-12 rounded-2xl transition-all",
              isBlindMode ? "bg-primary/20 text-primary" : "text-white/20 hover:text-white"
            )}
          >
            {isBlindMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </Button>
        </div>

        <div className="flex flex-col items-center text-center space-y-12">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Target className="text-primary" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Target Tempo</span>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={targetBpm}
                onChange={(e) => setTargetBpm(parseInt(e.target.value) || 0)}
                className="w-40 h-20 text-5xl font-black text-center bg-white/5 border-none rounded-[2rem] focus-visible:ring-primary/30"
              />
              <span className="text-2xl font-black text-white/10 uppercase">BPM</span>
            </div>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isTesting ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                >
                  <Button
                    onClick={startChallenge}
                    className="w-48 h-48 rounded-full bg-primary hover:bg-primary/90 shadow-[0_30px_80px_-15px_rgba(168,85,247,0.5)] border-none group"
                  >
                    <Play size={60} fill="currentColor" className="ml-4 group-hover:scale-110 transition-transform" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="text-[8rem] font-black font-mono leading-none text-white">
                    {isBlindMode ? "?" : (lastBpm || "—")}
                  </div>
                  <Button
                    variant="outline"
                    onClick={stopChallenge}
                    className="rounded-2xl border-white/10 bg-white/5 hover:bg-destructive/10 hover:text-destructive h-12 px-8 gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    <Pause size={16} />
                    Finish
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap Ring */}
            {isTesting && (
              <motion.div 
                className="absolute inset-0 border-4 border-primary/20 rounded-full pointer-events-none"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          <div className="w-full max-w-md space-y-6">
            <div className="flex justify-between items-end px-2">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Accuracy</p>
                <p className="text-2xl font-black text-white">{accuracy !== null ? `${Math.round(accuracy)}%` : "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Taps</p>
                <p className="text-2xl font-black text-white">{taps.length}</p>
              </div>
            </div>
            <Progress 
              value={accuracy || 0} 
              className="h-3 bg-white/5 rounded-full overflow-hidden"
              style={{ '--progress-background': 'hsl(var(--primary))' } as any}
            />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10">
              {isTesting ? "Tap Spacebar or the button below" : "Ready to test your internal clock?"}
            </p>
          </div>

          <Button
            size="lg"
            disabled={!isTesting}
            onMouseDown={handleTap}
            className={cn(
              "w-full h-24 rounded-[2.5rem] text-xl font-black uppercase tracking-[0.2em] transition-all active:scale-95",
              isTesting ? "bg-white text-black hover:bg-white/90" : "bg-white/5 text-white/10"
            )}
          >
            <Fingerprint size={32} className="mr-4" />
            TAP TEMPO
          </Button>
        </div>
      </Card>

      {/* Sidebar Stats */}
      <div className="lg:col-span-4 space-y-8">
        <Card className="p-8 bg-white/[0.02] border-white/5 rounded-[2.5rem] space-y-8">
          <div className="flex items-center gap-3">
            <History className="text-primary" size={18} />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40">Recent Scores</h3>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <Trophy size={32} className="mx-auto text-white/5" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/10">No scores yet</p>
              </div>
            ) : (
              history.map((score) => (
                <div key={score.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{score.target_bpm}</span>
                      <span className="text-[8px] font-black text-white/20 uppercase">Target</span>
                    </div>
                    <p className="text-[9px] font-bold text-white/40 mt-1">
                      {new Date(score.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-primary">{Math.round(score.accuracy_percent)}%</div>
                    <div className="text-[8px] font-black text-white/20 uppercase">Accuracy</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-8 bg-primary/5 border-primary/10 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="text-primary" size={18} />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/60">Training Tip</h3>
          </div>
          <p className="text-xs font-bold text-white/60 leading-relaxed">
            Use <span className="text-primary">Blind Mode</span> to hide the BPM display. This forces your brain to rely on muscle memory rather than visual feedback.
          </p>
          <div className="pt-4 border-t border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Best Accuracy</span>
              <span className="text-sm font-black text-white">
                {history.length > 0 ? `${Math.round(Math.max(...history.map(h => h.accuracy_percent)))}%` : "—"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TempoChallenge;