import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, TextInput, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';

type PersonContact = {
  id: string; // The person's ID string
  full_name: string;
  role: string | null;
  last_message?: string;
  last_message_at?: string;
};

export function ChatListScreen() {
  const { userProfile, role, isGuest, logout } = useAuth();
  const [contacts, setContacts] = useState<PersonContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchContactsDirectory = useCallback(async () => {
    if (isGuest || !userProfile) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Filter roles based on active tab
    let allowedRoles: string[] = [];
    if (activeTabKey === 'admin') allowedRoles = ['admin', 'super_admin'];
    if (activeTabKey === 'rider') allowedRoles = ['rider'];
    if (activeTabKey === 'customer') allowedRoles = ['user', null]; // users might have null role string

    // 1. Fetch people directly acting as a global directory
    let query = supabase.from('people').select('id, full_name, role').neq('id', userProfile.id);
    
    if (activeTabKey === 'customer') {
      query = query.or('role.eq.user,role.is.null');
    } else {
      query = query.in('role', allowedRoles);
    }

    const { data: peopleData, error: peopleErr } = await query;

    if (!peopleData || peopleErr) {
      setLoading(false);
      return;
    }

    // 2. Fetch all of OUR chat mappings to detect which contacts we have history with
    const { data: myChats } = await supabase
      .from('chats')
      .select('id, user_id, rider_id')
      .or(`user_id.eq.${userProfile.id},rider_id.eq.${userProfile.id}`);

    // Map participantId -> Chat Object
    const chatMapping: Record<string, string> = {};
    if (myChats) {
      myChats.forEach(c => {
         const otherId = c.user_id === userProfile.id ? c.rider_id : c.user_id;
         chatMapping[otherId] = c.id;
      });
    }

    // 3. For contacts we have history with, fetch their last message
    // (In an enterprise app, we would use a SQL View, but this works exceptionally well for React Native MVPs)
    const enrichedContacts: PersonContact[] = await Promise.all(
      peopleData.map(async (person) => {
        const chatId = chatMapping[person.id];
        let lastMsg = null;

        if (chatId) {
          const { data: msgData } = await supabase
            .from('messages')
            .select('message, created_at')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          lastMsg = msgData;
        }

        return {
          id: person.id,
          full_name: person.full_name || 'System User',
          role: person.role || 'user',
          last_message: lastMsg?.message,
          last_message_at: lastMsg?.created_at,
        };
      })
    );

    // Sort so those WITH a last message appear at top
    enrichedContacts.sort((a, b) => {
       if (a.last_message_at && !b.last_message_at) return -1;
       if (!a.last_message_at && b.last_message_at) return 1;
       if (a.last_message_at && b.last_message_at) {
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
       }
       return a.full_name.localeCompare(b.full_name);
    });

    setContacts(enrichedContacts);
    setLoading(false);
  }, [userProfile, isGuest, activeTabKey]);

  // Re-fetch when entering the screen just to ensure last messages are updated
  useFocusEffect(
    useCallback(() => {
      fetchContactsDirectory();
    }, [fetchContactsDirectory])
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderContact = ({ item }: { item: PersonContact }) => {
    const initials = getInitials(item.full_name || 'A');
    const timeAgo = item.last_message_at
      ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
      : '';

    const isOtherAdmin = item.role === 'admin' || item.role === 'super_admin';

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('ChatConversation', {
          participantId: item.id,
          participantName: item.full_name || 'User',
        })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{item.full_name}</Text>
            {isOtherAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {item.role === 'rider' && !isOtherAdmin && (
              <View style={styles.riderBadge}>
                 <Text style={styles.riderBadgeText}>Rider</Text>
              </View>
            )}
          </View>
          
          {item.last_message ? (
            <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>
          ) : (
            <Text style={styles.noHistoryMessage} numberOfLines={1}>Tap to start a conversation</Text>
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

  // Local Search Filter
  const filteredContacts = contacts.filter(contact => 
    contact.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Directory</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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

      {loading ? (
         <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#fb7185" />
         </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyDesc}>
            We couldn't find anyone matching your search inside the directory.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
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
    backgroundColor: '#FAF9F6', 
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333333',
    letterSpacing: -0.5,
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    height: '100%',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 12,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
  noHistoryMessage: {
    fontSize: 13,
    color: '#fb7185', // Accent color
    fontWeight: '500',
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
    paddingTop: 80,
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
