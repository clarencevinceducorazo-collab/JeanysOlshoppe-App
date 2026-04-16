import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

if (Platform.OS !== 'web') {
  // Configure how notifications behave when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function useNotifications(onNavigate?: (screen: string, params: any) => void) {
  const { rider } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!rider) return;

    const registerForPushNotifications = async () => {
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: undefined, // Uses the project ID from app.json
        });
        const token = tokenData.data;

        // Save token to Supabase
        await supabase
          .from('people')
          .update({ expo_push_token: token })
          .eq('id', rider.id);
      } catch (e) {
        console.error('Failed to get push token:', e);
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1a73e8',
        });
      }
    };

    registerForPushNotifications();

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification.request.content);
      }
    );

    // Notification tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (onNavigate && data?.screen) {
          onNavigate(data.screen as string, data);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [rider]);
}
