import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, RiderProfile } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  rider: RiderProfile | null;
  loading: boolean;
  isOnline: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  refreshRider: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  rider: null,
  loading: true,
  isOnline: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  toggleOnline: async () => {},
  refreshRider: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch rider profile from people table
  const fetchRiderProfile = async (userId: string): Promise<RiderProfile | null> => {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', userId)
      .eq('role', 'rider')
      .single();

    if (error || !data) return null;
    return data as RiderProfile;
  };

  // Initialize session
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);

        if (existingSession?.user) {
          const profile = await fetchRiderProfile(existingSession.user.id);
          setRider(profile);
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
          const profile = await fetchRiderProfile(newSession.user.id);
          setRider(profile);
          setIsOnline(profile?.is_online ?? false);
        } else {
          setRider(null);
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

      const profile = await fetchRiderProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        return { error: 'Account not set up as a rider. Contact your admin.' };
      }

      setRider(profile);

      // Set online on login
      await supabase.from('people').update({ is_online: true }).eq('id', data.user.id);
      setIsOnline(true);

      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred.' };
    }
  };

  const signOut = async () => {
    if (rider) {
      // Set offline before signing out
      await supabase.from('people').update({ is_online: false }).eq('id', rider.id);
      await supabase.from('rider_statuses').upsert({
        rider_id: rider.id,
        status: 'offline',
        latitude: 0,
        longitude: 0,
      }, { onConflict: 'rider_id' });
    }
    setIsOnline(false);
    setRider(null);
    await supabase.auth.signOut();
  };

  const toggleOnline = async () => {
    if (!rider) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    await supabase.from('people').update({ is_online: newStatus }).eq('id', rider.id);

    if (!newStatus) {
      await supabase.from('rider_statuses').upsert({
        rider_id: rider.id,
        status: 'offline',
        latitude: 0,
        longitude: 0,
      }, { onConflict: 'rider_id' });
    }
  };

  const refreshRider = async () => {
    if (!session?.user) return;
    const profile = await fetchRiderProfile(session.user.id);
    if (profile) {
      setRider(profile);
      setIsOnline(profile.is_online);
    }
  };

  return (
    <AuthContext.Provider value={{ session, rider, loading, isOnline, signIn, signOut, toggleOnline, refreshRider }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
