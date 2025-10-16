import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, FileText, Trash2, CreditCard as Edit, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';

interface Algorithm {
  id: string;
  title: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  content: any;
  last_updated: string;
}

export default function ManageAlgorithmsPage() {
  const { user } = useAuth();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlgorithm, setEditingAlgorithm] = useState<Algorithm | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    urgency: 'medium' as 'high' | 'medium' | 'low',
    description: '',
    symptoms: '',
    immediate_actions: '',
    treatment: '',
    medications: '',
    contraindications: '',
    warning_signs: '',
  });

  const categories = [
    'Kardiyovasküler Aciller',
    'Solunum Sistemi Acilleri',
    'Nörolojik Aciller',
    'Travma ve Yaralanmalar',
    'Zehirlenmeler',
    'Pediatrik Aciller',
    'Obstetrik ve Jinekolojik Aciller',
    'Psikiyatrik Aciller',
    'Genel Acil Durumlar',
  ];

  useEffect(() => {
    fetchCurrentUserData();
    fetchAlgorithms();
  }, []);

  const fetchCurrentUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      setCurrentUserData(data);
    } catch (error) {
      console.error('Error fetching current user data:', error);
    }
  };

  const fetchAlgorithms = async () => {
    try {
      setLoading(true);
      
      // Check admin access
      if (currentUserData && currentUserData.role !== 'admin') {
        setAlgorithms([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('algorithms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlgorithms(data as Algorithm[] || []);
    } catch (error) {
      console.error('Error fetching algorithms:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      urgency: 'medium',
      description: '',
      symptoms: '',
      immediate_actions: '',
      treatment: '',
      medications: '',
      contraindications: '',
      warning_signs: '',
    });
    setEditingAlgorithm(null);
  };

  const handleSaveAlgorithm = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!formData.title || !formData.category || !formData.description) {
      Alert.alert('Hata', 'Başlık, kategori ve açıklama alanları zorunludur');
      return;
    }

    try {
      const content = {
        description: formData.description,
        symptoms: formData.symptoms.split('\n').filter(s => s.trim()),
        immediate_actions: formData.immediate_actions.split('\n').filter(s => s.trim()),
        treatment: formData.treatment.split('\n').filter(s => s.trim()),
        medications: formData.medications.split('\n').filter(s => s.trim()),
        contraindications: formData.contraindications.split('\n').filter(s => s.trim()),
        warning_signs: formData.warning_signs.split('\n').filter(s => s.trim()),
      };

      if (editingAlgorithm) {
        // Update existing algorithm
        const { error } = await supabase
          .from('algorithms')
          .update({
            title: formData.title,
            category: formData.category,
            urgency: formData.urgency,
            content: content,
            last_updated: new Date().toISOString(),
          })
          .eq('id', editingAlgorithm.id);

        if (error) throw error;
        Alert.alert('Başarılı', 'Algoritma güncellendi!');
      } else {
        // Create new algorithm
        const algorithmId = formData.title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        const { error } = await supabase
          .from('algorithms')
          .insert({
            id: algorithmId,
            title: formData.title,
            category: formData.category,
            urgency: formData.urgency,
            content: content,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        Alert.alert('Başarılı', 'Yeni algoritma eklendi!');
      }

      setShowAddModal(false);
      resetForm();
      fetchAlgorithms();
      
      console.log('✅ Algorithm saved, real-time updates will be triggered automatically');
    } catch (error) {
      console.error('Error saving algorithm:', error);
      Alert.alert('Hata', 'Algoritma kaydedilirken hata oluştu');
    }
  };

  const handleEditAlgorithm = (algorithm: Algorithm) => {
    setEditingAlgorithm(algorithm);
    setFormData({
      title: algorithm.title,
      category: algorithm.category,
      urgency: algorithm.urgency,
      description: algorithm.content.description || '',
      symptoms: Array.isArray(algorithm.content.symptoms) ? algorithm.content.symptoms.join('\n') : '',
      immediate_actions: Array.isArray(algorithm.content.immediate_actions) ? algorithm.content.immediate_actions.join('\n') : '',
      treatment: Array.isArray(algorithm.content.treatment) ? algorithm.content.treatment.join('\n') : '',
      medications: Array.isArray(algorithm.content.medications) ? algorithm.content.medications.join('\n') : '',
      contraindications: Array.isArray(algorithm.content.contraindications) ? algorithm.content.contraindications.join('\n') : '',
      warning_signs: Array.isArray(algorithm.content.warning_signs) ? algorithm.content.warning_signs.join('\n') : '',
    });
    setShowAddModal(true);
  };

  const handleDeleteAlgorithm = (algorithm: Algorithm) => {
    Alert.alert(
      'Algoritmayı Sil',
      `"${algorithm.title}" algoritmasını silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('algorithms')
                .delete()
                .eq('id', algorithm.id);

              if (error) throw error;
              Alert.alert('Başarılı', 'Algoritma silindi');
              fetchAlgorithms();
              
              console.log('✅ Algorithm deleted, real-time updates will be triggered automatically');
            } catch (error) {
              console.error('Error deleting algorithm:', error);
              Alert.alert('Hata', 'Algoritma silinirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#DC2626';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Kritik';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return '';
    }
  };

  const renderAlgorithmItem = ({ item }: { item: Algorithm }) => (
    <View style={styles.algorithmCard}>
      <View style={styles.algorithmHeader}>
        <View style={styles.algorithmInfo}>
          <Text style={styles.algorithmTitle}>{item.title}</Text>
          <Text style={styles.algorithmCategory}>{item.category}</Text>
          <View style={styles.algorithmMeta}>
            <View style={styles.urgencyBadge}>
              <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(item.urgency) }]} />
              <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency) }]}>
                {getUrgencyText(item.urgency)}
              </Text>
            </View>
            <View style={styles.updateInfo}>
              <Clock size={14} color="#9CA3AF" />
              <Text style={styles.lastUpdated}>
                {new Date(item.last_updated).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.algorithmActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditAlgorithm(item)}
          >
            <Edit size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAlgorithm(item)}
          >
            <Trash2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Check admin access
  if (currentUserData && currentUserData.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erişim Reddedildi</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Bu sayfaya sadece adminler erişebilir.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tedavi Algoritmaları</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Algorithms List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Algoritmalar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={algorithms}
          renderItem={renderAlgorithmItem}
          keyExtractor={(item) => item.id}
          style={styles.algorithmsList}
          contentContainerStyle={styles.algorithmsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAlgorithm ? 'Algoritmayı Düzenle' : 'Yeni Algoritma Ekle'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Başlık *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="Algoritma başlığı"
              />
            </View>

            {/* Category */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kategori *</Text>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
                style={styles.picker}
              >
                <Picker.Item label="Kategori seçin" value="" />
                {categories.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>

            {/* Urgency */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Aciliyet Durumu</Text>
              <Picker
                selectedValue={formData.urgency}
                onValueChange={(value) => setFormData({...formData, urgency: value})}
                style={styles.picker}
              >
                <Picker.Item label="Kritik" value="high" />
                <Picker.Item label="Orta" value="medium" />
                <Picker.Item label="Düşük" value="low" />
              </Picker>
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Açıklama *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Algoritma açıklaması"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Symptoms */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Semptomlar</Text>
              <Text style={styles.inputHint}>Her satıra bir semptom yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.symptoms}
                onChangeText={(text) => setFormData({...formData, symptoms: text})}
                placeholder="Göğüs ağrısı&#10;Nefes darlığı&#10;Baş dönmesi"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Immediate Actions */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Acil Müdahaleler</Text>
              <Text style={styles.inputHint}>Her satıra bir müdahale yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.immediate_actions}
                onChangeText={(text) => setFormData({...formData, immediate_actions: text})}
                placeholder="ABC değerlendirmesi yapın&#10;Vital bulguları kontrol edin&#10;IV yol açın"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Treatment */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tedavi</Text>
              <Text style={styles.inputHint}>Her satıra bir tedavi adımı yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.treatment}
                onChangeText={(text) => setFormData({...formData, treatment: text})}
                placeholder="Oksijen desteği verin&#10;Monitörizasyon yapın&#10;İlaç tedavisi başlatın"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Medications */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İlaçlar</Text>
              <Text style={styles.inputHint}>Her satıra bir ilaç ve dozu yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.medications}
                onChangeText={(text) => setFormData({...formData, medications: text})}
                placeholder="Adrenalin 1mg IV&#10;Atropin 0.5mg IV&#10;Sodyum bikarbonat 1mEq/kg"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Contraindications */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kontrendikasyonlar</Text>
              <Text style={styles.inputHint}>Her satıra bir kontrendikasyon yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.contraindications}
                onChangeText={(text) => setFormData({...formData, contraindications: text})}
                placeholder="Bilinen ilaç alerjisi&#10;Gebelik durumu&#10;Böbrek yetmezliği"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Warning Signs */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Uyarı İşaretleri</Text>
              <Text style={styles.inputHint}>Her satıra bir uyarı işareti yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.warning_signs}
                onChangeText={(text) => setFormData({...formData, warning_signs: text})}
                placeholder="Bilinç kaybı&#10;Hipotansiyon&#10;Solunum durması"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAlgorithm}>
              <Text style={styles.saveButtonText}>
                {editingAlgorithm ? 'Güncelle' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  algorithmsList: {
    flex: 1,
  },
  algorithmsContent: {
    padding: 16,
  },
  algorithmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  algorithmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  algorithmInfo: {
    flex: 1,
  },
  algorithmTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  algorithmCategory: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 8,
  },
  algorithmMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  algorithmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#059669',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  picker: {
    height: 50,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});