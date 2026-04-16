import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase, Chat } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../navigation/TabNavigator';
import { formatDistanceToNow } from 'date-fns';

type ChatWithDetails = Chat & {
  participant_name?: string;
  participant_role?: string;
  last_message?: string;
  last_message_at?: string;
};

export function ChatListScreen() {
  const { rider } = useAuth();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'customer'>('admin');
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();

  const fetchChats = useCallback(async () => {
    if (!rider) return;

    // Get all chats where rider is participant
    const { data: chatData } = await supabase
      .from('chats')
      .select('*')
      .or(`user_id.eq.${rider.id},rider_id.eq.${rider.id}`)
      .order('created_at', { ascending: false });

    if (!chatData) {
      setLoading(false);
      return;
    }

    // Enrich with participant names and last message
    const enrichedChats: ChatWithDetails[] = await Promise.all(
      chatData.map(async (chat) => {
        // Find the other participant
        const otherId = chat.user_id === rider.id ? chat.rider_id : chat.user_id;

        // Get participant name
        const { data: person } = await supabase
          .from('people')
          .select('full_name, role')
          .eq('id', otherId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('message, created_at')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...chat,
          participant_name: person?.full_name || 'Admin',
          participant_role: person?.role || 'user',
          last_message: lastMsg?.message,
          last_message_at: lastMsg?.created_at,
        };
      })
    );

    setChats(enrichedChats);
    setLoading(false);
  }, [rider]);

  useEffect(() => {
    fetchChats();

    if (!rider) return;

    // Subscribe to new messages to update list
    const channel = supabase
      .channel('chat-list-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rider, fetchChats]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderChat = ({ item }: { item: ChatWithDetails }) => {
    const initials = getInitials(item.participant_name || 'A');
    const timeAgo = item.last_message_at
      ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
      : '';

    const otherId = item.user_id === rider?.id ? item.rider_id : item.user_id;

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('ChatConversation', {
          chatId: item.id,
          participantName: item.participant_name || 'Admin',
          participantId: otherId,
        })}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.participant_name}
            </Text>
            {(item.participant_role === 'admin' || item.participant_role === 'super_admin') && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message}
            </Text>
          )}
        </View>

        {/* Time */}
        {timeAgo ? (
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const filteredChats = chats.filter(chat => {
    const isAdmin = chat.participant_role === 'admin' || chat.participant_role === 'super_admin';
    return activeTab === 'admin' ? isAdmin : !isAdmin;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'admin' && styles.tabActive]}
          onPress={() => setActiveTab('admin')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>Admin Support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customer' && styles.tabActive]}
          onPress={() => setActiveTab('customer')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'customer' && styles.tabTextActive]}>Customers</Text>
        </TouchableOpacity>
      </View>

      {filteredChats.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'admin' 
              ? 'Your conversations with admin will appear here.'
              : 'Your conversations with customers will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={styles.listContent}
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
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
    paddingTop: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderColor: 'rgba(26, 115, 232, 0.3)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#1a73e8',
  },
  listContent: {
    paddingBottom: 100,
  },
  // Chat row
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a73e8',
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  adminBadge: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1a73e8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  lastMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  timeAgo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
  // Empty
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
