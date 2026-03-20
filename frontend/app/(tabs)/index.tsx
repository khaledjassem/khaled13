import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, skillsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/skills'),
      ]);
      setProfile(profileRes.data);
      setSkills(skillsRes.data);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  const technicalSkills = skills.filter(s => s.category === 'technical');
  const adminSkills = skills.filter(s => s.category === 'administrative');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {/* Header with Admin Button */}
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <Text style={styles.headerTitle}>السيرة الذاتية</Text>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
          >
            <Ionicons name="settings" size={24} color={GOLD} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.photoContainer}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color="#666" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile?.full_name || 'خالد جاسم'}</Text>
          <Text style={styles.title}>{profile?.title || 'DBA + Strategist + AI Specialist'}</Text>
          
          {profile?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={GOLD} />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}
        </View>

        {/* Summary Section */}
        {profile?.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={24} color={GOLD} />
              <Text style={styles.sectionTitle}>نبذة احترافية</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{profile.summary}</Text>
            </View>
          </View>
        )}

        {/* Vision & Mission */}
        {(profile?.vision || profile?.mission) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye" size={24} color={GOLD} />
              <Text style={styles.sectionTitle}>الرؤية والرسالة</Text>
            </View>
            {profile?.vision && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>الرؤية</Text>
                <Text style={styles.cardText}>{profile.vision}</Text>
              </View>
            )}
            {profile?.mission && (
              <View style={[styles.card, { marginTop: 12 }]}>
                <Text style={styles.cardLabel}>الرسالة</Text>
                <Text style={styles.cardText}>{profile.mission}</Text>
              </View>
            )}
          </View>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={24} color={GOLD} />
              <Text style={styles.sectionTitle}>المهارات</Text>
            </View>

            {technicalSkills.length > 0 && (
              <View style={styles.skillCategory}>
                <Text style={styles.skillCategoryTitle}>المهارات التقنية</Text>
                {technicalSkills.map((skill) => (
                  <View key={skill.id} style={styles.skillItem}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <Text style={styles.skillLevel}>{skill.level}%</Text>
                    </View>
                    <View style={styles.skillBar}>
                      <View style={[styles.skillProgress, { width: `${skill.level}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {adminSkills.length > 0 && (
              <View style={styles.skillCategory}>
                <Text style={styles.skillCategoryTitle}>المهارات الإدارية</Text>
                {adminSkills.map((skill) => (
                  <View key={skill.id} style={styles.skillItem}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <Text style={styles.skillLevel}>{skill.level}%</Text>
                    </View>
                    <View style={styles.skillBar}>
                      <View style={[styles.skillProgress, { width: `${skill.level}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: GOLD,
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: GOLD,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    color: GOLD,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  locationText: {
    color: '#aaa',
    marginLeft: 6,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardLabel: {
    fontSize: 14,
    color: GOLD,
    marginBottom: 8,
    fontWeight: '600',
  },
  cardText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 24,
    textAlign: 'right',
  },
  summaryText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 26,
    textAlign: 'right',
  },
  skillCategory: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  skillCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 16,
    textAlign: 'right',
  },
  skillItem: {
    marginBottom: 14,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillName: {
    fontSize: 14,
    color: '#fff',
  },
  skillLevel: {
    fontSize: 13,
    color: GOLD,
  },
  skillBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillProgress: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 3,
  },
});
