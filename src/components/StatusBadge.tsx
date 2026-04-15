import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatusBadgeProps = {
  status: 'pending' | 'in_transit' | 'delivered';
  size?: 'small' | 'large';
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'rgba(117,117,117,0.15)', color: '#9e9e9e', border: 'rgba(117,117,117,0.3)' },
  in_transit: { label: 'In Transit', bg: 'rgba(230,81,0,0.12)', color: '#ff9800', border: 'rgba(230,81,0,0.3)' },
  delivered: { label: 'Delivered', bg: 'rgba(46,125,50,0.12)', color: '#66bb6a', border: 'rgba(46,125,50,0.3)' },
};

export function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isLarge = size === 'large';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg, borderColor: config.border },
      isLarge && styles.badgeLarge,
    ]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[
        styles.label,
        { color: config.color },
        isLarge && styles.labelLarge,
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelLarge: {
    fontSize: 13,
  },
});
