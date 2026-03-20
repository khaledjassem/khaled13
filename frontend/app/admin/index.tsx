import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  description: string;
}

const menuItems: MenuItem[] = [
  { title: 'الملف الشخصي', icon: 'person', route: '/admin/profile', description: 'الاسم، الصورة، النبذة، الرؤية والرسالة' },
  { title: 'الخبرات العملية', icon: 'briefcase', route: '/admin/experience', description: 'إدارة خبراتك المهنية' },
  { title: 'التعليم', icon: 'school', route: '/admin/education', description: 'الشهادات الأكاديمية' },
  { title: 'المهارات', icon: 'stats-chart', route: '/admin/skills', description: 'المهارات التقنية والإدارية' },
  { title: 'الأبحاث العلمية', icon: 'document-text', route: '/admin/research', description: 'إدارة أبحاثك العلمية' },
  { title: 'الكتب والمؤلفات', icon: 'book', route: '/admin/books', description: 'كتبك ومنشوراتك' },
  { title: 'المشاريع', icon: 'folder', route: '/admin/projects', description: 'مشاريعك المميزة' },
  { title: 'الجوائز والتكريمات', icon: 'trophy', route: '/admin/awards', description: 'جوائزك وتكريماتك' },
  { title: 'الشهادات الاحترافية', icon: 'ribbon', route: '/admin/certificates', description: 'الشهادات والاعتمادات' },
  { title: 'وسائل التواصل', icon: 'share-social', route: '/admin/social', description: 'روابط التواصل الاجتماعي' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.userPhoto} />
          ) : (
            <View style={styles.userPhotoPlaceholder}>
              <Ionicons name="person" size={32} color="#666" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={28} color={GOLD} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: GOLD,
  },
  userPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  menuItem: {
    width: '46%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    margin: '2%',
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'right',
  },
  menuDescription: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
});
