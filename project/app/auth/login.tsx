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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setLoading(false);
      Alert.alert('Giriş Hatası', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('E-posta Gerekli', 'Lütfen önce e-posta adresinizi girin');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) throw error;

      Alert.alert(
        'Şifre Sıfırlama',
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. E-postanızı kontrol edin.',
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      console.error('Error sending reset email:', error);
      Alert.alert('Hata', 'Şifre sıfırlama e-postası gönderilirken hata oluştu');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with curved design */}
      <View style={styles.headerContainer}>
        {/* Curved Red Background */}
        <View style={styles.curvedBackground} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta Adresi"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password Button */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
            </TouchableOpacity>
            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Hesabın yok mu? </Text><TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    position: 'relative',
    height: 300,
    overflow: 'hidden',
  },
  curvedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#EF4444',
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  logoCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    textAlign: 'center',
    lineHeight: 32,
  },
  logoKariyer: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  logoSaglik: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EF4444',
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  registerText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
});