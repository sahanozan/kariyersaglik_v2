import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';

export default function PrivacyPolicyPage() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <Shield size={32} color="#EF4444" />
          </View>
          <Text style={styles.title}>Gizlilik Politikası</Text>
          <Text style={styles.lastUpdated}>Yürürlük Tarihi: 27 Ağustos 2025</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.introText}>
            Kariyer Sağlık olarak kişisel verilerinizin güvenliği bizim için en önemli önceliklerden biridir. Bu Gizlilik Politikası, mobil uygulamamızı kullanırken hangi verilerin toplandığını, nasıl işlendiğini ve korunduğunu açıklamaktadır.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>1. Toplanan Bilgiler</Text>
          <Text style={styles.sectionText}>
            Uygulamamız üzerinden sizden doğrudan veya dolaylı olarak aşağıdaki veriler toplanabilir:
            {'\n\n'}• Kayıt Bilgileri: Ad, soyad, e-posta adresi, şifre.
            {'\n'}• Kullanım Verileri: Uygulama içi gezinme, yapılan işlemler, cihaz bilgileri (işletim sistemi, sürüm).
            {'\n'}• İletişim: Destek talepleriniz ve geri bildirimleriniz.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>2. Verilerin Kullanım Amaçları</Text>
          <Text style={styles.sectionText}>
            Toplanan kişisel veriler aşağıdaki amaçlarla kullanılmaktadır:
            {'\n\n'}• Hesap oluşturma ve kullanıcı doğrulama işlemleri,
            {'\n'}• Uygulamanın güvenliğinin sağlanması,
            {'\n'}• Hizmet kalitesini artırmak için analizler,
            {'\n'}• Kullanıcılara bildirim ve güncellemeler göndermek,
            {'\n'}• Yasal yükümlülüklerin yerine getirilmesi.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>3. Verilerin Paylaşımı</Text>
          <Text style={styles.sectionText}>
            Kişisel verileriniz:
            {'\n\n'}• Üçüncü kişilerle pazarlama amacıyla paylaşılmaz.
            {'\n'}• Sadece yasal zorunluluklar veya yetkili kurum talepleri doğrultusunda paylaşılabilir.
            {'\n'}• Geliştirme ve barındırma hizmetleri için gerekli durumlarda güvenilir hizmet sağlayıcılarla sınırlı şekilde paylaşılabilir.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>4. Veri Güvenliği</Text>
          <Text style={styles.sectionText}>
            • Verileriniz güvenli sunucularda saklanır.
            {'\n'}• Şifreler geri döndürülemeyecek şekilde hash algoritmalarıyla korunur.
            {'\n'}• Uygulama, güncel güvenlik standartlarına (SSL, HTTPS vb.) uygun şekilde çalışır.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>5. Kullanıcı Hakları</Text>
          <Text style={styles.sectionText}>
            Kullanıcı olarak;
            {'\n\n'}• Verilerinize erişim,
            {'\n'}• Verilerinizin düzeltilmesini veya silinmesini talep etme,
            {'\n'}• Hesabınızı kalıcı olarak silme,
            {'\n'}• Veri işlenmesine ilişkin itirazda bulunma haklarına sahipsiniz.
            {'\n\n'}Bu taleplerinizi bize aşağıdaki iletişim adresinden iletebilirsiniz.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>6. Çocukların Gizliliği</Text>
          <Text style={styles.sectionText}>
            Uygulamamız 18 yaş altındaki kullanıcılar için tasarlanmamıştır. 18 yaş altındaki kişilerden bilerek veri toplamayız.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>7. Değişiklikler</Text>
          <Text style={styles.sectionText}>
            Gizlilik Politikamız zaman zaman güncellenebilir. Güncel versiyon her zaman uygulama içinde erişilebilir durumda olacaktır.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>8. İletişim</Text>
          <Text style={styles.sectionText}>
            Her türlü soru ve talebiniz için bize ulaşabilirsiniz:
            {'\n\n'}📧 kariyersaglik@outlook.com
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bu gizlilik politikası, uygulamanın tüm kullanıcıları için geçerlidir ve önceden haber verilmeksizin güncellenebilir.
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  introText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});