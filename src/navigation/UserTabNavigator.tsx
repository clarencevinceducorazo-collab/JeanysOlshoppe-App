import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { UserHomeScreen } from '../screens/UserHomeScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { LiveScreen } from '../screens/LiveScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { MeScreen } from '../screens/MeScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { MapScreen } from '../screens/MapScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  // Simple emoji placeholder mapping for web icons (e.g. Home, ShoppingBag, Radio, User, Shield)
  const icons: Record<string, string> = {
    Home: '🏠',
    Shop: '🛍️',
    Live: '🔴',
    Team: '👥',
    Chat: '💬',
    Map: '🗺️',
    Me: '👤',
    Admin: '🛡️',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icons[label] || '•'}
      </Text>
    </View>
  );
}

export function UserTabNavigator() {
  const { userProfile } = useAuth();
  
  // Checking for admin permissions
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#fb7185', // Wabi-Sabi Rose accent
        tabBarInactiveTintColor: '#A09C96', // Warm gray
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Home" component={UserHomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Team" component={TeamScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
      
      {/* Conditionally reveal the Native Admin Panel */}
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminDashboardScreen} />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAF9F6', // Off-white Wabi-Sabi matching BottomNav
    borderTopColor: '#EBEAE5',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    // Add subtle shadow just like web aesthetic
    elevation: 8,
    shadowColor: '#4a403a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
});
