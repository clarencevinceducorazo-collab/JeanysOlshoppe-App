import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Platform
} from 'react-native';
const isWeb = Platform.OS === 'web';
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;

if (!isWeb) {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker || (Maps.default && Maps.default.Marker);
  Callout = Maps.Callout || (Maps.default && Maps.default.Callout);
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE || (Maps.default && Maps.default.PROVIDER_GOOGLE);
}
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { supabase, Delivery } from '../lib/supabase';
import { StatusBadge } from '../components/StatusBadge';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '../navigation/TabNavigator';

const { width, height } = Dimensions.get('window');

export function MapScreen() {
  const { rider, isOnline } = useAuth();
  const { location, permissionDenied, gpsWeak } = useLocation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<MapStackParamList>>();

  // Fetch active deliveries
  useEffect(() => {
    if (!rider) return;

    const fetchDeliveries = async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('rider_id', rider.id)
        .in('status', ['pending', 'in_transit'])
        .order('assigned_at', { ascending: false });

      if (data) setDeliveries(data);
    };

    fetchDeliveries();

    // Subscribe to deliveries changes
    const channel = supabase
      .channel('map-deliveries')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deliveries',
        filter: `rider_id=eq.${rider.id}`,
      }, () => {
        fetchDeliveries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rider]);

  const centerOnMe = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  // Default to Pangasinan if no location
  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 15.8949,
        longitude: 120.2863,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Map is not supported on web.</Text>
        <Text style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>Please use the mobile app (Android/iOS) to view the map.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {/* Rider's location */}
        {location && (
          <Marker
            coordinate={location}
            title="You"
            description="Your current location"
          >
            <View style={styles.riderMarker}>
              <View style={styles.riderMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Delivery pins */}
        {deliveries.map((delivery, index) => {
          // For now, show a pin at a calculated position near the rider
          // In production, this would be geocoded from the address
          return (
            <Marker
              key={delivery.id}
              coordinate={{
                latitude: (location?.latitude || 15.8949) + (index + 1) * 0.005,
                longitude: (location?.longitude || 120.2863) + (index + 1) * 0.003,
              }}
              title={delivery.customer_name}
              description={delivery.address}
            >
              <View style={styles.deliveryMarker}>
                <Text style={styles.deliveryMarkerText}>{index + 1}</Text>
              </View>
              <Callout
                onPress={() => navigation.navigate('DeliveryDetail', { delivery })}
                style={styles.callout}
              >
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutName}>{delivery.customer_name}</Text>
                  <Text style={styles.calloutAddress} numberOfLines={1}>{delivery.address}</Text>
                  <Text style={styles.calloutAction}>Tap to view details →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Status HUD */}
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.hudText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <View style={styles.hudSpacer} />
          <Text style={styles.hudCount}>
            📦 {deliveries.length} active
          </Text>
        </View>
        {gpsWeak && (
          <Text style={styles.gpsWarn}>⚠️ GPS signal weak — showing last known location</Text>
        )}
      </View>

      {/* Permission denied banner */}
      {permissionDenied && (
        <View style={styles.permBanner}>
          <Text style={styles.permText}>
            📍 Location permission needed for delivery tracking. Please enable in Settings.
          </Text>
        </View>
      )}

      {/* Center on me FAB */}
      {location && (
        <TouchableOpacity
          style={styles.centerFab}
          onPress={centerOnMe}
          activeOpacity={0.8}
        >
          <Text style={styles.centerFabIcon}>◎</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Dark-themed map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // Rider marker
  riderMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 115, 232, 0.25)',
    borderWidth: 2,
    borderColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1a73e8',
  },
  // Delivery markers
  deliveryMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deliveryMarkerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  // Callout
  callout: {
    width: 220,
  },
  calloutContent: {
    padding: 4,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  calloutAction: {
    fontSize: 11,
    color: '#1a73e8',
    fontWeight: '600',
  },
  // HUD
  hud: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#4caf50',
  },
  statusOffline: {
    backgroundColor: '#757575',
  },
  hudText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  hudSpacer: {
    flex: 1,
  },
  hudCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  gpsWarn: {
    color: '#ffb74d',
    fontSize: 11,
    marginTop: 8,
  },
  // Permission banner
  permBanner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(198, 40, 40, 0.9)',
    borderRadius: 12,
    padding: 14,
  },
  permText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  // Center FAB
  centerFab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  centerFabIcon: {
    fontSize: 24,
    color: '#1a73e8',
  },
});
