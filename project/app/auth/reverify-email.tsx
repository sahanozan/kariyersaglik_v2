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
import { ArrowLeft, Mail, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ReverifyEmailPage() {
  const { token, type } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && type === 'email_change') {
      confirmEmailChange();
    } else {
      setError('Geçersiz e-posta yeniden doğrulama linki');
      setLoading(false);
    }
  }, [token, type]);

  const confirmEmailChange = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token as string,
        type: 'email_change'
      });

      if (error) {
        console.error('Email reverification error:', error);
        setError('E-posta yeniden doğrulanırken bir hata oluştu: ' + error.message);
      } else {
        setSuccess(true);
        // Başarılı doğrulama sonrası ana sayfaya yönlendir
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      }
    } catch (error) {
      console.error('Email reverification error:', error);
      setError('E-posta yeniden doğrulanırken bir hata oluştu');
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

  const handleResendVerification = () => {
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>E-posta yeniden doğrulanıyor...</Text>
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
        <Text style={styles.headerTitle}>E-posta Yeniden Doğrulama</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {success ? (
          <>
            <View style={styles.iconContainer}>
              <CheckCircle size={64} color="#10B981" />
            </View>
            
            <Text style={styles.successTitle}>E-posta Başarıyla Güncellendi!</Text>
            <Text style={styles.successSubtitle}>
              Yeni e-posta adresiniz doğrulandı. Artık bu e-posta adresi ile giriş yapabilirsiniz.
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
            
            <Text style={styles.errorTitle}>E-posta Güncellenemedi</Text>
            <Text style={styles.errorSubtitle}>
              {error || 'E-posta yeniden doğrulama işlemi başarısız oldu.'}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResendVerification}
              >
                <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoToLogin}
              >
                <Text style={styles.secondaryButtonText}>Giriş Sayfasına Git</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <View style={styles.helpIconContainer}>
            <Mail size={20} color="#3B82F6" />
          </View>
          <Text style={styles.helpText}>
            E-posta adresinizi değiştirdiyseniz, yeni e-posta adresinize gelen 
            doğrulama linkine tıklayarak işlemi tamamlayabilirsiniz.
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
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});









