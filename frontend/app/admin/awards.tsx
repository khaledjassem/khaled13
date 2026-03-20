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

interface Award {
  id?: string;
  title: string;
  issuer: string;
  date?: string;
  description: string;
  order: number;
}

export default function AdminAwards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Award[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Award | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyItem: Award = { title: '', issuer: '', date: '', description: '', order: 0 };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/awards');
      setItems(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.title) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الجائزة');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem.id) {
        await api.put(`/awards/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/awards', editingItem, { headers });
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
            await api.delete(`/awards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={GOLD} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الجوائز والتكريمات</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem({ ...emptyItem, order: items.length }); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length > 0 ? items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.awardIcon}>
              <Ionicons name="trophy" size={28} color={GOLD} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.issuer && <Text style={styles.cardSubtitle}>{item.issuer}</Text>}
              {item.date && <Text style={styles.cardDate}>{item.date}</Text>}
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
        )) : (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد جوائز بعد</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.id ? 'تعديل' : 'إضافة'} جائزة</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم الجائزة *</Text>
                <TextInput style={styles.input} value={editingItem?.title || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, title: text} : null)} placeholder="اسم الجائزة" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الجهة المانحة</Text>
                <TextInput style={styles.input} value={editingItem?.issuer || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, issuer: text} : null)} placeholder="اسم الجهة" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>التاريخ</Text>
                <TextInput style={styles.input} value={editingItem?.date || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, date: text} : null)} placeholder="2023" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الوصف</Text>
                <TextInput style={[styles.input, styles.textArea]} value={editingItem?.description || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, description: text} : null)} placeholder="وصف الجائزة..." placeholderTextColor="#666" multiline numberOfLines={3} textAlignVertical="top" />
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
  card: { flexDirection: 'row', backgroundColor: CARD_BG, marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  awardIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4, textAlign: 'right' },
  cardSubtitle: { fontSize: 13, color: GOLD, marginBottom: 2, textAlign: 'right' },
  cardDate: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row' },
  actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: GOLD, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right' },
  textArea: { minHeight: 80, paddingTop: 16 },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
