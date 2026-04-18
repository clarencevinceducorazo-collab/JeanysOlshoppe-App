import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function PrivacyScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholderSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateText}>Last updated: {new Date().toLocaleDateString()}</Text>

        <Text style={styles.h2}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to Jeany's Olshoppe. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our app and tell you about your privacy rights and how the law protects you.
        </Text>

        <Text style={styles.h2}>2. The Data We Collect</Text>
        <Text style={styles.paragraph}>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Identity Data</Text> includes first name, last name, username or similar identifier, and social media profile photo.
            </Text>
          </View>
          <View style={styles.bulletItem}>
             <Text style={styles.bulletDot}>•</Text>
             <Text style={styles.bulletText}>
               <Text style={styles.bold}>Contact Data</Text> includes email address.
             </Text>
          </View>
        </View>

        <Text style={styles.h2}>3. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
             <Text style={styles.bulletDot}>•</Text>
             <Text style={styles.bulletText}>To register you as a new customer.</Text>
          </View>
          <View style={styles.bulletItem}>
             <Text style={styles.bulletDot}>•</Text>
             <Text style={styles.bulletText}>To process and deliver your order.</Text>
          </View>
          <View style={styles.bulletItem}>
             <Text style={styles.bulletDot}>•</Text>
             <Text style={styles.bulletText}>To manage our relationship with you.</Text>
          </View>
        </View>

        <Text style={styles.h2}>4. Facebook Login Data</Text>
        <Text style={styles.paragraph}>
          If you choose to register and log in using your Facebook account, we will receive your name, email address, and profile picture from Facebook as approved by you during the login process. We do not access or post to your Facebook timeline or interact with your Facebook friends.
        </Text>

        <Text style={styles.h2}>5. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@example.com.
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
  dateText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    marginBottom: 16,
  },
  bulletList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 18,
    color: '#fb7185', // Accent color for bullets
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: '#333333',
  },
  footerSpace: {
    height: 40,
  }
});
