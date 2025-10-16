import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Building, 
  MapPin,
  Stethoscope,
  Phone,
  ChevronDown,
  Check,
  X
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    city: '',
    institution: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { signUp } = useAuth();

  const healthBranches = [
    'Ameliyathane Teknikeri',
    'Anestezi Teknikeri',
    'Beslenme ve Diyetetik',
    'Çocuk Gelişimi Uzmanı',
    'Diyaliz Teknikeri',
    'Diyetisyen',
    'Diş Hekimi',
    'Doktor',
    'Ebe',
    'Eczacı',
    'Fizyoterapi ve Rehabilitasyon',
    'Hemşire',
    'İlk ve Acil Yardım Teknikeri (Paramedik)',
    'Odyolog',
    'Optisyen',
    'Perfüzyon Teknikeri',
    'Radyoterapi Teknikeri',
    'Tıbbi Görüntüleme Teknikeri',
    'Tıbbi Laboratuvar Teknikeri',
    'Tıbbi Sekreter',
    'Yaşlı Bakım Teknikeri',
  ];

  const turkishCities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
    'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
    'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
    'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
    'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
    'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
    'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ',
    'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
  ];

  const handleRegister = async () => {
    console.log('🔄 Register: Starting registration process...');
    
    // Validate required fields
    const requiredFields = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      branch: formData.branch,
      city: formData.city,
      institution: formData.institution.trim(),
      phone: formData.phone.trim()
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('❌ Register: Missing required fields:', missingFields);
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requiredFields.email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    // Password validation - must contain both letters and numbers
    if (formData.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    // Check if password contains both letters and numbers
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    
    if (!hasLetter || !hasNumber) {
      Alert.alert(
        'Şifre Gereksinimleri', 
        'Şifre hem harf hem de sayı içermelidir.\n\nÖrnek: 223015Sahan'
      );
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Hata', 'Kullanım koşullarını kabul etmelisiniz');
      return;
    }

    console.log('📝 Register: Form validation passed');
    setLoading(true);
    
    const userData = {
      first_name: requiredFields.firstName,
      last_name: requiredFields.lastName,
      branch: requiredFields.branch,
      city: requiredFields.city,
      institution: requiredFields.institution,
      phone: requiredFields.phone,
      terms_accepted_at: new Date().toISOString(),
      terms_version: 'v1.0',
    };

    // Normalize email: some Supabase instances reject addresses with +tags.
    let normalizedEmail = requiredFields.email;
    const plusIndex = normalizedEmail.indexOf('+');
    const atIndex = normalizedEmail.indexOf('@');
    if (plusIndex > -1 && atIndex > plusIndex) {
      // remove +tag portion (local+tag -> local)
      normalizedEmail = normalizedEmail.slice(0, plusIndex) + normalizedEmail.slice(atIndex);
      console.log('� Register: Normalized email from', requiredFields.email, 'to', normalizedEmail);
    }

    console.log('�📤 Register: Calling signUp with data:', { 
      email: normalizedEmail, 
      userData: { ...userData, phone: '[PHONE_PROVIDED]' }
    });

    try {
      const { error } = await signUp(normalizedEmail, formData.password, userData);

      if (error) {
        // Keep developer-friendly logs and extract message safely
        console.error('❌ Register: Sign up returned error object:', error);
        const msg = (error && (error.message || String(error))) || 'Kayıt sırasında bilinmeyen bir hata oluştu';
        const code = (error as any).code;

        // Prefer code-based handling when available
        let errorMessage = msg;
        if (code === 'email_address_invalid') {
          errorMessage = 'Geçersiz e-posta adresi. Lütfen e-posta adresinizi kontrol edin ve özel karakterleri (örn. +) kaldırmayı deneyin.';
        } else {
          const lower = msg.toLowerCase();
          if (lower.includes('duplicate') || lower.includes('already')) {
            errorMessage = 'Bu e-posta adresi zaten kullanılıyor';
          } else if (lower.includes('invalid')) {
            errorMessage = 'Geçersiz e-posta adresi veya şifre';
          } else if (lower.includes('weak')) {
            errorMessage = 'Şifre çok zayıf, daha güçlü bir şifre seçin';
          } else if (lower.includes('profil oluşturulurken')) {
            errorMessage = 'Profil bilgileri kaydedilirken hata oluştu. Lütfen tekrar deneyin.';
          }
        }

        Alert.alert('Kayıt Hatası', errorMessage);
      } else {
        console.log('✅ Register: Registration successful');
        Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı! Giriş yapmak için lütfen e-posta adresinizi ve şifrenizi kullanın.', [
          { text: 'Giriş Yap', onPress: () => router.replace('/auth/login') }
        ]);
      }
    } catch (err) {
      // Catch unexpected runtime exceptions (network JSON parse errors, etc.)
      console.error('❌ Register: Unexpected exception during signUp:', err);
      const message = (err && (((err as any).message) || String(err))) || 'Beklenmeyen bir hata oluştu';
      Alert.alert('Kayıt Hatası', message);
    } finally {
      // Ensure loading state is cleared on all code paths
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Kayıt Ol</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Name Inputs */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Ad *</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#EF4444" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ad"
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({...formData, firstName: text})}
                    placeholderTextColor="#EF4444"
                    autoComplete="given-name"
                    textContentType="givenName"
                  />
                </View>
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Soyad *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { paddingLeft: 16 }]}
                    placeholder="Soyad"
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({...formData, lastName: text})}
                    placeholderTextColor="#EF4444"
                    autoComplete="family-name"
                    textContentType="familyName"
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-posta Adresi *</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta Adresi"
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#EF4444"
                />
              </View>
            </View>

            {/* Branch Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Branşınız *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowBranchModal(true)}
                activeOpacity={0.7}
              >
                <Stethoscope size={20} color="#EF4444" style={styles.inputIcon} />
                <Text style={[
                  styles.selectorText,
                  !formData.branch && styles.placeholderText
                ]}>
                  {formData.branch || 'Branşınızı seçin'}
                </Text>
                <ChevronDown size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* City Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Çalıştığınız Şehir *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowCityModal(true)}
                activeOpacity={0.7}
              >
                <MapPin size={20} color="#EF4444" style={styles.inputIcon} />
                <Text style={[
                  styles.selectorText,
                  !formData.city && styles.placeholderText
                ]}>
                  {formData.city || 'Şehir seçin'}
                </Text>
                <ChevronDown size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Institution Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Çalıştığınız Kurum/Hastane *</Text>
              <View style={styles.inputWrapper}>
                <Building size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Çalıştığınız Kurum/Hastane"
                  value={formData.institution}
                  onChangeText={(text) => setFormData({...formData, institution: text})}
                  placeholderTextColor="#EF4444"
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefon Numarası *</Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Telefon Numarası"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  keyboardType="phone-pad"
                  placeholderTextColor="#EF4444"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                />
              </View>
            </View>

            {/* Password Inputs */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şifre *</Text>
              <Text style={styles.passwordHint}>
                Şifre hem harf hem de sayı içermelidir (Örnek: 223015Sahan)
              </Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre (Harf + Sayı)"
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#EF4444"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#EF4444" />
                  ) : (
                    <Eye size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şifre Tekrar *</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre Tekrar"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#EF4444"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#EF4444" />
                  ) : (
                    <Eye size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.termsCheckboxContainer}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Check size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText}>
                  <Text style={styles.termsTextNormal}>Kullanım Koşulları ve Gizlilik Şartlarını okudum ve kabul ediyorum. </Text>
                  <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
                    Koşulları Görüntüle
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton, 
                (!termsAccepted || loading) && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={!termsAccepted || loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>
          </View>
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
                <X size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Şehir ara..."
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <FlatList
              data={turkishCities.filter(city => 
                city.toLowerCase().includes(citySearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    formData.city === item && styles.selectedOption
                  ]}
                  onPress={() => {
                    setFormData({...formData, city: item});
                    setShowCityModal(false);
                    setCitySearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    formData.city === item && styles.selectedOptionText
                  ]}>
                    {item}
                  </Text>
                  {formData.city === item && (
                    <Check size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
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
                <X size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Branş ara..."
                value={branchSearchQuery}
                onChangeText={setBranchSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <FlatList
              data={healthBranches.filter(branch => 
                branch.toLowerCase().includes(branchSearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    formData.branch === item && styles.selectedOption
                  ]}
                  onPress={() => {
                    setFormData({...formData, branch: item});
                    setShowBranchModal(false);
                    setBranchSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    formData.branch === item && styles.selectedOptionText
                  ]}>
                    {item}
                  </Text>
                  {formData.branch === item && (
                    <Check size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <SafeAreaView style={styles.termsModalContainer}>
          <View style={styles.termsModalHeader}>
            <View style={styles.termsModalTitleContainer}>
              <Text style={styles.termsModalTitle}>Kullanım Koşulları</Text>
              <Text style={styles.termsModalSubtitle}>Kariyer Sağlık Platformu</Text>
            </View>
            <TouchableOpacity
              style={styles.termsModalCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.termsModalContent} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.termsModalScrollContent}
          >
            <Text style={styles.termsLastUpdated}>Son Güncelleme: 2025</Text>
            <Text style={styles.termsIntro}>
              Bu uygulamaya kayıt olarak aşağıdaki şartları kabul etmiş olursunuz. Lütfen dikkatlice okuyunuz.
            </Text>
            
            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>1. Genel Bilgiler</Text>
              <Text style={styles.termsSectionText}>
                Kariyer Sağlık, sağlık profesyonelleri ve öğrencileri için geliştirilmiş dijital bir iletişim ve kariyer platformudur.
              </Text>
              <Text style={styles.termsSectionText}>
                Uygulama, kullanıcıların güvenli ve profesyonel bir ortamda etkileşim kurmasını amaçlar.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>2. Kayıt ve Hesap Kullanımı</Text>
              <Text style={styles.termsSectionText}>
                Uygulamayı kullanabilmek için doğru ve güncel bilgilerle kayıt olmanız gerekmektedir.
              </Text>
              <Text style={styles.termsSectionText}>
                Kullanıcı, kendi hesabı üzerinden yapılan tüm işlemlerden sorumludur.
              </Text>
              <Text style={styles.termsSectionText}>
                Başkasının adına hesap açmak, yanlış/yanıltıcı bilgi vermek yasaktır.
              </Text>
              <Text style={styles.termsSectionText}>
                Hesap bilgilerinizin güvenliğini sağlamak sizin sorumluluğunuzdadır.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>3. Kullanıcı Yükümlülükleri</Text>
              <Text style={styles.termsSectionText}>
                Kullanıcılar;
              </Text>
              <Text style={styles.termsSectionText}>
                Uygulama içerisinde paylaşacakları tüm içeriklerden kendileri sorumludur.
              </Text>
              <Text style={styles.termsSectionText}>
                Paylaşımlarında hakaret, şiddet, nefret söylemi, reklam, yanıltıcı bilgi veya yasa dışı içerik bulunduramaz.
              </Text>
              <Text style={styles.termsSectionText}>
                Mesleki etik kurallarına ve kişisel verilerin gizliliğine uymak zorundadır.
              </Text>
              <Text style={styles.termsSectionText}>
                Sağlık bilgisi paylaşırken yanlış yönlendirici veya kanıtsız bilgi vermemelidir.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>4. Mesajlaşma ve İçerik Paylaşımı</Text>
              <Text style={styles.termsSectionText}>
                Kullanıcılar yalnızca profesyonel amaçlarla içerik ve mesaj paylaşabilir.
              </Text>
              <Text style={styles.termsSectionText}>
                Tıbbi tavsiye, teşhis veya tedavi önerisi doğrudan kullanıcılar arasında hukuki bağlayıcılık oluşturmaz.
              </Text>
              <Text style={styles.termsSectionText}>
                Paylaşılan tüm içeriklerden ve doğacak hukuki sonuçlardan kullanıcı sorumludur.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>5. İş İlanları</Text>
              <Text style={styles.termsSectionText}>
                Kullanıcılar ilan oluştururken doğru, eksiksiz ve yasal bilgi vermekle yükümlüdür.
              </Text>
              <Text style={styles.termsSectionText}>
                Yanıltıcı veya sahte ilan oluşturulması durumunda hesap kalıcı olarak silinir.
              </Text>
              <Text style={styles.termsSectionText}>
                Kariyer Sağlık, ilanlarda yer alan bilgilerin doğruluğunu garanti etmez, yalnızca ilanı yayınlayan kişiden sorumluluk talep edilebilir.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>6. Gizlilik ve Veri Koruma</Text>
              <Text style={styles.termsSectionText}>
                Kullanıcı bilgileri (ad, soyad, branş, kurum, e-posta vb.) yalnızca uygulama içi kullanım ve doğrulama amaçlı saklanır.
              </Text>
              <Text style={styles.termsSectionText}>
                Üçüncü kişilerle paylaşılmaz, satılmaz veya reklam amaçlı kullanılmaz.
              </Text>
              <Text style={styles.termsSectionText}>
                İstediğiniz zaman hesabınızı ve verilerinizi silebilirsiniz.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>7. Çevrimdışı İçerikler</Text>
              <Text style={styles.termsSectionText}>
                İlaç prospektüsleri ve tedavi algoritmaları yalnızca bilgilendirme amacıyla sunulur.
              </Text>
              <Text style={styles.termsSectionText}>
                Tıbbi karar verme süreçlerinde tek başına kullanılmamalı, sorumluluk tamamen kullanıcıya aittir.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>8. Sorumluluk Reddi</Text>
              <Text style={styles.termsSectionText}>
                Kariyer Sağlık, kullanıcılar tarafından yapılan paylaşımlardan, iş ilanlarından veya mesajlardan sorumlu değildir.
              </Text>
              <Text style={styles.termsSectionText}>
                Uygulama üzerinden edinilen bilgilerin yanlış kullanımından doğacak hukuki veya tıbbi sonuçlardan uygulama sahibi sorumlu tutulamaz.
              </Text>
              <Text style={styles.termsSectionText}>
                Uygulama "olduğu gibi" sunulmakta olup, hatasız veya kesintisiz çalışacağı garanti edilmez.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>9. Hesap Kapatma</Text>
              <Text style={styles.termsSectionText}>
                Kullanıcı, dilediği zaman ayarlar menüsünden hesabını silebilir.
              </Text>
              <Text style={styles.termsSectionText}>
                Kurallara aykırı davranan kullanıcıların hesapları, bildirim yapılmaksızın kalıcı olarak kapatılabilir.
              </Text>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsSectionTitle}>10. İletişim</Text>
              <Text style={styles.termsSectionText}>
                Her türlü soru, öneri ve şikâyet için bizimle iletişime geçebilirsiniz:
              </Text>
              <Text style={styles.termsContactTitle}>📩 Destek Mail Adresi</Text>
              <Text style={styles.termsContactEmail}>kariyersaglik@outlook.com</Text>
              <Text style={styles.termsContactTitle}>📷 Instagram</Text>
              <Text style={styles.termsContactInstagram}>@kariyer.saglik</Text>
              
              <View style={[styles.termsFooterSection, { marginTop: 20 }]}>
                <Text style={styles.termsFooterText}>
                  📌 Kayıt olarak yukarıdaki kullanım koşullarını ve gizlilik şartlarını okuduğunuzu, anladığınızı ve kabul ettiğinizi onaylamış olursunuz.
                </Text>
              </View>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 16,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  nameRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingRight: 16,
  },
  selectorText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  placeholderText: {
    color: '#EF4444',
    opacity: 0.7,
  },
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
  },
  optionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#EF4444',
    fontWeight: '800',
  },
  // Terms and Conditions Styles
  termsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#EF4444',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsTextNormal: {
    color: '#374151',
  },
  termsLink: {
    color: '#EF4444',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Terms Modal Styles
  termsModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  termsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  termsModalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  termsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  termsModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  termsModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  termsModalContent: {
    flex: 1,
  },
  termsModalScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 60,
  },
  termsLastUpdated: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
  },
  termsIntro: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 26,
    marginBottom: 32,
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  termsSection: {
    marginBottom: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  termsSectionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  termsBold: {
    fontWeight: '700',
    color: '#EF4444',
  },
  termsContactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  termsContactEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  termsContactInstagram: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  termsFooterSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  termsFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    textAlign: 'center',
  },
});