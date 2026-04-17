import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert,
  StatusBar, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { supabase, Delivery } from '../lib/supabase';

export function ProfileScreen() {
  const { rider, isOnline, toggleOnline, signOut, refreshUserProfile } = useAuth();
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0 });
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchTodayStats = useCallback(async () => {
    if (!rider) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: allToday } = await supabase
      .from('deliveries')
      .select('id, status')
      .eq('rider_id', rider.id)
      .gte('assigned_at', todayISO);

    if (allToday) {
      setTodayStats({
        total: allToday.length,
        completed: allToday.filter(d => d.status === 'delivered').length,
      });
    }
  }, [rider]);

  useEffect(() => {
    fetchTodayStats();
  }, [fetchTodayStats]);

  const handlePickImage = async () => {
    if (!rider) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    const asset = result.assets[0];
    const fileName = `rider-${rider.id}-${Date.now()}.jpg`;

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('rider-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('rider-photos')
        .getPublicUrl(data.path);

      await supabase
        .from('people')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', rider.id);

      await refreshUserProfile();
      Alert.alert('✅ Photo Updated', 'Your profile photo has been updated.');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload photo.');
    }
    setUploading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? You will be set to offline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await signOut();
          },
        },
      ]
    );
  };

  if (!rider) return null;

  const initials = (rider.full_name || 'R')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const completionRate = todayStats.total > 0
    ? Math.round((todayStats.completed / todayStats.total) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Profile Header */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {rider.photo_url ? (
              <Image source={{ uri: rider.photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {uploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.name}>{rider.full_name}</Text>
          <Text style={styles.email}>{rider.email}</Text>
          {rider.phone && (
            <Text style={styles.phone}>📱 {rider.phone}</Text>
          )}
        </View>

        {/* Online / Offline Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <View>
              <Text style={[styles.toggleLabel, isOnline ? styles.labelOnline : styles.labelOffline]}>
                {isOnline ? 'I am Online' : 'I am Offline'}
              </Text>
              <Text style={styles.toggleDesc}>
                {isOnline
                  ? 'Your location is being shared with admin'
                  : 'Location sharing paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#333', true: 'rgba(76, 175, 80, 0.4)' }}
            thumbColor={isOnline ? '#4caf50' : '#757575'}
            ios_backgroundColor="#333"
            style={styles.switch}
          />
        </View>

        {/* Today's Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>TODAY'S DELIVERIES</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayStats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todayStats.total}</Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#1a73e8' }]}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          {loggingOut ? (
            <ActivityIndicator color="#C62828" size="small" />
          ) : (
            <Text style={styles.logoutText}>🚪 Log Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>Jeany's Olshoppe Rider v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 120,
    alignItems: 'center',
  },
  // Profile
  profileSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(26, 115, 232, 0.3)',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderWidth: 3,
    borderColor: 'rgba(26, 115, 232, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a73e8',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    fontSize: 13,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  // Toggle
  toggleCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotOnline: {
    backgroundColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  dotOffline: {
    backgroundColor: '#757575',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelOnline: {
    color: '#66bb6a',
  },
  labelOffline: {
    color: '#9e9e9e',
  },
  toggleDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  // Stats
  statsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#1a73e8',
  },
  // Logout
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.2)',
    borderRadius: 14,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C62828',
  },
  version: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.15)',
  },
});
