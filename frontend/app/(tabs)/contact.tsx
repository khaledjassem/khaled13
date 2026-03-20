import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

const PLATFORM_ICONS: { [key: string]: string } = {
  linkedin: 'logo-linkedin',
  twitter: 'logo-twitter',
  github: 'logo-github',
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
  youtube: 'logo-youtube',
  email: 'mail',
  phone: 'call',
  website: 'globe',
  whatsapp: 'logo-whatsapp',
};

const PLATFORM_COLORS: { [key: string]: string } = {
  linkedin: '#0077B5',
  twitter: '#1DA1F2',
  github: '#333',
  facebook: '#4267B2',
  instagram: '#E4405F',
  youtube: '#FF0000',
  email: GOLD,
  phone: '#22c55e',
  website: GOLD,
  whatsapp: '#25D366',
};

export default function ContactScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, linksRes] = await Promise.all([
        api.get('/profile'),
        api.get('/social-links'),
      ]);
      setProfile(profileRes.data);
      setSocialLinks(linksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePress = (platform: string, url: string) => {
    let finalUrl = url;
    if (platform === 'email' && !url.startsWith('mailto:')) {
      finalUrl = `mailto:${url}`;
    } else if (platform === 'phone' && !url.startsWith('tel:')) {
      finalUrl = `tel:${url}`;
    } else if (platform === 'whatsapp' && !url.startsWith('http')) {
      finalUrl = `https://wa.me/${url.replace(/[^0-9]/g, '')}`;
    }
    Linking.openURL(finalUrl);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="mail" size={48} color={GOLD} />
          <Text style={styles.headerTitle}>تواصل معي</Text>
          <Text style={styles.headerSubtitle}>يسعدني التواصل معكم</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          {profile?.email && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handlePress('email', profile.email)}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Ionicons name="mail" size={24} color={GOLD} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>البريد الإلكتروني</Text>
                <Text style={styles.contactValue}>{profile.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {profile?.phone && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handlePress('phone', profile.phone)}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="call" size={24} color="#22c55e" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>الهاتف</Text>
                <Text style={styles.contactValue}>{profile.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {profile?.location && (
            <View style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="location" size={24} color="#3b82f6" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>الموقع</Text>
                <Text style={styles.contactValue}>{profile.location}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>تابعني على</Text>
            <View style={styles.socialGrid}>
              {socialLinks.map((link) => (
                <TouchableOpacity
                  key={link.id}
                  style={styles.socialCard}
                  onPress={() => handlePress(link.platform, link.url)}
                >
                  <View
                    style={[
                      styles.socialIcon,
                      { backgroundColor: PLATFORM_COLORS[link.platform] || GOLD },
                    ]}
                  >
                    <Ionicons
                      name={(PLATFORM_ICONS[link.platform] || 'link') as any}
                      size={28}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.socialName}>
                    {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!profile?.email && !profile?.phone && socialLinks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد معلومات تواصل بعد</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  contactInfo: {
    paddingHorizontal: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  socialSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  socialCard: {
    alignItems: 'center',
    width: 90,
    marginBottom: 20,
  },
  socialIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialName: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
