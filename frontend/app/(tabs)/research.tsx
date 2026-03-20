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

export default function ResearchScreen() {
  const [research, setResearch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/research');
      setResearch(res.data);
    } catch (error) {
      console.error('Error fetching research:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#22c55e';
      case 'under_review':
        return '#f59e0b';
      case 'draft':
        return '#6b7280';
      default:
        return GOLD;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'منشور';
      case 'under_review':
        return 'قيد المراجعة';
      case 'draft':
        return 'مسودة';
      default:
        return status;
    }
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
          <Text style={styles.headerTitle}>الأبحاث العلمية</Text>
          <Text style={styles.headerSubtitle}>{research.length} بحث علمي</Text>
        </View>

        {/* Research List */}
        {research.length > 0 ? (
          <View style={styles.list}>
            {research.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="document-text" size={24} color={GOLD} />
                  </View>
                  <View style={styles.cardTitleSection}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                      </View>
                      {item.publication_date && (
                        <Text style={styles.dateText}>{item.publication_date}</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons
                    name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </View>

                {expandedId === item.id && (
                  <View style={styles.expandedContent}>
                    {item.journal && (
                      <View style={styles.infoRow}>
                        <Ionicons name="newspaper" size={16} color={GOLD} />
                        <Text style={styles.infoLabel}>المجلة:</Text>
                        <Text style={styles.infoValue}>{item.journal}</Text>
                      </View>
                    )}

                    {item.abstract && (
                      <View style={styles.abstractSection}>
                        <Text style={styles.abstractLabel}>الملخص:</Text>
                        <Text style={styles.abstractText}>{item.abstract}</Text>
                      </View>
                    )}

                    {item.keywords && item.keywords.length > 0 && (
                      <View style={styles.keywordsSection}>
                        <Text style={styles.keywordsLabel}>الكلمات المفتاحية:</Text>
                        <View style={styles.keywordsList}>
                          {item.keywords.map((keyword: string, index: number) => (
                            <View key={index} style={styles.keywordTag}>
                              <Text style={styles.keywordText}>{keyword}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {item.doi && (
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => Linking.openURL(`https://doi.org/${item.doi}`)}
                      >
                        <Ionicons name="link" size={16} color={GOLD} />
                        <Text style={styles.linkText}>DOI: {item.doi}</Text>
                      </TouchableOpacity>
                    )}

                    {item.pdf_url && (
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => Linking.openURL(item.pdf_url)}
                      >
                        <Ionicons name="document" size={18} color="#fff" />
                        <Text style={styles.pdfButtonText}>تحميل PDF</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد أبحاث بعد</Text>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  abstractSection: {
    marginBottom: 16,
  },
  abstractLabel: {
    fontSize: 14,
    color: GOLD,
    marginBottom: 8,
  },
  abstractText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    textAlign: 'right',
  },
  keywordsSection: {
    marginBottom: 16,
  },
  keywordsLabel: {
    fontSize: 14,
    color: GOLD,
    marginBottom: 8,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordTag: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  keywordText: {
    fontSize: 12,
    color: '#ddd',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: GOLD,
    marginLeft: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pdfButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
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
