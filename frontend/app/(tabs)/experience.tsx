import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

export default function ExperienceScreen() {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [expRes, eduRes, certRes] = await Promise.all([
        api.get('/experiences'),
        api.get('/education'),
        api.get('/certificates'),
      ]);
      setExperiences(expRes.data);
      setEducation(eduRes.data);
      setCertificates(certRes.data);
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
          <Text style={styles.headerTitle}>الخبرات والتعليم</Text>
        </View>

        {/* Work Experience */}
        {experiences.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase" size={24} color={GOLD} />
              <Text style={styles.sectionTitle}>الخبرات العملية</Text>
            </View>
            {experiences.map((exp, index) => (
              <View key={exp.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < experiences.length - 1 && <View style={styles.timelineLine} />}
                <View style={styles.timelineContent}>
                  <Text style={styles.itemTitle}>{exp.position}</Text>
                  <Text style={styles.itemSubtitle}>{exp.company}</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar" size={14} color="#888" />
                    <Text style={styles.dateText}>
                      {exp.start_date} - {exp.is_current ? 'حتى الآن' : exp.end_date}
                    </Text>
                  </View>
                  {exp.location && (
                    <View style={styles.dateRow}>
                      <Ionicons name="location" size={14} color="#888" />
                      <Text style={styles.dateText}>{exp.location}</Text>
                    </View>
                  )}
                  {exp.description && (
                    <Text style={styles.description}>{exp.description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={24} color={GOLD} />
              <Text style={styles.sectionTitle}>التعليم</Text>
            </View>
            {education.map((edu, index) => (
              <View key={edu.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#1e3a5f' }]} />
                {index < education.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: '#1e3a5f' }]} />
                )}
                <View style={styles.timelineContent}>
                  <Text style={styles.itemTitle}>{edu.degree}</Text>
                  <Text style={styles.itemSubtitle}>{edu.field}</Text>
                  <Text style={styles.institutionText}>{edu.institution}</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar" size={14} color="#888" />
                    <Text style={styles.dateText}>
                      {edu.start_date} - {edu.is_current ? 'حتى الآن' : edu.end_date}
                    </Text>
                  </View>
                  {edu.description && (
                    <Text style={styles.description}>{edu.description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="ribbon" size={24} color={GOLD} />
              <Text style={styles.sectionTitle}>الشهادات الاحترافية</Text>
            </View>
            {certificates.map((cert) => (
              <View key={cert.id} style={styles.certificateCard}>
                <View style={styles.certIcon}>
                  <Ionicons name="medal" size={28} color={GOLD} />
                </View>
                <View style={styles.certContent}>
                  <Text style={styles.certTitle}>{cert.title}</Text>
                  <Text style={styles.certIssuer}>{cert.issuer}</Text>
                  {cert.date && (
                    <Text style={styles.certDate}>{cert.date}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {experiences.length === 0 && education.length === 0 && certificates.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد بيانات بعد</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GOLD,
    marginTop: 4,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 18,
    width: 2,
    height: '100%',
    backgroundColor: GOLD,
    opacity: 0.3,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'right',
  },
  itemSubtitle: {
    fontSize: 16,
    color: GOLD,
    marginBottom: 8,
    textAlign: 'right',
  },
  institutionText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    textAlign: 'right',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 12,
    lineHeight: 22,
    textAlign: 'right',
  },
  certificateCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  certIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  certContent: {
    flex: 1,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  certIssuer: {
    fontSize: 14,
    color: GOLD,
    marginBottom: 4,
  },
  certDate: {
    fontSize: 13,
    color: '#888',
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
