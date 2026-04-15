import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, StatusBar,
  TouchableOpacity, SectionList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase, Delivery } from '../lib/supabase';
import { DeliveryCard } from '../components/DeliveryCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DeliveryStackParamList } from '../navigation/TabNavigator';

export function DeliveryListScreen() {
  const { rider } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandCompleted, setExpandCompleted] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<DeliveryStackParamList>>();

  const fetchDeliveries = useCallback(async () => {
    if (!rider) return;

    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('rider_id', rider.id)
      .order('assigned_at', { ascending: false });

    if (data) setDeliveries(data);
  }, [rider]);

  useEffect(() => {
    fetchDeliveries();

    if (!rider) return;

    // Realtime subscription
    const channel = supabase
      .channel('delivery-list')
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
  }, [rider, fetchDeliveries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  // Sort: in_transit first, pending second, delivered last
  const statusOrder = { in_transit: 0, pending: 1, delivered: 2 };
  const sorted = [...deliveries].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  );

  const activeDeliveries = sorted.filter(d => d.status !== 'delivered');
  const completedDeliveries = sorted.filter(d => d.status === 'delivered');

  const renderItem = ({ item }: { item: Delivery }) => (
    <DeliveryCard
      delivery={item}
      onPress={() => navigation.navigate('DeliveryDetail', { delivery: item })}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deliveries</Text>
        <Text style={styles.headerSubtitle}>
          {activeDeliveries.length} active · {completedDeliveries.length} completed
        </Text>
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
          <Text style={styles.emptyDesc}>
            When admin assigns deliveries to you, they'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...activeDeliveries,
            ...(expandCompleted ? completedDeliveries : []),
          ]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1a73e8"
            />
          }
          ListHeaderComponent={
            activeDeliveries.length > 0 ? (
              <Text style={styles.sectionTitle}>🟢 Active</Text>
            ) : null
          }
          ListFooterComponent={
            completedDeliveries.length > 0 ? (
              <View>
                <TouchableOpacity
                  style={styles.completedToggle}
                  onPress={() => setExpandCompleted(!expandCompleted)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.completedToggleText}>
                    {expandCompleted ? '▼' : '▶'} Completed ({completedDeliveries.length})
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  completedToggle: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  completedToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
