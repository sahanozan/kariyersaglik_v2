import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmailPage() {
  const { token, type } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && type === 'signup') {
      confirmEmail();
    } else {
      setError('Geçersiz e-posta doğrulama linki');
      setLoading(false);
    }
  }, [token, type]);

  const confirmEmail = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token as string,
        type: 'signup'
      });

      if (error) {
        console.error('Email confirmation error:', error);
        setError('E-posta doğrulanırken bir hata oluştu: ' + error.message);
      } else {
        setSuccess(true);
        // Kullanıcıyı otomatik olarak giriş yapmış olarak işaretle
        if (data.user) {
          // Başarılı doğrulama sonrası ana sayfaya yönlendir
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      setError('E-posta doğrulanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/auth/login');
  };

  const handleGoToHome = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>E-posta doğrulanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-posta Doğrulama</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {success ? (
          <>
            <View style={styles.iconContainer}>
              <CheckCircle size={64} color="#10B981" />
            </View>
            
            <Text style={styles.successTitle}>E-posta Başarıyla Doğrulandı!</Text>
            <Text style={styles.successSubtitle}>
              Hesabınız aktif edildi. Artık uygulamayı kullanmaya başlayabilirsiniz.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoToHome}
              >
                <Text style={styles.primaryButtonText}>Ana Sayfaya Git</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoToLogin}
              >
                <Text style={styles.secondaryButtonText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <XCircle size={64} color="#EF4444" />
            </View>
            
            <Text style={styles.errorTitle}>E-posta Doğrulanamadı</Text>
            <Text style={styles.errorSubtitle}>
              {error || 'E-posta doğrulama işlemi başarısız oldu.'}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoToLogin}
              >
                <Text style={styles.primaryButtonText}>Giriş Sayfasına Git</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/auth/register')}
              >
                <Text style={styles.secondaryButtonText}>Tekrar Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Sorun yaşıyorsanız, lütfen e-posta adresinizi kontrol edin veya 
            yeni bir doğrulama e-postası talep edin.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  helpContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
});









