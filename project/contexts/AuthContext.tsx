import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  branch: string;
  city: string;
  institution: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
  updated_at: string;
  is_blocked: boolean;
  last_login: string | null;
  about: string | null;
  avatar_url: string | null;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  terms_ip_address?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        console.log('🔄 AuthContext: Checking for existing session...');
        
        // For mobile, ensure AsyncStorage is ready
        if (Platform.OS !== 'web') {
          try {
            // Wait a bit longer for AsyncStorage to be ready on mobile
            await new Promise(resolve => setTimeout(resolve, 500));
            const storedSession = await AsyncStorage.getItem('kariyer-saglik-auth');
            console.log('📱 AuthContext: AsyncStorage check:', storedSession ? 'Token found' : 'No token');
          } catch (storageError) {
            console.warn('⚠️ AuthContext: AsyncStorage not ready:', storageError);
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Session error:', error);
          
          // Check if it's a refresh token error and clear storage
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log('🧹 AuthContext: Clearing invalid refresh token...');
            
            // Clear storage based on platform
            if (Platform.OS !== 'web') {
              try {
                await AsyncStorage.removeItem('kariyer-saglik-auth');
                await AsyncStorage.removeItem('supabase.auth.token');
              } catch (storageError) {
                console.warn('⚠️ AuthContext: Error clearing AsyncStorage:', storageError);
              }
            } else {
              // Clear web localStorage
              try {
                localStorage.removeItem('sb-zoxhxtebaamvzeohhwjr-auth-token');
                localStorage.removeItem('supabase.auth.token');
              } catch (storageError) {
                console.warn('⚠️ AuthContext: Error clearing localStorage:', storageError);
              }
            }
          }
          
          // Clear any stale tokens on session error
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        // If we have a session but no user, it means the session is invalid
        if (session && !session.user) {
          console.log('⚠️ AuthContext: Invalid session detected, clearing tokens...');
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }
        console.log('✅ AuthContext: Session status:', session ? 'Active session found' : 'No session');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('👤 AuthContext: User authenticated, fetching profile...');
            await fetchProfile(session.user.id);
          } else {
            console.log('❌ AuthContext: No active session');
            setLoading(false);
          }
          setSessionChecked(true);
        }
      } catch (error) {
        console.error('❌ AuthContext: Error getting initial session:', error);
        // Clear any stale tokens on unexpected error
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn('⚠️ AuthContext: Error clearing tokens:', signOutError);
        }
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setSessionChecked(true);
        }
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    // Initial session check
    getInitialSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthContext: Auth state change -', event, session ? 'Session active' : 'No session');
      
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 AuthContext: User authenticated, fetching profile...');
        await fetchProfile(session.user.id);
      } else {
        console.log('❌ AuthContext: User signed out or session expired');
        setProfile(null);
        setLoading(false);
      }
      
      if (!sessionChecked) {
        setSessionChecked(true);
      }
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔄 AuthContext: Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthContext: Error fetching profile:', error);
        
        // If profile doesn't exist (PGRST116), create a default profile
        if (error.code === 'PGRST116') {
          console.log('📝 AuthContext: Profile not found, creating default profile...');
          await createDefaultProfile(userId);
        } else {
          setProfile(null);
        }
      } else {
        console.log('✅ AuthContext: Profile fetched successfully');
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('🔄 AuthContext: Creating default profile for user:', userId);
      
      // Get user data from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ AuthContext: Error getting user data:', userError);
        return;
      }

      const defaultProfile = {
        id: userId,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        branch: user.user_metadata?.branch || '',
        city: user.user_metadata?.city || '',
        institution: user.user_metadata?.institution || '',
        role: 'user' as const,
        is_blocked: false,
        about: null,
        avatar_url: null,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) {
        console.error('❌ AuthContext: Error creating profile:', error);
        setProfile(null);
      } else {
        console.log('✅ AuthContext: Default profile created successfully');
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error in createDefaultProfile:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 AuthContext: Attempting sign in...');
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ AuthContext: Sign in error:', error);
        setLoading(false);
        return { error };
      }
      
      console.log('✅ AuthContext: Sign in successful');
      
      // Update last_login timestamp
      if (data.user) {
        try {
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (updateError) {
          console.warn('⚠️ AuthContext: Could not update last_login:', updateError);
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Sign in error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      console.log('🔄 AuthContext: Starting sign up process...');
      console.log('📋 AuthContext: User data received:', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        branch: userData.branch,
        city: userData.city,
        institution: userData.institution,
        phone: (userData as any).phone ? '[PROVIDED]' : 'null'
      });
      setLoading(true);
      
      // Validate required fields
      if (!userData.first_name || !userData.last_name || !userData.branch || 
          !userData.city || !userData.institution || !(userData as any).phone) {
        console.error('❌ AuthContext: Missing required user data');
        console.error('❌ AuthContext: Missing fields:', {
          first_name: !userData.first_name,
          last_name: !userData.last_name,
          branch: !userData.branch,
          city: !userData.city,
          institution: !userData.institution,
          phone: !(userData as any).phone,
        });
        setLoading(false);
        return { error: new Error('Eksik kullanıcı bilgileri') };
      }

      console.log('📧 AuthContext: Creating auth user...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            branch: userData.branch,
            city: userData.city,
            institution: userData.institution,
            phone: (userData as any).phone,
            terms_accepted_at: userData.terms_accepted_at,
            terms_version: userData.terms_version,
          }
        }
      });

      if (error) {
        console.error('❌ AuthContext: Auth sign up error:', error);
        setLoading(false);
        return { error };
      }

      console.log('✅ AuthContext: Auth user created successfully');
      console.log('ℹ️ AuthContext: Profile will be created automatically by database trigger');
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to fetch the created profile
      if (data.user) {
        try {
          console.log('🔄 AuthContext: Fetching created profile...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('❌ AuthContext: Error fetching profile:', profileError);
            // Don't fail the registration, the profile might be created by trigger
          } else {
            console.log('✅ AuthContext: Profile fetched successfully:', profileData);
            setProfile(profileData as Profile);
          }
        } catch (fetchError) {
          console.warn('⚠️ AuthContext: Could not fetch profile immediately:', fetchError);
          // This is not critical, the profile will be available on next login
        }
      }

      console.log('✅ AuthContext: Sign up process completed');
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext: Unexpected sign up error:', error);
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      return { error: new Error(`Kayıt sırasında beklenmeyen hata: ${errorMessage}`) };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 AuthContext: Signing out user...');
      await supabase.auth.signOut();
      console.log('✅ AuthContext: Sign out successful');
    } catch (error) {
      console.error('❌ AuthContext: Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const value = {
    session,
    user,
    profile,
    loading: loading || !sessionChecked || !isInitialized,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}