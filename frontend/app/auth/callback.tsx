import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import * as Linking from 'expo-linking';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleAuth = async () => {
      try {
        // Get URL from expo-linking
        const url = await Linking.getInitialURL();
        let sessionId = null;

        // Check URL hash for session_id
        if (url) {
          const hashMatch = url.match(/session_id=([^&]+)/);
          if (hashMatch) {
            sessionId = hashMatch[1];
          }
        }

        // Also check window location for web
        if (!sessionId && typeof window !== 'undefined') {
          const hash = window.location.hash;
          const hashMatch = hash.match(/session_id=([^&]+)/);
          if (hashMatch) {
            sessionId = hashMatch[1];
          }
        }

        if (sessionId) {
          await login(sessionId);
          // Clear the hash from URL on web
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          router.replace('/admin');
        } else {
          // No session_id found
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(tabs)');
      }
    };

    handleAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={GOLD} />
      <Text style={styles.text}>جاري تسجيل الدخول...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
});
