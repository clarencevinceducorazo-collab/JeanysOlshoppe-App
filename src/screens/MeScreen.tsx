import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function MeScreen() {
  const { userProfile, signOut, isGuest, continueAsGuest } = useAuth();
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Profile</Text>
        {isGuest ? (
          <Text style={styles.body}>Log in to access your orders and saved items.</Text>
        ) : (
          <Text style={styles.body}>Signed in as: {userProfile?.email || 'User'}</Text>
        )}
        
        <TouchableOpacity style={styles.button} onPress={() => signOut()}>
          <Text style={styles.buttonText}>{isGuest ? 'Log In / Sign Up' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  container: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#4a403a', marginBottom: 12 },
  body: { fontSize: 16, color: '#716e6b', marginBottom: 30 },
  button: {
    backgroundColor: '#4a403a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FAF9F6', fontWeight: '600', fontSize: 15 },
});
