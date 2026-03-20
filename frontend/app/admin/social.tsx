import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  icon?: string;
  order: number;
}

const PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
  { key: 'twitter', label: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { key: 'github', label: 'GitHub', icon: 'logo-github', color: '#333' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#4267B2' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'website', label: 'الموقع', icon: 'globe', color: GOLD },
];

export default function AdminSocial() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SocialLink[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialLink | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyItem: SocialLink = { platform: 'linkedin', url: '', icon: '', order: 0 };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/social-links');
      setItems(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.url) {
      Alert.alert('خطأ', 'يرجى إدخال الرابط');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem.id) {
        await api.put(`/social-links/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/social-links', editingItem, { headers });
      }
      setModalVisible(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من الحذف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('session_token');
            await api.delete(`/social-links/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        },
      },
    ]);
  };

  const getPlatformInfo = (key: string) => PLATFORMS.find(p => p.key === key) || PLATFORMS[0];

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={GOLD} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>وسائل التواصل</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem({ ...emptyItem, order: items.length }); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length > 0 ? items.map((item) => {
          const platform = getPlatformInfo(item.platform);
          return (
            <View key={item.id} style={styles.card}>
              <View style={[styles.socialIcon, { backgroundColor: platform.color }]}>
                <Ionicons name={platform.icon as any} size={24} color="#fff" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{platform.label}</Text>
                <Text style={styles.cardUrl} numberOfLines={1}>{item.url}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => { setEditingItem(item); setModalVisible(true); }}>
                  <Ionicons name="pencil" size={20} color={GOLD} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => item.id && handleDelete(item.id)}>
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Ionicons name="share-social-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد روابط بعد</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.id ? 'تعديل' : 'إضافة'} رابط</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>المنصة</Text>
                <View style={styles.platformGrid}>
                  {PLATFORMS.map((p) => (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        styles.platformButton,
                        editingItem?.platform === p.key && { backgroundColor: p.color, borderColor: p.color }
                      ]}
                      onPress={() => setEditingItem(prev => prev ? {...prev, platform: p.key} : null)}
                    >
                      <Ionicons name={p.icon as any} size={20} color={editingItem?.platform === p.key ? '#fff' : '#888'} />
                      <Text style={[styles.platformText, editingItem?.platform === p.key && { color: '#fff' }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الرابط / المعرف *</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.url || ''}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, url: text} : null)}
                  placeholder={editingItem?.platform === 'whatsapp' ? '+966xxxxxxxxx' : 'https://...'}
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.saveModalButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveModalButtonText}>حفظ</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_BG },
  loadingContainer: { flex: 1, backgroundColor: DARK_BG, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', backgroundColor: CARD_BG, marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  socialIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  cardUrl: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row' },
  actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: GOLD, marginBottom: 12, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333' },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  platformButton: { width: '23%', backgroundColor: CARD_BG, paddingVertical: 12, borderRadius: 10, margin: '1%', borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  platformText: { fontSize: 10, color: '#888', marginTop: 4 },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
