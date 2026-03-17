"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AuthButton = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) showError(error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showError(error.message);
    else showSuccess("Logged out successfully");
  };

  if (session) {
    return (
      <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-full border border-white/5">
        <Avatar className="w-8 h-8 border border-white/10">
          <AvatarImage src={session.user.user_metadata.avatar_url} />
          <AvatarFallback><User size={14} /></AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Logged in as</p>
          <p className="text-[11px] font-bold text-white truncate max-w-[100px]">{session.user.user_metadata.full_name || session.user.email}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout}
          className="w-8 h-8 rounded-full text-white/20 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={14} />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleLogin}
      className="gap-2 rounded-full bg-white text-black hover:bg-white/90 text-[11px] font-black uppercase tracking-widest h-10 px-6"
    >
      <LogIn size={14} />
      Login with Google
    </Button>
  );
};

export default AuthButton;