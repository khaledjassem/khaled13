import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

const { width } = Dimensions.get('window');
const BOOK_WIDTH = (width - 60) / 2;

export default function BooksScreen() {
  const [books, setBooks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'books' | 'projects' | 'awards'>('books');

  const fetchData = async () => {
    try {
      const [booksRes, projectsRes, awardsRes] = await Promise.all([
        api.get('/books'),
        api.get('/projects'),
        api.get('/awards'),
      ]);
      setBooks(booksRes.data);
      setProjects(projectsRes.data);
      setAwards(awardsRes.data);
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
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'books' && styles.activeTab]}
          onPress={() => setActiveTab('books')}
        >
          <Ionicons name="book" size={20} color={activeTab === 'books' ? GOLD : '#888'} />
          <Text style={[styles.tabText, activeTab === 'books' && styles.activeTabText]}>الكتب</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
          onPress={() => setActiveTab('projects')}
        >
          <Ionicons name="folder" size={20} color={activeTab === 'projects' ? GOLD : '#888'} />
          <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>المشاريع</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'awards' && styles.activeTab]}
          onPress={() => setActiveTab('awards')}
        >
          <Ionicons name="trophy" size={20} color={activeTab === 'awards' ? GOLD : '#888'} />
          <Text style={[styles.tabText, activeTab === 'awards' && styles.activeTabText]}>الجوائز</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
      >
        {/* Books Tab */}
        {activeTab === 'books' && (
          <View style={styles.content}>
            {books.length > 0 ? (
              <View style={styles.booksGrid}>
                {books.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    style={styles.bookCard}
                    onPress={() => book.purchase_url && Linking.openURL(book.purchase_url)}
                  >
                    {book.cover_image ? (
                      <Image source={{ uri: book.cover_image }} style={styles.bookCover} />
                    ) : (
                      <View style={styles.bookCoverPlaceholder}>
                        <Ionicons name="book" size={40} color="#555" />
                      </View>
                    )}
                    <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                    {book.publisher && (
                      <Text style={styles.bookPublisher}>{book.publisher}</Text>
                    )}
                    {book.page_count && (
                      <Text style={styles.bookPages}>{book.page_count} صفحة</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color="#444" />
                <Text style={styles.emptyText}>لا توجد كتب بعد</Text>
              </View>
            )}
          </View>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <View style={styles.content}>
            {projects.length > 0 ? (
              projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => project.url && Linking.openURL(project.url)}
                >
                  {project.image && (
                    <Image source={{ uri: project.image }} style={styles.projectImage} />
                  )}
                  <View style={styles.projectContent}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    {project.description && (
                      <Text style={styles.projectDescription} numberOfLines={2}>
                        {project.description}
                      </Text>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <View style={styles.techList}>
                        {project.technologies.slice(0, 3).map((tech: string, index: number) => (
                          <View key={index} style={styles.techTag}>
                            <Text style={styles.techText}>{tech}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {project.url && (
                    <Ionicons name="open-outline" size={20} color={GOLD} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="folder-outline" size={64} color="#444" />
                <Text style={styles.emptyText}>لا توجد مشاريع بعد</Text>
              </View>
            )}
          </View>
        )}

        {/* Awards Tab */}
        {activeTab === 'awards' && (
          <View style={styles.content}>
            {awards.length > 0 ? (
              awards.map((award) => (
                <View key={award.id} style={styles.awardCard}>
                  <View style={styles.awardIcon}>
                    <Ionicons name="trophy" size={32} color={GOLD} />
                  </View>
                  <View style={styles.awardContent}>
                    <Text style={styles.awardTitle}>{award.title}</Text>
                    {award.issuer && (
                      <Text style={styles.awardIssuer}>{award.issuer}</Text>
                    )}
                    {award.date && (
                      <Text style={styles.awardDate}>{award.date}</Text>
                    )}
                    {award.description && (
                      <Text style={styles.awardDescription}>{award.description}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={64} color="#444" />
                <Text style={styles.emptyText}>لا توجد جوائز بعد</Text>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 6,
  },
  activeTabText: {
    color: GOLD,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookCard: {
    width: BOOK_WIDTH,
    marginBottom: 20,
  },
  bookCover: {
    width: '100%',
    height: BOOK_WIDTH * 1.4,
    borderRadius: 8,
    marginBottom: 10,
  },
  bookCoverPlaceholder: {
    width: '100%',
    height: BOOK_WIDTH * 1.4,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'right',
  },
  bookPublisher: {
    fontSize: 12,
    color: GOLD,
    marginBottom: 2,
  },
  bookPages: {
    fontSize: 11,
    color: '#888',
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  projectImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  projectContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 8,
  },
  techList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  techTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  techText: {
    fontSize: 11,
    color: GOLD,
  },
  awardCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  awardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  awardContent: {
    flex: 1,
  },
  awardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  awardIssuer: {
    fontSize: 14,
    color: GOLD,
    marginBottom: 4,
  },
  awardDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  awardDescription: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
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
