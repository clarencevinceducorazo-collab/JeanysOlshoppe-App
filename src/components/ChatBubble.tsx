import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ChatBubbleProps = {
  message: string;
  timestamp: string;
  isMe: boolean;
};

export function ChatBubble({ message, timestamp, isMe }: ChatBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isMe ? styles.containerRight : styles.containerLeft]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
          {message}
        </Text>
        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  containerRight: {
    alignItems: 'flex-end',
  },
  containerLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#1a73e8',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  textMe: {
    color: '#ffffff',
  },
  textOther: {
    color: 'rgba(255,255,255,0.85)',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255,255,255,0.5)',
  },
  timeOther: {
    color: 'rgba(255,255,255,0.3)',
  },
});
