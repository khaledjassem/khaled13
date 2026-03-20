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
  Switch,
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

interface Experience {
  id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string;
  location?: string;
  order: number;
}

export default function AdminExperience() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Experience | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyItem: Experience = {
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    location: '',
    order: 0,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/experiences');
      setExperiences(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem?.company || !editingItem?.position || !editingItem?.start_date) {
      Alert.alert('خطأ', 'يرجى ملء الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingItem.id) {
        await api.put(`/experiences/${editingItem.id}`, editingItem, { headers });
      } else {
        await api.post('/experiences', editingItem, { headers });
      }
      
      setModalVisible(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'فشل في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من الحذف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('session_token');
            await api.delete(`/experiences/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchData();
          } catch (error) {
            console.error('Error:', error);
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        },
      },
    ]);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الخبرات العملية</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingItem({ ...emptyItem, order: experiences.length });
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {experiences.length > 0 ? (
          experiences.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.position}</Text>
                <Text style={styles.cardSubtitle}>{item.company}</Text>
                <Text style={styles.cardDate}>
                  {item.start_date} - {item.is_current ? 'حتى الآن' : item.end_date}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setEditingItem(item);
                    setModalVisible(true);
                  }}
                >
                  <Ionicons name="pencil" size={20} color={GOLD} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => item.id && handleDelete(item.id)}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>لا توجد خبرات بعد</Text>
            <Text style={styles.emptySubtext}>اضغط + لإضافة خبرة جديدة</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem?.id ? 'تعديل الخبرة' : 'إضافة خبرة'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>المنصب *</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.position || ''}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, position: text} : null)}
                  placeholder="مثال: مدير المشاريع"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>الشركة *</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.company || ''}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, company: text} : null)}
                  placeholder="اسم الشركة"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>الموقع</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem?.location || ''}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, location: text} : null)}
                  placeholder="المدينة، الدولة"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>تاريخ البداية *</Text>
                  <TextInput
                    style={styles.input}
                    value={editingItem?.start_date || ''}
                    onChangeText={(text) => setEditingItem(prev => prev ? {...prev, start_date: text} : null)}
                    placeholder="2020"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>تاريخ النهاية</Text>
                  <TextInput
                    style={[styles.input, editingItem?.is_current && styles.inputDisabled]}
                    value={editingItem?.end_date || ''}
                    onChangeText={(text) => setEditingItem(prev => prev ? {...prev, end_date: text} : null)}
                    placeholder="2023"
                    placeholderTextColor="#666"
                    editable={!editingItem?.is_current}
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>أعمل هنا حالياً</Text>
                <Switch
                  value={editingItem?.is_current || false}
                  onValueChange={(value) => setEditingItem(prev => prev ? {...prev, is_current: value, end_date: value ? '' : prev.end_date} : null)}
                  trackColor={{ false: '#333', true: GOLD }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>الوصف</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingItem?.description || ''}
                  onChangeText={(text) => setEditingItem(prev => prev ? {...prev, description: text} : null)}
                  placeholder="وصف المهام والإنجازات..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveModalButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveModalButtonText}>حفظ</Text>
              )}
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
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4, textAlign: 'right' },
  cardSubtitle: { fontSize: 14, color: GOLD, marginBottom: 4, textAlign: 'right' },
  cardDate: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#555', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: GOLD, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: CARD_BG, borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333', textAlign: 'right' },
  inputDisabled: { opacity: 0.5 },
  textArea: { minHeight: 100, paddingTop: 16 },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  switchLabel: { fontSize: 15, color: '#fff' },
  saveModalButton: { backgroundColor: GOLD, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { opacity: 0.7 },
  saveModalButtonText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
