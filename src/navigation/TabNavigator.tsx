import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { MapScreen } from '../screens/MapScreen';
import { DeliveryListScreen } from '../screens/DeliveryListScreen';
import { DeliveryDetailScreen } from '../screens/DeliveryDetailScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatConversationScreen } from '../screens/ChatConversationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { Delivery, Chat } from '../lib/supabase';

// ─── Param Lists ─────────────────────────────────────────────

export type DeliveryStackParamList = {
  DeliveryList: undefined;
  DeliveryDetail: { delivery: Delivery };
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatConversation: {
    chatId: string;
    participantName: string;
    participantId: string;
  };
};

export type MapStackParamList = {
  MapHome: undefined;
  DeliveryDetail: { delivery: Delivery };
};

// ─── Tab Icons ───────────────────────────────────────────────

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Map: '🗺️',
    Deliveries: '📦',
    Chat: '💬',
    Profile: '👤',
  };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icons[label] || '•'}
      </Text>
    </View>
  );
}

// ─── Stack Navigators ────────────────────────────────────────

const MapStack = createNativeStackNavigator<MapStackParamList>();
function MapStackNavigator() {
  return (
    <MapStack.Navigator screenOptions={{ headerShown: false }}>
      <MapStack.Screen name="MapHome" component={MapScreen} />
      <MapStack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    </MapStack.Navigator>
  );
}

const DeliveryStack = createNativeStackNavigator<DeliveryStackParamList>();
function DeliveryStackNavigator() {
  return (
    <DeliveryStack.Navigator screenOptions={{ headerShown: false }}>
      <DeliveryStack.Screen name="DeliveryList" component={DeliveryListScreen} />
      <DeliveryStack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    </DeliveryStack.Navigator>
  );
}

const ChatStack = createNativeStackNavigator<ChatStackParamList>();
function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="ChatConversation" component={ChatConversationScreen} />
    </ChatStack.Navigator>
  );
}

// ─── Tab Navigator ───────────────────────────────────────────

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Map" component={MapStackNavigator} />
      <Tab.Screen name="Deliveries" component={DeliveryStackNavigator} />
      <Tab.Screen name="Chat" component={ChatStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111111',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
