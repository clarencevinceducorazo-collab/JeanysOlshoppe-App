import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { return Promise.resolve(window.localStorage.getItem(key)); } catch (e) { return Promise.resolve(null); }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try { window.localStorage.setItem(key, value); return Promise.resolve(); } catch (e) { return Promise.resolve(); }
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { window.localStorage.removeItem(key); return Promise.resolve(); } catch (e) { return Promise.resolve(); }
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── TypeScript Types ──────────────────────────────────────────

export type RiderProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  role: string;
  is_online: boolean;
  expo_push_token: string | null;
  created_at: string;
};

export type Delivery = {
  id: string;
  rider_id: string;
  customer_name: string;
  customer_email: string | null;
  address: string;
  landmark: string | null;
  notes: string | null;
  order_summary: string | null;
  status: 'pending' | 'in_transit' | 'delivered';
  assigned_at: string;
  started_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Chat = {
  id: string;
  user_id: string;
  rider_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export type RiderStatus = {
  id: string;
  rider_id: string;
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
};
