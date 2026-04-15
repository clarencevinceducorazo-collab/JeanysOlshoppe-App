import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { Delivery } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

type DeliveryCardProps = {
  delivery: Delivery;
  onPress: () => void;
};

export function DeliveryCard({ delivery, onPress }: DeliveryCardProps) {
  const shortId = delivery.id.substring(0, 8).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(delivery.assigned_at), { addSuffix: true });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>ORDER</Text>
          <Text style={styles.orderId}>#{shortId}</Text>
        </View>
        <StatusBadge status={delivery.status} />
      </View>

      <View style={styles.body}>
        <Text style={styles.customerName} numberOfLines={1}>
          {delivery.customer_name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          📍 {delivery.address}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  body: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  timeAgo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
  viewDetails: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a73e8',
  },
});
