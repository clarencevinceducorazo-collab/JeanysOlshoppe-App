import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type LocationData = {
  latitude: number;
  longitude: number;
} | null;

export function useLocation() {
  const { rider, isOnline } = useAuth();
  const [location, setLocation] = useState<LocationData>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [gpsWeak, setGpsWeak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateLocation = useCallback(async () => {
    if (!rider) return;

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(newLoc);
      setGpsWeak(false);

      // Upsert to Supabase
      await supabase.from('rider_statuses').upsert(
        {
          rider_id: rider.id,
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
          status: 'available',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'rider_id' }
      );
    } catch (error) {
      console.warn('Location update failed:', error);
      setGpsWeak(true);
    }
  }, [rider]);

  const startTracking = useCallback(async () => {
    if (!rider || !isOnline) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);

    // Get initial location
    await updateLocation();

    // Update every 5 seconds
    stopTracking();
    intervalRef.current = setInterval(updateLocation, 5000);
  }, [rider, isOnline, updateLocation, stopTracking]);

  // Start/stop based on online status
  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isOnline, startTracking, stopTracking]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState.match(/background|inactive/)) {
        // App going to background — stop tracking
        stopTracking();
      } else if (appState.current.match(/background|inactive/) && nextAppState === 'active') {
        // App coming to foreground — resume if online
        if (isOnline) {
          startTracking();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isOnline, startTracking, stopTracking]);

  return { location, permissionDenied, gpsWeak };
}
