import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { TabNavigator } from './TabNavigator';
import { UserWebViewScreen } from '../screens/UserWebViewScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  WebPortal: undefined;
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
            // Hybrid Omni-App (Next.js WebView) for Users and Admins
            <Stack.Screen name="WebPortal" component={UserWebViewScreen} />
          )
        ) : (
          // Authenticate
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
