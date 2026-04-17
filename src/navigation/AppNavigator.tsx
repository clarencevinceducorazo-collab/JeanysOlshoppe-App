import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { TabNavigator } from './TabNavigator';
import { UserTabNavigator } from './UserTabNavigator';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SavedScreen } from '../screens/SavedScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  UserTabs: undefined;
  ProductDetail: { id: string };
  Saved: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { session, userProfile, loading, isGuest } = useAuth();

  if (loading) return <SplashScreen />;

  const isRider = userProfile?.role === 'rider';
  const isLoggedIn = (session && userProfile) || isGuest;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          isRider ? (
            // Native Rider App
            <Stack.Screen name="MainTabs" component={TabNavigator} />
          ) : (
            // Native Omni-App for Users, Guests, and Admins
            <Stack.Screen name="UserTabs" component={UserTabNavigator} />
          )
        ) : (
          // Authenticate
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Saved" component={SavedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
