import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';

// Hardcoded for now. In production, this should point to your hosted Next.js domain (e.g., https://jeanys-olshoppe.vercel.app)
const WEB_APP_URL = 'http://localhost:9002'; // Next.js turbopack port

export function UserWebViewScreen() {
  const { session } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // We can inject the Supabase auth token into the webview's local storage securely
  const injectedJavaScript = `
    (function() {
      if (${session ? 'true' : 'false'}) {
        // Here you would optimally parse your supabase token into the Next.js localStorage.
        // For security, true PWA bridge tokens require encrypted handshakes.
        console.log("Session injected from Native app.");
      }
      return true;
    })();
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
        {/* On the web platform, users shouldn't be looking at a WebView of a WebApp. 
            They should just be on the WebApp itself. So we redirect them. */}
        <script dangerouslySetInnerHTML={{__html: `window.location.href = '${WEB_APP_URL}'`}}></script>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        injectedJavaScript={injectedJavaScript}
        onMessage={(event) => {
          // Handle messages from the web app (like a logout request)
          console.log('Message from WebView:', event.nativeEvent.data);
        }}
        onLoadEnd={() => setLoading(false)}
        allowsBackForwardNavigationGestures
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 44 : 0, // Safe area
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
