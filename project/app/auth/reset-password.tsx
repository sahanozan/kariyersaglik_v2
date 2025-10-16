import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    if (token) {
      // Token'ı kontrol et
      checkTokenValidity();
    } else {
      Alert.alert('Hata', 'Geçersiz şifre sıfırlama linki');
      router.replace('/auth/login');
    }
  }, [token]);

  const checkTokenValidity = async () => {
    try {
      setCheckingToken(true);
      // Token'ın geçerli olup olmadığını kontrol et
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token as string,
        type: 'recovery'
      });

      if (error) {
        console.error('Token validation error:', error);
        Alert.alert('Hata', 'Geçersiz veya süresi dolmuş şifre sıfırlama linki');
        router.replace('/auth/login');
      } else {
        setIsValidToken(true);
      }
    } catch (error) {
      console.error('Token check error:', error);
      Alert.alert('Hata', 'Şifre sıfırlama linki kontrol edilemedi');
      router.replace('/auth/login');
    } finally {
      setCheckingToken(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        Alert.alert('Hata', 'Şifre sıfırlanırken bir hata oluştu: ' + error.message);
      } else {
        Alert.alert(
          'Başarılı',
          'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Hata', 'Şifre sıfırlanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Şifre sıfırlama linki kontrol ediliyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isValidToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Geçersiz şifre sıfırlama linki</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Giriş Sayfasına Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Şifre Sıfırla</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lock size={48} color="#EF4444" />
          </View>

          <Text style={styles.title}>Yeni Şifrenizi Belirleyin</Text>
          <Text style={styles.subtitle}>
            Güvenli bir şifre oluşturun ve tekrar girin
          </Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Yeni şifrenizi girin"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Şifre Tekrar</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Şifrenizi tekrar girin"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.resetButtonText}>Şifreyi Sıfırla</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.backToLoginText}>Giriş sayfasına dön</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 12,
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resetButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    color: '#6B7280',
    fontSize: 14,
  },
});









