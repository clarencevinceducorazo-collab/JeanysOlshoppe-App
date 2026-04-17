import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  userProfile: UserProfile | null;
  rider: UserProfile | null;
  loading: boolean;
  isOnline: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  userProfile: null,
  rider: null,
  loading: true,
  isOnline: false,
  isGuest: false,
  signIn: async () => ({ error: null }),
  continueAsGuest: () => {},
  signOut: async () => {},
  toggleOnline: async () => {},
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // Fetch user profile from people table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  };

  // Initialize session
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);

        if (existingSession?.user) {
          const profile = await fetchUserProfile(existingSession.user.id);
          setUserProfile(profile);
          setIsOnline(profile?.is_online ?? false);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const profile = await fetchUserProfile(newSession.user.id);
          setUserProfile(profile);
          setIsOnline(profile?.is_online ?? false);
        } else {
          setUserProfile(null);
          setIsOnline(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        return { error: 'Account not found in the people table.' };
      }

      setUserProfile(profile);

      // Set online on login (Optional, usually for riders, but we'll leave it for generic roles too if they have it)
      await supabase.from('people').update({ is_online: true }).eq('id', data.user.id);
      setIsOnline(true);

      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred.' };
    }
  };

  const signOut = async () => {
    if (userProfile) {
      // Set offline before signing out
      await supabase.from('people').update({ is_online: false }).eq('id', userProfile.id);
      if (userProfile.role === 'rider') {
        await supabase.from('rider_statuses').upsert({
          rider_id: userProfile.id,
          status: 'offline',
          latitude: 0,
          longitude: 0,
        }, { onConflict: 'rider_id' });
      }
    }
    setIsOnline(false);
    setUserProfile(null);
    setIsGuest(false);
    await supabase.auth.signOut();
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const toggleOnline = async () => {
    if (!userProfile) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    await supabase.from('people').update({ is_online: newStatus }).eq('id', userProfile.id);

    if (!newStatus && userProfile.role === 'rider') {
      await supabase.from('rider_statuses').upsert({
        rider_id: userProfile.id,
        status: 'offline',
        latitude: 0,
        longitude: 0,
      }, { onConflict: 'rider_id' });
    }
  };

  const refreshUserProfile = async () => {
    if (!session?.user) return;
    const profile = await fetchUserProfile(session.user.id);
    if (profile) {
      setUserProfile(profile);
      setIsOnline(profile.is_online);
    }
  };

  return (
    <AuthContext.Provider value={{ session, userProfile, rider: userProfile, loading, isOnline, isGuest, signIn, continueAsGuest, signOut, toggleOnline, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
