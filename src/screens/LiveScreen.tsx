import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export function LiveScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Live Streaming</Text>
        <Text style={styles.body}>Native video broadcasts will exist here.</Text>
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
