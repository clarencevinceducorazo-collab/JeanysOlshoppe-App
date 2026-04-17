import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase, Message } from '../lib/supabase';
import { ChatBubble } from '../components/ChatBubble';

// We must bypass standard typing here since we changed params dynamically
type RouteParams = {
  participantId: string;
  participantName: string;
};

export function ChatConversationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { userProfile, role } = useAuth();
  const { participantId, participantName } = route.params as RouteParams;

  const [resolvedChatId, setResolvedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // 1. Instantly Resolve or Auto-Create Chat Session Matrix
  useEffect(() => {
    const initChatSession = async () => {
      if (!userProfile) return;

      // Ensure we query safely handling both combinations natively
      const myId = userProfile.id;
      
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .or(`and(user_id.eq.${myId},rider_id.eq.${participantId}),and(user_id.eq.${participantId},rider_id.eq.${myId})`)
        .maybeSingle();

      if (existingChat) {
         setResolvedChatId(existingChat.id);
      } else {
         // Create the chat. Assigning myself as user_id and them as rider_id as a fallback
         const { data: newChat, error } = await supabase
           .from('chats')
           .insert({ user_id: myId, rider_id: participantId })
           .select('id')
           .single();
           
         if (newChat) setResolvedChatId(newChat.id);
         if (error) console.error("Could not generate session:", error.message);
      }
      setInitializing(false);
    };
    initChatSession();
  }, [userProfile, participantId]);

  // 2. Map realtime listener based on resolved chatId
  useEffect(() => {
    if (!resolvedChatId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', resolvedChatId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-messages-${resolvedChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${resolvedChatId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedChatId]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!inputText.trim() || !userProfile || sending || !resolvedChatId) return;

    const msg = inputText.trim();
    setInputText('');
    setSending(true);

    await supabase.from('messages').insert({
      chat_id: resolvedChatId,
      sender_id: userProfile.id,
      message: msg,
    });

    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item.message}
      timestamp={item.created_at}
      isMe={item.sender_id === userProfile?.id}
      isAdmin={role === 'admin' || role === 'super_admin'}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
          </View>
          <Text style={styles.headerSubtext}>Secure Channel</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {initializing ? (
           <View style={styles.initOverlay}>
               <ActivityIndicator size="large" color="#333333" />
               <Text style={styles.initText}>Securing Channel...</Text>
           </View>
        ) : (
          <>
            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyChatEmoji}>💬</Text>
                  <Text style={styles.emptyChatText}>No messages yet</Text>
                  <Text style={styles.emptyChatDesc}>Send a message to start the conversation.</Text>
                </View>
              }
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="rgba(0,0,0,0.3)"
                multiline
                maxLength={500}
                editable={!sending}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || sending}
                activeOpacity={0.7}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Wabi-Sabi styling update
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54, // Safe area depending on iOS/Android
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAE5',
    backgroundColor: '#FAF9F6',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#333333',
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333333',
  },
  headerSubtext: {
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  // Chat area
  chatArea: {
    flex: 1,
    backgroundColor: '#ffffff', // chat background distinct from header
  },
  messageList: {
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  initOverlay: {
     flex: 1,
     alignItems: 'center',
     justifyContent: 'center',
  },
  initText: {
     marginTop: 12,
     color: '#666666',
     fontWeight: '600',
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EBEAE5',
    backgroundColor: '#FAF9F6',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#EBEAE5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#333333',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2, // optical alignment
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 2,
  },
  // Empty state
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.3,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  emptyChatDesc: {
    fontSize: 13,
    color: '#aaaaaa',
    marginTop: 4,
  },
});
