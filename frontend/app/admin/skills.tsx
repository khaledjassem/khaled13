import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';

const GOLD = '#D4AF37';
const DARK_BG = '#0c0c0c';
const CARD_BG = '#1a1a1a';

interface Skill {
  id?: string;
  name: string;
  category: string;
  level: number;
  order: number;
}

const CATEGORIES = [
  { key: 'technical', label: 'تقنية' },
  { key: 'administrative', label: 'إدارية' },
  { key: 'soft', label: 'شخصية' },
];

export default function AdminSkills() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Skill[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Skill | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyItem: Skill = { name: '', category: 'technical', level: 80, order: 0 };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/skills');
      setItems(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.name) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المهارة');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };
      if (editingItem.id) {
        await api.put(`/skills/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/skills', editingItem, { headers });
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
            await api.delete(`/skills/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        },
      },
    ]);
  };

  const getCategoryLabel = (key: string) => CATEGORIES.find(c => c.key === key)?.label || key;

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={GOLD} /></View>;

  const groupedSkills = CATEGORIES.map(cat => ({
    ...cat,
    skills: items.filter(s => s.category === cat.key)
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المهارات</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingItem({ ...emptyItem, order: items.length }); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {groupedSkills.map((group) => group.skills.length > 0 && (
          <View key={group.key} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>المهارات {group.label}</Text>
            {group.skills.map((item) => (
              <View key={item.id} style={styles.skillCard}>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{item.name}</Text>
                  <View style={styles.skillBar}>
                    <View style={[styles.skillProgress, { width: `${item.level}%` }]} />
                  </View>
                  <Text style={styles.skillLevel}>{item.level}%</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => { setEditingItem(item); setModalVisible(true); }}>
                    <Ionicons name="pencil" size={18} color={GOLD} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => item.id && handleDelete(item.id)}>
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد مهارات بعد</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.id ? 'تعديل' : 'إضافة'} مهارة</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المهارة *</Text>
                <TextInput style={styles.input} value={editingItem?.name || ''} onChangeText={(text) => setEditingItem(prev => prev ? {...prev, name: text} : null)} placeholder="مثال: Python" placeholderTextColor="#666" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>التصنيف</Text>
                <View style={styles.categoryButtons}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryButton, editingItem?.category === cat.key && styles.categoryButtonActive]}
                      onPress={() => setEditingItem(prev => prev ? {...prev, category: cat.key} : null)}
                    >
                      <Text style={[styles.categoryButtonText, editingItem?.category === cat.key && styles.categoryButtonTextActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>مستوى الإتقان: {editingItem?.level || 80}%</Text>
                <View style={styles.levelButtons}>
                  {[40, 60, 80, 90, 100].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.levelButton, editingItem?.level === level && styles.levelButtonActive]}
                      onPress={() => setEditingItem(prev => prev ? {...prev, level} : null)}
                    >
                      <Text style={[styles.levelButtonText, editingItem?.level === level && styles.levelButtonTextActive]}>{level}%</Text>
                    </TouchableOpacity>
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
  categorySection: { paddingHorizontal: 20, marginTop: 24 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: GOLD, marginBottom: 12, textAlign: 'right' },
  skillCard: { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 15, fontWeight: '500', color: '#fff', marginBottom: 8, textAlign: 'right' },
  skillBar: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  skillProgress: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },
  skillLevel: { fontSize: 12, color: '#888', textAlign: 'right' },
  cardActions: { flexDirection: 'row' },
  actionButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: GOLD, marginBottom: 10, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right' },
  categoryButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryButton: { flex: 1, backgroundColor: CARD_BG, paddingVertical: 12, borderRadius: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#333' },
  categoryButtonActive: { backgroundColor: GOLD, borderColor: GOLD },
  categoryButtonText: { textAlign: 'center', color: '#888', fontSize: 14 },
  categoryButtonTextActive: { color: '#000', fontWeight: '600' },
  levelButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  levelButton: { flex: 1, backgroundColor: CARD_BG, paddingVertical: 12, borderRadius: 10, marginHorizontal: 2, borderWidth: 1, borderColor: '#333' },
  levelButtonActive: { backgroundColor: GOLD, borderColor: GOLD },
  levelButtonText: { textAlign: 'center', color: '#888', fontSize: 13 },
  levelButtonTextActive: { color: '#000', fontWeight: '600' },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
