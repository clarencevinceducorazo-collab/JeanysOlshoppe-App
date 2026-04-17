import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export function TeamScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Our Team</Text>
        <Text style={styles.body}>Meet the people behind Jeany's Olshoppe.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  container: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#4a403a', marginBottom: 12 },
  body: { fontSize: 16, color: '#716e6b' },
});
