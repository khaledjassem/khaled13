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

interface Research {
  id?: string;
  title: string;
  abstract: string;
  publication_date?: string;
  journal?: string;
  doi?: string;
  pdf_url?: string;
  keywords: string[];
  status: string;
  order: number;
}

const STATUS_OPTIONS = [
  { key: 'published', label: 'منشور', color: '#22c55e' },
  { key: 'under_review', label: 'قيد المراجعة', color: '#f59e0b' },
  { key: 'draft', label: 'مسودة', color: '#6b7280' },
];

export default function AdminResearch() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Research[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Research | null>(null);
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const emptyItem: Research = { title: '', abstract: '', publication_date: '', journal: '', doi: '', pdf_url: '', keywords: [], status: 'published', order: 0 };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/research');
      setItems(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.title) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان البحث');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem.id) {
        await api.put(`/research/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/research', editingItem, { headers });
      }
      setModalVisible(false);
      setEditingItem(null);
      setKeywordInput('');
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
            await api.delete(`/research/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        },
      },
    ]);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && editingItem) {
      setEditingItem({ ...editingItem, keywords: [...editingItem.keywords, keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    if (editingItem) {
      const newKeywords = editingItem.keywords.filter((_, i) => i !== index);
      setEditingItem({ ...editingItem, keywords: newKeywords });
    }
  };

  const getStatusInfo = (status: string) => STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[0];

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={GOLD} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأبحاث العلمية</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem({ ...emptyItem, order: items.length }); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length > 0 ? items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(item.status).color }]}>
                  <Text style={styles.statusText}>{getStatusInfo(item.status).label}</Text>
                </View>
                {item.publication_date && <Text style={styles.cardDate}>{item.publication_date}</Text>}
              </View>
              {item.journal && <Text style={styles.cardJournal}>{item.journal}</Text>}
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
            <Ionicons name="document-text-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد أبحاث بعد</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.id ? 'تعديل' : 'إضافة'} بحث</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setKeywordInput(''); }}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>العنوان *</Text>
                <TextInput style={styles.input} value={editingItem?.title || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, title: text} : null)} placeholder="عنوان البحث" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الملخص</Text>
                <TextInput style={[styles.input, styles.textArea]} value={editingItem?.abstract || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, abstract: text} : null)} placeholder="ملخص البحث..." placeholderTextColor="#666" multiline numberOfLines={4} textAlignVertical="top" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الحالة</Text>
                <View style={styles.statusButtons}>
                  {STATUS_OPTIONS.map((status) => (
                    <TouchableOpacity
                      key={status.key}
                      style={[styles.statusButton, editingItem?.status === status.key && { backgroundColor: status.color, borderColor: status.color }]}
                      onPress={() => setEditingItem(prev => prev ? {...prev, status: status.key} : null)}
                    >
                      <Text style={[styles.statusButtonText, editingItem?.status === status.key && { color: '#fff' }]}>{status.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>تاريخ النشر</Text>
                  <TextInput style={styles.input} value={editingItem?.publication_date || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, publication_date: text} : null)} placeholder="2023" placeholderTextColor="#666" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>المجلة</Text>
                  <TextInput style={styles.input} value={editingItem?.journal || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, journal: text} : null)} placeholder="اسم المجلة" placeholderTextColor="#666" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DOI</Text>
                <TextInput style={styles.input} value={editingItem?.doi || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, doi: text} : null)} placeholder="10.xxxx/xxxxx" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>رابط PDF</Text>
                <TextInput style={styles.input} value={editingItem?.pdf_url || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, pdf_url: text} : null)} placeholder="https://..." placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الكلمات المفتاحية</Text>
                <View style={styles.keywordInput}>
                  <TextInput style={styles.keywordTextInput} value={keywordInput} onChangeText={setKeywordInput} placeholder="أضف كلمة..." placeholderTextColor="#666" onSubmitEditing={addKeyword} />
                  <TouchableOpacity style={styles.keywordAddButton} onPress={addKeyword}>
                    <Ionicons name="add" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
                <View style={styles.keywordsList}>
                  {editingItem?.keywords.map((keyword, index) => (
                    <View key={index} style={styles.keywordTag}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                      <TouchableOpacity onPress={() => removeKeyword(index)}>
                        <Ionicons name="close" size={16} color="#888" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
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
  card: { flexDirection: 'row', backgroundColor: CARD_BG, marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 8, textAlign: 'right', lineHeight: 22 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardDate: { fontSize: 12, color: '#888' },
  cardJournal: { fontSize: 12, color: GOLD },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: GOLD, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right' },
  textArea: { minHeight: 100, paddingTop: 16 },
  row: { flexDirection: 'row' },
  statusButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  statusButton: { flex: 1, backgroundColor: CARD_BG, paddingVertical: 10, borderRadius: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#333' },
  statusButtonText: { textAlign: 'center', color: '#888', fontSize: 13 },
  keywordInput: { flexDirection: 'row', alignItems: 'center' },
  keywordTextInput: { flex: 1, backgroundColor: CARD_BG, borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right', marginRight: 8 },
  keywordAddButton: { backgroundColor: GOLD, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keywordsList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  keywordTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  keywordText: { fontSize: 12, color: '#ddd', marginRight: 6 },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
