import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Building, MapPin, FileText, Phone, Mail, ChevronDown, Briefcase, Users, Check, Gift } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/utils';
import RewardedAdModal from '@/components/RewardedAdModal';
import { adService } from '@/lib/adService';

export default function CreateJobPage() {
  const { user } = useAuth();
  const [jobData, setJobData] = useState({
    title: '',
    institution: '',
    city: '',
    branch: '',
    description: '',
    requirements: '',
    contactPerson: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  // Sayfa her odaklandığında erişimi kontrol et
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎬 CreateJob: Page focused, checking access...');
      if (user) {
        checkAccess();
      }
    }, [user])
  );

  // Check if user has access to create jobs
  const checkAccess = () => {
    if (user?.id) {
      console.log('🎬 CreateJob: Regular user, showing ad on every entry');
      // Her girişte reklam göster (24 saat erişim yok)
      setHasAccess(false);
      // Show ad modal immediately
      console.log('🎬 CreateJob: Showing ad modal immediately');
      setShowAdModal(true);
      
      // Arka planda reklamı yükle
      if (!adService.isAdReadyCreateJob()) {
        console.log('⏳ CreateJob: Preloading ad in background...');
        adService.preloadAdCreateJob();
      }
    }
  };

  // Handle ad reward
  const handleAdReward = () => {
    setHasAccess(true);
    setShowAdModal(false);
  };

  const branches = [
    'Doktor',
    'Diş Hekimi',
    'Eczacı',
    'Hemşire',
    'Fizyoterapi ve Rehabilitasyon',
    'Ebe',
    'İlk ve Acil Yardım (Paramedik)',
    'Anestezist',
    'Ameliyathane Hizmetleri',
    'Tıbbi Görüntüleme Teknikleri',
    'Tıbbi Laboratuvar Teknikleri',
    'Diyaliz',
    'Optisyenlik',
    'Odyometri',
    'Radyoterapi',
    'Çocuk Gelişimi',
    'Yaşlı Bakımı',
    'Tıbbi Dokümantasyon ve Sekreterlik',
    'Perfüzyon Teknikleri',
    'Acil Durum ve Afet Yönetimi',
    'Beslenme ve Diyetetik',
  ];

  const turkishCities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
    'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
    'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne',
    'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane',
    'Hakkâri', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu',
    'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya',
    'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu',
    'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
    'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak',
    'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın',
    'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
  ];

  const handleCreateJob = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!hasAccess) {
      Alert.alert('Reklam Gerekli', 'İş ilanı oluşturmak için önce reklamı izlemeniz gerekiyor.');
      return;
    }

    if (!jobData.title || !jobData.institution || !jobData.city || 
        !jobData.branch || !jobData.description || !jobData.contactPerson ||
        !jobData.phone || !jobData.email) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu (*) alanları doldurun');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('job_listings')
        .insert({
          posted_by: user?.id,
          title: jobData.title,
          institution: jobData.institution,
          city: jobData.city,
          branch: jobData.branch,
          description: jobData.description,
          requirements: jobData.requirements,
          contact_person: jobData.contactPerson,
          phone: jobData.phone,
          email: jobData.email,
          is_active: true,
          is_approved: false
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'İş ilanınız başarıyla oluşturuldu! Admin onayından sonra yayınlanacaktır.', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Hata', handleSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlan Ver</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>İş İlanı Bilgileri</Text>
          </View>

          {/* Form Sections */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>📋 Pozisyon Bilgileri</Text>
            
          {/* Job Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>İş Pozisyonu *</Text>
            <View style={styles.inputWrapper}>
              <FileText size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Yoğun Bakım Hemşiresi"
                value={jobData.title}
                onChangeText={(text) => setJobData({...jobData, title: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Institution */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Kurum/Hastane *</Text>
            <View style={styles.inputWrapper}>
              <Building size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Ankara Şehir Hastanesi"
                value={jobData.institution}
                onChangeText={(text) => setJobData({...jobData, institution: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* City */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Şehir *</Text>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.7}
            >
              <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
              <Text style={[
                styles.selectorText,
                !jobData.city && styles.placeholderText
              ]}>
                {jobData.city || 'Şehir seçin'}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Branch */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Branş *</Text>
            <TouchableOpacity 
              style={styles.selectorButton}
              onPress={() => setShowBranchModal(true)}
              activeOpacity={0.7}
            >
              <FileText size={20} color="#9CA3AF" style={styles.inputIcon} />
              <Text style={[
                styles.selectorText,
                !jobData.branch && styles.placeholderText
              ]}>
                {jobData.branch || 'Branş seçin'}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Job Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>İş Tanımı *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="İş pozisyonunun detaylarını açıklayın..."
              value={jobData.description}
              onChangeText={(text) => setJobData({...jobData, description: text})}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Requirements */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Aranan Nitelikler *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Adaylardan beklenen nitelikler ve deneyim..."
              value={jobData.requirements}
              onChangeText={(text) => setJobData({...jobData, requirements: text})}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>📞 İletişim Bilgileri</Text>

          {/* Contact Person */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>İletişim Kişisi *</Text>
            <View style={styles.inputWrapper}>
              <Briefcase size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: İnsan Kaynakları Müdürü"
                value={jobData.contactPerson}
                onChangeText={(text) => setJobData({...jobData, contactPerson: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefon *</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: 0312 123 45 67"
                value={jobData.phone}
                onChangeText={(text) => setJobData({...jobData, phone: text})}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta *</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: ik@hastane.com"
                value={jobData.email}
                onChangeText={(text) => setJobData({...jobData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateJob}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'İlan Oluşturuluyor...' : 'İlanı Yayınla'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Seçin</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {turkishCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.optionItem,
                    jobData.city === city && styles.selectedOption
                  ]}
                  onPress={() => {
                    setJobData({...jobData, city});
                    setShowCityModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    jobData.city === city && styles.selectedOptionText
                  ]}>
                    {city}
                  </Text>
                  {jobData.city === city && (
                    <Check size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Branch Selection Modal */}
      <Modal
        visible={showBranchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Branş Seçin</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {branches.map((branch) => (
                <TouchableOpacity
                  key={branch}
                  style={[
                    styles.optionItem,
                    jobData.branch === branch && styles.selectedOption
                  ]}
                  onPress={() => {
                    setJobData({...jobData, branch});
                    setShowBranchModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    jobData.branch === branch && styles.selectedOptionText
                  ]}>
                    {branch}
                  </Text>
                  {jobData.branch === branch && (
                    <Check size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onCancel={() => {
          setShowAdModal(false);
          router.push('/jobs'); // İş ilanları sayfasına yönlendir
        }}
        onRewardEarned={handleAdReward}
        title="İş İlanı Oluşturma"
        description="Kısa bir reklam izleyerek iş ilanı oluşturma erişimi kazanın!"
        rewardText="İş ilanı oluşturma erişimi"
        adType="createJob"
      />
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
  headerRight: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  progressContainer: {
    marginVertical: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    width: '100%',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  prominentPickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  pickerPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  createButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    maxHeight: 400,
  },
  selectedOption: {
    backgroundColor: '#FEF2F2',
  },
});