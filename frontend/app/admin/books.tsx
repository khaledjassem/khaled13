import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

interface Book {
  id?: string;
  title: string;
  description: string;
  cover_image?: string;
  publication_date?: string;
  publisher?: string;
  purchase_url?: string;
  download_url?: string;
  page_count?: number;
  order: number;
}

export default function AdminBooks() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Book[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyItem: Book = { title: '', description: '', cover_image: '', publication_date: '', publisher: '', purchase_url: '', download_url: '', page_count: undefined, order: 0 };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/books');
      setItems(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'نحتاج إذن الوصول إلى الصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditingItem(prev => prev ? {...prev, cover_image: base64Image} : null);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.title) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الكتاب');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem.id) {
        await api.put(`/books/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/books', editingItem, { headers });
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
            await api.delete(`/books/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
        <Text style={styles.headerTitle}>الكتب والمؤلفات</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem({ ...emptyItem, order: items.length }); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length > 0 ? items.map((item) => (
          <View key={item.id} style={styles.card}>
            {item.cover_image ? (
              <Image source={{ uri: item.cover_image }} style={styles.bookCover} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="book" size={28} color="#555" />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.publisher && <Text style={styles.cardSubtitle}>{item.publisher}</Text>}
              {item.page_count && <Text style={styles.cardDate}>{item.page_count} صفحة</Text>}
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
            <Ionicons name="book-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد كتب بعد</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.id ? 'تعديل' : 'إضافة'} كتاب</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.coverPicker} onPress={pickImage}>
                {editingItem?.cover_image ? (
                  <Image source={{ uri: editingItem.cover_image }} style={styles.coverPreview} />
                ) : (
                  <View style={styles.coverPickerPlaceholder}>
                    <Ionicons name="image" size={32} color="#666" />
                    <Text style={styles.coverPickerText}>إضافة غلاف</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>العنوان *</Text>
                <TextInput style={styles.input} value={editingItem?.title || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, title: text} : null)} placeholder="عنوان الكتاب" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الوصف</Text>
                <TextInput style={[styles.input, styles.textArea]} value={editingItem?.description || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, description: text} : null)} placeholder="وصف الكتاب..." placeholderTextColor="#666" multiline numberOfLines={3} textAlignVertical="top" />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>دار النشر</Text>
                  <TextInput style={styles.input} value={editingItem?.publisher || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, publisher: text} : null)} placeholder="اسم دار النشر" placeholderTextColor="#666" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>تاريخ النشر</Text>
                  <TextInput style={styles.input} value={editingItem?.publication_date || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, publication_date: text} : null)} placeholder="2023" placeholderTextColor="#666" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>عدد الصفحات</Text>
                <TextInput style={styles.input} value={editingItem?.page_count?.toString() || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, page_count: parseInt(text) || undefined} : null)} placeholder="250" placeholderTextColor="#666" keyboardType="numeric" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>رابط الشراء</Text>
                <TextInput style={styles.input} value={editingItem?.purchase_url || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, purchase_url: text} : null)} placeholder="https://..." placeholderTextColor="#666" />
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
  card: { flexDirection: 'row', backgroundColor: CARD_BG, marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  bookCover: { width: 60, height: 80, borderRadius: 6, marginRight: 12 },
  coverPlaceholder: { width: 60, height: 80, borderRadius: 6, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4, textAlign: 'right' },
  cardSubtitle: { fontSize: 13, color: GOLD, marginBottom: 2, textAlign: 'right' },
  cardDate: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row' },
  actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  coverPicker: { alignSelf: 'center', marginBottom: 20 },
  coverPreview: { width: 120, height: 160, borderRadius: 8 },
  coverPickerPlaceholder: { width: 120, height: 160, borderRadius: 8, backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#444', borderStyle: 'dashed' },
  coverPickerText: { color: '#666', marginTop: 8, fontSize: 13 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: GOLD, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right' },
  textArea: { minHeight: 80, paddingTop: 16 },
  row: { flexDirection: 'row' },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
