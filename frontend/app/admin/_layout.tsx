import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      let redirectUrl: string;
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // For web, use window.location.origin
        redirectUrl = window.location.origin + '/auth/callback';
      } else {
        // For native apps, use expo-linking
        redirectUrl = Linking.createURL('auth/callback');
      }
      
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          // Handle the callback URL
          const sessionIdMatch = result.url.match(/session_id=([^&]+)/);
          if (sessionIdMatch) {
            router.push(`/auth/callback?session_id=${sessionIdMatch[1]}`);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color={GOLD} />
          </View>
          <Text style={styles.title}>لوحة التحكم</Text>
          <Text style={styles.subtitle}>يرجى تسجيل الدخول للوصول إلى لوحة التحكم</Text>
          
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleLogin}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#000" />
                <Text style={styles.googleButtonText}>تسجيل الدخول بـ Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#888" />
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DARK_BG },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="education" />
      <Stack.Screen name="skills" />
      <Stack.Screen name="research" />
      <Stack.Screen name="books" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="awards" />
      <Stack.Screen name="certificates" />
      <Stack.Screen name="social" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#888',
    fontSize: 14,
    marginLeft: 6,
  },
});
