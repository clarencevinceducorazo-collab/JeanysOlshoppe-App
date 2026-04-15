import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  StatusBar, Linking, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { supabase, Delivery } from '../lib/supabase';
import { StatusBadge } from '../components/StatusBadge';
import type { DeliveryStackParamList } from '../navigation/TabNavigator';

export function DeliveryDetailScreen() {
  const route = useRoute<RouteProp<DeliveryStackParamList, 'DeliveryDetail'>>();
  const navigation = useNavigation();
  const [delivery, setDelivery] = useState<Delivery>(route.params.delivery);
  const [updating, setUpdating] = useState(false);

  const openNavigation = () => {
    const address = delivery.address;
    const url = Platform.select({
      ios: `maps://app?daddr=${encodeURIComponent(address)}`,
      android: `google.navigation:q=${encodeURIComponent(address)}`,
    });
    if (url) Linking.openURL(url).catch(() => {
      // Fallback to web maps
      Linking.openURL(`https://maps.google.com/?daddr=${encodeURIComponent(address)}`);
    });
  };

  const startDelivery = async () => {
    setUpdating(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('deliveries')
      .update({
        status: 'in_transit',
        started_at: now,
      })
      .eq('id', delivery.id);

    if (!error) {
      setDelivery({ ...delivery, status: 'in_transit', started_at: now });
      Alert.alert('🚚 Delivery Started!', 'Navigate to the address to deliver the package.');
    } else {
      Alert.alert('Error', 'Failed to start delivery. Try again.');
    }
    setUpdating(false);
  };

  const markDelivered = () => {
    Alert.alert(
      '✅ Confirm Delivery',
      'Are you sure this delivery is complete? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Delivered',
          style: 'default',
          onPress: async () => {
            setUpdating(true);
            const now = new Date().toISOString();
            const { error } = await supabase
              .from('deliveries')
              .update({
                status: 'delivered',
                delivered_at: now,
              })
              .eq('id', delivery.id);

            if (!error) {
              setDelivery({ ...delivery, status: 'delivered', delivered_at: now });
              Alert.alert('🎉 Delivery Complete!', 'Great job! This delivery has been marked as completed.');
            } else {
              Alert.alert('Error', 'Failed to update status. Try again.');
            }
            setUpdating(false);
          },
        },
      ]
    );
  };

  const shortId = delivery.id.substring(0, 8).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{shortId}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <View style={styles.statusSection}>
          <StatusBadge status={delivery.status} size="large" />
          {delivery.started_at && (
            <Text style={styles.timestamp}>
              Started: {new Date(delivery.started_at).toLocaleString()}
            </Text>
          )}
          {delivery.delivered_at && (
            <Text style={styles.timestamp}>
              Delivered: {new Date(delivery.delivered_at).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.customerName}>{delivery.customer_name}</Text>
          {delivery.customer_email && (
            <Text style={styles.infoText}>✉️ {delivery.customer_email}</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>📍 {delivery.address}</Text>
          {delivery.landmark && (
            <Text style={styles.landmarkText}>🏷️ Landmark: {delivery.landmark}</Text>
          )}
          {delivery.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>NOTES</Text>
              <Text style={styles.notesText}>{delivery.notes}</Text>
            </View>
          )}
        </View>

        {/* Order Summary */}
        {delivery.order_summary && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Order Contents</Text>
            <Text style={styles.orderSummary}>{delivery.order_summary}</Text>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={openNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonEmoji}>🧭</Text>
            <Text style={styles.navButtonText}>Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonDisabled]}
            disabled={true}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonEmoji}>💬</Text>
            <Text style={styles.navButtonTextDisabled}>Chat (v2)</Text>
          </TouchableOpacity>
        </View>

        {/* Status Action */}
        <View style={styles.statusActionCard}>
          {delivery.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionStart]}
              onPress={startDelivery}
              disabled={updating}
              activeOpacity={0.8}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.actionEmoji}>🚚</Text>
                  <Text style={styles.actionButtonText}>Start Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {delivery.status === 'in_transit' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionDeliver]}
              onPress={markDelivered}
              disabled={updating}
              activeOpacity={0.8}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.actionEmoji}>✅</Text>
                  <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {delivery.status === 'delivered' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedEmoji}>🎉</Text>
              <Text style={styles.completedText}>Delivery Complete</Text>
              {delivery.delivered_at && (
                <Text style={styles.completedTime}>
                  {new Date(delivery.delivered_at).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  // Status section
  statusSection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  // Info cards
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  addressText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  landmarkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  notesBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 19,
  },
  orderSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
  },
  // Actions row
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(26, 115, 232, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.25)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    opacity: 0.5,
  },
  navButtonEmoji: {
    fontSize: 24,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a73e8',
  },
  navButtonTextDisabled: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  // Status action
  statusActionCard: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 20,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionStart: {
    backgroundColor: '#E65100',
    shadowColor: '#E65100',
  },
  actionDeliver: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  completedBanner: {
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.25)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  completedEmoji: {
    fontSize: 36,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#66bb6a',
  },
  completedTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});
