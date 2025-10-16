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
import { ArrowLeft, FileText } from 'lucide-react-native';

export default function TermsOfServicePage() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanım Şartları</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <FileText size={32} color="#EF4444" />
          </View>
          <Text style={styles.title}>Kullanım Şartları</Text>
          <Text style={styles.lastUpdated}>Yürürlük Tarihi: 27 Ağustos 2025</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.introText}>
            Bu Kullanım Şartları ("Şartlar"), Kariyer Sağlık mobil uygulamasını ("Uygulama") kullanırken uyulması gereken kuralları ve tarafların haklarını düzenlemektedir. Uygulamayı indirip kullanmaya başladığınızda bu şartları kabul etmiş sayılırsınız.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>1. Hizmetin Tanımı</Text>
          <Text style={styles.sectionText}>
            Kariyer Sağlık, kullanıcıların sağlık kariyerlerine yönelik bilgi, iletişim ve hizmetlerden faydalanmasını sağlayan bir mobil platformdur.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>2. Kullanıcı Yükümlülükleri</Text>
          <Text style={styles.sectionText}>
            • Hesap oluştururken doğru, güncel ve eksiksiz bilgi vermek,
            {'\n\n'}• Hesap güvenliğini sağlamak (şifreyi üçüncü kişilerle paylaşmamak),
            {'\n\n'}• Uygulamayı yalnızca yasalara uygun ve iyi niyetli şekilde kullanmak,
            {'\n\n'}• Uygulama üzerinden paylaşılan içeriklerden bizzat sorumlu olmak.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>3. Yasaklı Kullanımlar</Text>
          <Text style={styles.sectionText}>
            Aşağıdaki faaliyetler kesinlikle yasaktır:
            {'\n\n'}• Başka bir kullanıcının hesabına izinsiz erişim,
            {'\n\n'}• Virüs, zararlı yazılım veya spam içerik yaymak,
            {'\n\n'}• Uygulamanın işleyişine müdahale edecek girişimlerde bulunmak,
            {'\n\n'}• Hakaret, tehdit, taciz, yanıltıcı veya yasa dışı içerik paylaşmak.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>4. Fikri Mülkiyet Hakları</Text>
          <Text style={styles.sectionText}>
            Kariyer Sağlık uygulamasına ait tüm marka, logo, tasarım, yazılım ve içerikler Kariyer Sağlık'a aittir.
            {'\n\n'}Kullanıcılar, bu içerikleri izinsiz kopyalayamaz, dağıtamaz veya ticari amaçla kullanamaz.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>5. Sorumluluk Reddi</Text>
          <Text style={styles.sectionText}>
            Uygulamada sunulan bilgiler yalnızca bilgilendirme amaçlıdır, tıbbi tavsiye yerine geçmez.
            {'\n\n'}Kullanıcılar, kendi sağlık kararlarından kendileri sorumludur.
            {'\n\n'}Uygulamanın kesintisiz ve hatasız çalışacağı garanti edilmez.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>6. Hesap Sonlandırma</Text>
          <Text style={styles.sectionText}>
            Kariyer Sağlık, Şartlara aykırı davranışlar tespit edildiğinde kullanıcının hesabını geçici veya kalıcı olarak askıya alabilir.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>7. Değişiklikler</Text>
          <Text style={styles.sectionText}>
            Kariyer Sağlık, Şartları güncelleme hakkını saklı tutar. Güncellenmiş sürüm uygulama içinde erişilebilir olacaktır.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>8. Uygulanacak Hukuk</Text>
          <Text style={styles.sectionText}>
            Bu Şartlar, Türkiye Cumhuriyeti yasalarına tabidir.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>9. İletişim</Text>
          <Text style={styles.sectionText}>
            Her türlü soru ve talebiniz için bize ulaşabilirsiniz:
            {'\n\n'}📧 kariyersaglik@outlook.com
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bu Kullanım Şartları, uygulamanın tüm kullanıcıları için geçerlidir ve önceden haber verilmeksizin güncellenebilir.
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