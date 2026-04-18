import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function TermsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholderSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>Terms of Service</Text>
        
        <Text style={styles.paragraph}>
          By using Jeany's Ol Shoppe, you agree to use the platform lawfully and respectfully.
        </Text>
        
        <Text style={styles.paragraph}>
          We reserve the right to suspend accounts that violate these terms.
          This service is provided "as is", and we are not responsible for any issues 
          that arise from account misuse or misrepresentation.
        </Text>
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  placeholderSpace: {
    width: 40,
  },
  scrollContent: {
    padding: 24,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    marginBottom: 16,
  },
  footerSpace: {
    height: 40,
  }
});
