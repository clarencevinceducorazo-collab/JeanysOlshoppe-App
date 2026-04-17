import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export function UserHomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>PREMIUM JAPAN SURPLUS PHILIPPINES</Text>
        <Text style={styles.title}>Wabi-Sabi Aesthetics</Text>
        <Text style={styles.body}>
          Discover authentic Japan surplus items at Jeanys Olshoppe. Handpicked for quality, minimalism, and quiet elegance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Off-white Wabi-Sabi beige
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fb7185', // Rose/coral typical of their aesthetic
    letterSpacing: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4a403a', // Dark warm gray/brown
    marginBottom: 20,
    lineHeight: 44,
  },
  body: {
    fontSize: 16,
    color: '#716e6b',
    lineHeight: 26,
  },
});
