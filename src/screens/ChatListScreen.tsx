import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase, Chat } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';

type ChatWithDetails = Chat & {
  participant_name?: string;
  participant_role?: string;
  last_message?: string;
  last_message_at?: string;
};

export function ChatListScreen() {
  const { userProfile, role, isGuest, logout } = useAuth();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  // Determine available tabs based on the active user's role
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isRider = role === 'rider';
  const isCustomer = !isAdmin && !isRider; // Standard User

  const availableTabs = [];
  if (isCustomer) availableTabs.push({ key: 'admin', label: 'Admins' }, { key: 'rider', label: 'Riders' });
  if (isRider) availableTabs.push({ key: 'customer', label: 'Customers' }, { key: 'admin', label: 'Admins' });
  if (isAdmin) availableTabs.push({ key: 'customer', label: 'Customers' }, { key: 'rider', label: 'Riders' });

  const [activeTabKey, setActiveTabKey] = useState<string>(availableTabs[0]?.key || 'admin');

  const fetchChats = useCallback(async () => {
    if (isGuest || !userProfile) {
      setLoading(false);
      return;
    }

    // Get all chats where the user is participant (can be user_id or rider_id)
    const { data: chatData } = await supabase
      .from('chats')
      .select('*')
      .or(`user_id.eq.${userProfile.id},rider_id.eq.${userProfile.id}`)
      .order('created_at', { ascending: false });

    if (!chatData) {
      setLoading(false);
      return;
    }

    // Enrich with participant names and last message
    const enrichedChats: ChatWithDetails[] = await Promise.all(
      chatData.map(async (chat) => {
        // Evaluate the other ID based on who is logged in
        const otherId = chat.user_id === userProfile.id ? chat.rider_id : chat.user_id;

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
          participant_name: person?.full_name || 'System User',
          participant_role: person?.role || 'user',
          last_message: lastMsg?.message,
          last_message_at: lastMsg?.created_at,
        };
      })
    );

    setChats(enrichedChats);
    setLoading(false);
  }, [userProfile, isGuest]);

  useEffect(() => {
    fetchChats();

    if (!userProfile) return;

    // Subscribe to new messages
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
  }, [userProfile, fetchChats]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderChat = ({ item }: { item: ChatWithDetails }) => {
    const initials = getInitials(item.participant_name || 'A');
    const timeAgo = item.last_message_at
      ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
      : '';

    const otherId = item.user_id === userProfile?.id ? item.rider_id : item.user_id;
    const isOtherAdmin = item.participant_role === 'admin' || item.participant_role === 'super_admin';

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('ChatConversation', {
          chatId: item.id,
          participantName: item.participant_name || 'User',
          participantId: otherId,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.participant_name}
            </Text>
            {isOtherAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {item.participant_role === 'rider' && !isOtherAdmin && (
              <View style={styles.riderBadge}>
                 <Text style={styles.riderBadgeText}>Rider</Text>
              </View>
            )}
          </View>
          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message}
            </Text>
          )}
        </View>

        {timeAgo ? <Text style={styles.timeAgo}>{timeAgo}</Text> : null}
      </TouchableOpacity>
    );
  };

  if (isGuest) {
     return (
       <SafeAreaView style={styles.containerGuest}>
         <View style={styles.emptyState}>
           <Text style={styles.emptyEmoji}>💬</Text>
           <Text style={styles.emptyTitle}>Log in to Chat</Text>
           <Text style={styles.emptyDesc}>
             Please register or log in to message our Admins or Delivery Riders regarding your concerns.
           </Text>
           <TouchableOpacity style={styles.loginButton} onPress={() => logout()}>
              <Text style={styles.loginButtonText}>Go to Login</Text>
           </TouchableOpacity>
         </View>
       </SafeAreaView>
     )
  }

  const filteredChats = chats.filter(chat => {
    const isOtherAdmin = chat.participant_role === 'admin' || chat.participant_role === 'super_admin';
    const isOtherRider = chat.participant_role === 'rider';
    
    if (activeTabKey === 'admin') return isOtherAdmin;
    if (activeTabKey === 'rider') return isOtherRider;
    if (activeTabKey === 'customer') return !isOtherAdmin && !isOtherRider;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Dynamic Tabs */}
      <View style={styles.tabContainer}>
        {availableTabs.map((tab) => (
           <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTabKey === tab.key && styles.tabActive]}
              onPress={() => setActiveTabKey(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTabKey === tab.key && styles.tabTextActive]}>
                 {tab.label}
              </Text>
            </TouchableOpacity>
        ))}
      </View>

      {filteredChats.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyDesc}>
            Your conversations will appear tracking here safely in realtime.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Adapting to Wabi-Sabi light theme from Omni-App
  },
  containerGuest: {
     flex: 1,
     backgroundColor: '#FAF9F6',
     alignItems: 'center',
     justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333333',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 4,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 12,
    paddingTop: 16,
    paddingBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBEAE5',
  },
  tabActive: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  tabText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
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
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fb7185',
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
    fontWeight: '700',
    color: '#333333',
  },
  adminBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  riderBadge: {
     backgroundColor: 'rgba(249, 115, 22, 0.1)',
     paddingHorizontal: 8,
     paddingVertical: 2,
     borderRadius: 8,
  },
  riderBadgeText: {
     fontSize: 9,
     fontWeight: '800',
     color: '#f97316',
     textTransform: 'uppercase',
     letterSpacing: 0.8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888888',
  },
  timeAgo: {
    fontSize: 11,
    color: '#aaaaaa',
  },
  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
     backgroundColor: '#333333',
     paddingHorizontal: 24,
     paddingVertical: 12,
     borderRadius: 8,
  },
  loginButtonText: {
     color: '#ffffff',
     fontWeight: '700',
  }
});
