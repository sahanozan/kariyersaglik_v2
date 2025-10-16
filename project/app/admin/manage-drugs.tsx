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
import { ArrowLeft, Plus, Pill, Trash2, CreditCard as Edit } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';

interface Drug {
  id: string;
  name: string;
  active_ingredient: string;
  category: string;
  company: string;
  content: any;
  created_at: string;
}

export default function ManageDrugsPage() {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    active_ingredient: '',
    category: '',
    company: '',
    description: '',
    indications: '',
    dosage_adult: '',
    dosage_pediatric: '',
    contraindications: '',
    warnings: '',
    side_effects: '',
    interactions: '',
  });

  const categories = [
    'Analjezikler',
    'Antibiyotikler',
    'Antihistaminikler',
    'Antihipertansifler',
    'Bronkodilatörler',
    'Kardiyovasküler İlaçlar',
    'Sedatifler',
    'Antiemetikler',
    'Kortikosteroidler',
    'Acil İlaçlar',
    'Diğer',
  ];

  useEffect(() => {
    fetchCurrentUserData();
    fetchDrugs();
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

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      
      // Check admin access
      if (currentUserData && currentUserData.role !== 'admin') {
        setDrugs([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrugs(data as Drug[] || []);
    } catch (error) {
      console.error('Error fetching drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      active_ingredient: '',
      category: '',
      company: '',
      description: '',
      indications: '',
      dosage_adult: '',
      dosage_pediatric: '',
      contraindications: '',
      warnings: '',
      side_effects: '',
      interactions: '',
    });
    setEditingDrug(null);
  };

  const handleSaveDrug = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!formData.name || !formData.active_ingredient || !formData.category || !formData.company) {
      Alert.alert('Hata', 'İlaç adı, etken madde, kategori ve firma alanları zorunludur');
      return;
    }

    try {
      const content = {
        description: formData.description,
        indications: formData.indications.split('\n').filter(s => s.trim()),
        dosage: {
          adult: formData.dosage_adult,
          pediatric: formData.dosage_pediatric,
        },
        contraindications: formData.contraindications.split('\n').filter(s => s.trim()),
        warnings: formData.warnings.split('\n').filter(s => s.trim()),
        side_effects: formData.side_effects.split('\n').filter(s => s.trim()),
        interactions: formData.interactions.split('\n').filter(s => s.trim()),
      };

      if (editingDrug) {
        // Update existing drug
        const { error } = await supabase
          .from('drugs')
          .update({
            name: formData.name,
            active_ingredient: formData.active_ingredient,
            category: formData.category,
            company: formData.company,
            content: content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDrug.id);

        if (error) throw error;
        Alert.alert('Başarılı', 'İlaç güncellendi!');
      } else {
        // Create new drug
        const drugId = formData.name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        const { error } = await supabase
          .from('drugs')
          .insert({
            id: drugId,
            name: formData.name,
            active_ingredient: formData.active_ingredient,
            category: formData.category,
            company: formData.company,
            content: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        Alert.alert('Başarılı', 'Yeni ilaç eklendi!');
      }

      setShowAddModal(false);
      resetForm();
      fetchDrugs();
      
      console.log('✅ Drug saved, real-time updates will be triggered automatically');
    } catch (error) {
      console.error('Error saving drug:', error);
      Alert.alert('Hata', 'İlaç kaydedilirken hata oluştu');
    }
  };

  const handleEditDrug = (drug: Drug) => {
    setEditingDrug(drug);
    setFormData({
      name: drug.name,
      active_ingredient: drug.active_ingredient,
      category: drug.category,
      company: drug.company,
      description: drug.content.description || '',
      indications: Array.isArray(drug.content.indications) ? drug.content.indications.join('\n') : '',
      dosage_adult: drug.content.dosage?.adult || '',
      dosage_pediatric: drug.content.dosage?.pediatric || '',
      contraindications: Array.isArray(drug.content.contraindications) ? drug.content.contraindications.join('\n') : '',
      warnings: Array.isArray(drug.content.warnings) ? drug.content.warnings.join('\n') : '',
      side_effects: Array.isArray(drug.content.side_effects) ? drug.content.side_effects.join('\n') : '',
      interactions: Array.isArray(drug.content.interactions) ? drug.content.interactions.join('\n') : '',
    });
    setShowAddModal(true);
  };

  const handleDeleteDrug = (drug: Drug) => {
    Alert.alert(
      'İlacı Sil',
      `"${drug.name}" ilacını silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('drugs')
                .delete()
                .eq('id', drug.id);

              if (error) throw error;
              Alert.alert('Başarılı', 'İlaç silindi');
              fetchDrugs();
              
              console.log('✅ Drug deleted, real-time updates will be triggered automatically');
            } catch (error) {
              console.error('Error deleting drug:', error);
              Alert.alert('Hata', 'İlaç silinirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const renderDrugItem = ({ item }: { item: Drug }) => (
    <View style={styles.drugCard}>
      <View style={styles.drugHeader}>
        <View style={styles.drugInfo}>
          <Text style={styles.drugName}>{item.name}</Text>
          <Text style={styles.activeIngredient}>{item.active_ingredient}</Text>
          <Text style={styles.drugCategory}>{item.category}</Text>
          <Text style={styles.drugCompany}>{item.company}</Text>
        </View>
        <View style={styles.drugActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditDrug(item)}
          >
            <Edit size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteDrug(item)}
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
        <Text style={styles.headerTitle}>İlaç Prospektüsleri</Text>
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

      {/* Drugs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>İlaçlar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={drugs}
          renderItem={renderDrugItem}
          keyExtractor={(item) => item.id}
          style={styles.drugsList}
          contentContainerStyle={styles.drugsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingDrug ? 'İlacı Düzenle' : 'Yeni İlaç Ekle'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İlaç Adı *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Örn: Aspirin"
              />
            </View>

            {/* Active Ingredient */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Etken Madde *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.active_ingredient}
                onChangeText={(text) => setFormData({...formData, active_ingredient: text})}
                placeholder="Örn: Asetilsalisilik Asit"
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

            {/* Company */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Üretici Firma *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.company}
                onChangeText={(text) => setFormData({...formData, company: text})}
                placeholder="Örn: Bayer"
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="İlaç hakkında genel bilgi"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Indications */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Endikasyonlar</Text>
              <Text style={styles.inputHint}>Her satıra bir endikasyon yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.indications}
                onChangeText={(text) => setFormData({...formData, indications: text})}
                placeholder="Ağrı kesici&#10;Ateş düşürücü&#10;Antiinflamatuar"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Adult Dosage */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yetişkin Dozu</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.dosage_adult}
                onChangeText={(text) => setFormData({...formData, dosage_adult: text})}
                placeholder="Örn: 500mg günde 3 kez"
              />
            </View>

            {/* Pediatric Dosage */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pediatrik Doz</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.dosage_pediatric}
                onChangeText={(text) => setFormData({...formData, dosage_pediatric: text})}
                placeholder="Örn: 10-15mg/kg günde 3 kez"
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
                placeholder="Aspirin alerjisi&#10;Aktif kanama&#10;Ciddi böbrek yetmezliği"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Warnings */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Uyarılar</Text>
              <Text style={styles.inputHint}>Her satıra bir uyarı yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.warnings}
                onChangeText={(text) => setFormData({...formData, warnings: text})}
                placeholder="Gebelikte dikkatli kullanın&#10;Mide koruyucu ile birlikte alın&#10;Kanama riskini artırabilir"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Side Effects */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yan Etkiler</Text>
              <Text style={styles.inputHint}>Her satıra bir yan etki yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.side_effects}
                onChangeText={(text) => setFormData({...formData, side_effects: text})}
                placeholder="Mide bulantısı&#10;Baş ağrısı&#10;Mide irritasyonu"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Interactions */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İlaç Etkileşimleri</Text>
              <Text style={styles.inputHint}>Her satıra bir etkileşim yazın</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.interactions}
                onChangeText={(text) => setFormData({...formData, interactions: text})}
                placeholder="Warfarin ile etkileşim&#10;ACE inhibitörleri ile dikkat&#10;Metotreksat ile birlikte kullanmayın"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveDrug}>
              <Text style={styles.saveButtonText}>
                {editingDrug ? 'Güncelle' : 'Kaydet'}
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
    backgroundColor: '#7C3AED',
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
  drugsList: {
    flex: 1,
  },
  drugsContent: {
    padding: 16,
  },
  drugCard: {
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
  drugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  drugInfo: {
    flex: 1,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activeIngredient: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 4,
  },
  drugCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  drugCompany: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  drugActions: {
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
    backgroundColor: '#7C3AED',
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
    backgroundColor: '#7C3AED',
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