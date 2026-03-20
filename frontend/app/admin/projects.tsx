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

interface Project {
  id?: string;
  title: string;
  description: string;
  image?: string;
  url?: string;
  technologies: string[];
  start_date?: string;
  end_date?: string;
  order: number;
}

export default function AdminProjects() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Project[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState('');

  const emptyItem: Project = { title: '', description: '', image: '', url: '', technologies: [], start_date: '', end_date: '', order: 0 };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/projects');
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
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditingItem(prev => prev ? {...prev, image: base64Image} : null);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.title) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المشروع');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem.id) {
        await api.put(`/projects/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/projects', editingItem, { headers });
      }
      setModalVisible(false);
      setEditingItem(null);
      setTechInput('');
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
            await api.delete(`/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        },
      },
    ]);
  };

  const addTech = () => {
    if (techInput.trim() && editingItem) {
      setEditingItem({ ...editingItem, technologies: [...editingItem.technologies, techInput.trim()] });
      setTechInput('');
    }
  };

  const removeTech = (index: number) => {
    if (editingItem) {
      const newTech = editingItem.technologies.filter((_, i) => i !== index);
      setEditingItem({ ...editingItem, technologies: newTech });
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={GOLD} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المشاريع</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem({ ...emptyItem, order: items.length }); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length > 0 ? items.map((item) => (
          <View key={item.id} style={styles.card}>
            {item.image && <Image source={{ uri: item.image }} style={styles.projectImage} />}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
              {item.technologies.length > 0 && (
                <View style={styles.techList}>
                  {item.technologies.slice(0, 3).map((tech, i) => (
                    <View key={i} style={styles.techTag}><Text style={styles.techText}>{tech}</Text></View>
                  ))}
                </View>
              )}
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
            <Ionicons name="folder-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد مشاريع بعد</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.id ? 'تعديل' : 'إضافة'} مشروع</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setTechInput(''); }}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {editingItem?.image ? (
                  <Image source={{ uri: editingItem.image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="image" size={32} color="#666" />
                    <Text style={styles.imagePickerText}>إضافة صورة</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المشروع *</Text>
                <TextInput style={styles.input} value={editingItem?.title || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, title: text} : null)} placeholder="اسم المشروع" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الوصف</Text>
                <TextInput style={[styles.input, styles.textArea]} value={editingItem?.description || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, description: text} : null)} placeholder="وصف المشروع..." placeholderTextColor="#666" multiline numberOfLines={3} textAlignVertical="top" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>رابط المشروع</Text>
                <TextInput style={styles.input} value={editingItem?.url || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, url: text} : null)} placeholder="https://..." placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>التقنيات المستخدمة</Text>
                <View style={styles.techInputRow}>
                  <TextInput style={styles.techTextInput} value={techInput} onChangeText={setTechInput} placeholder="أضف تقنية..." placeholderTextColor="#666" onSubmitEditing={addTech} />
                  <TouchableOpacity style={styles.techAddButton} onPress={addTech}>
                    <Ionicons name="add" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
                <View style={styles.techListEdit}>
                  {editingItem?.technologies.map((tech, index) => (
                    <View key={index} style={styles.techTagEdit}>
                      <Text style={styles.techTextEdit}>{tech}</Text>
                      <TouchableOpacity onPress={() => removeTech(index)}>
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
  card: { backgroundColor: CARD_BG, marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#333' },
  projectImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6, textAlign: 'right' },
  cardDesc: { fontSize: 13, color: '#aaa', marginBottom: 8 },
  techList: { flexDirection: 'row', flexWrap: 'wrap' },
  techTag: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 6, marginBottom: 4 },
  techText: { fontSize: 11, color: GOLD },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  imagePreview: { width: 200, height: 112, borderRadius: 8 },
  imagePickerPlaceholder: { width: 200, height: 112, borderRadius: 8, backgroundColor: CARD_BG, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#444', borderStyle: 'dashed' },
  imagePickerText: { color: '#666', marginTop: 8, fontSize: 13 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: GOLD, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right' },
  textArea: { minHeight: 80, paddingTop: 16 },
  techInputRow: { flexDirection: 'row', alignItems: 'center' },
  techTextInput: { flex: 1, backgroundColor: CARD_BG, borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right', marginRight: 8 },
  techAddButton: { backgroundColor: GOLD, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  techListEdit: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  techTagEdit: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  techTextEdit: { fontSize: 12, color: '#ddd', marginRight: 6 },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
