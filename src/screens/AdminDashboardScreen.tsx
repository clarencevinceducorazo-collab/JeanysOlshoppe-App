import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export function AdminDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.body}>Manage orders, products, and users natively.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1f2937' }, // Darker back for Admin
  container: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  body: { fontSize: 16, color: '#9ca3af' },
});
