import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from 'react-native';

export default function IndexPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('🔄 IndexPage: Auth state -', user ? 'User authenticated' : 'No user', 'Loading:', loading);
    
    // Add a longer delay for mobile to ensure AsyncStorage and session are ready
    const checkAuth = async () => {
      if (Platform.OS !== 'web') {
        // Wait longer for mobile session restoration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!loading) {
        if (user) {
          console.log('✅ IndexPage: User found, redirecting to main app...');
          router.replace('/(tabs)');
        } else {
          console.log('❌ IndexPage: No user session, redirecting to login...');
          router.replace('/auth/login');
        }
      }
    };
    
    checkAuth();
  }, [user, loading]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Oturum kontrol ediliyor...</Text>
      </View>
    );
  }

  // Return empty view while redirecting
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});