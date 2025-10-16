import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Try to get from environment variables first, then fallback to Constants
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 'https://imqcxaxvjnvhkojyxuyz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWN4YXh2am52aGtvanl4dXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Njk3NjcsImV4cCI6MjA3NDQ0NTc2N30.K4LABVrrHeaY0t7ORdFst-d9F7m4WA-vibcq_uhZgok';

// Declare supabase client at top level
let supabase: ReturnType<typeof createClient<Database>>;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration is missing!');
  console.error('Please check your .env file for:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Current values:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey ? '[HIDDEN]' : 'undefined' });
  // Create a dummy client to prevent crashes during development
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
} else {
  console.log('✅ Supabase client initialized successfully');
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      debug: true,
      storageKey: 'kariyer-saglik-auth',
      storage: Platform.OS === 'web' ? 
        (typeof window !== 'undefined' ? window.localStorage : undefined) : 
        AsyncStorage,
    },
    global: {
      headers: {
        'X-Client-Info': 'expo-app',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// Export the supabase client
export { supabase };