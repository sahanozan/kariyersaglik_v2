import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  profile?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    branch: string;
    city: string;
    institution: string;
    role: 'admin' | 'moderator' | 'user';
    is_blocked: boolean;
    avatar_url: string | null;
    about: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
    last_login: string | null;
  };
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return user as AuthUser;
    }

    return {
      ...user,
      profile
    } as AuthUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    // Update last login
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  userData: {
    first_name: string;
    last_name: string;
    branch: string;
    city: string;
    institution: string;
    phone?: string;
  }
) => {
  try {
    console.log('🔄 lib/auth: Starting signUpWithEmail...');
    console.log('📋 lib/auth: User data:', {
      email: email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      branch: userData.branch,
      city: userData.city,
      institution: userData.institution,
      phone: userData.phone || 'not provided'
    });
    
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
          phone: userData.phone,
        }
      }
    });

    if (error) {
      console.error('❌ lib/auth: Auth signup error:', error);
      return { user: null, error };
    }

    console.log('✅ lib/auth: Auth user created successfully');
    console.log('ℹ️ lib/auth: Profile will be created automatically by database trigger');
    
    // Wait for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { user: data.user, error: null };
  } catch (error) {
    console.error('❌ lib/auth: Unexpected error in signUpWithEmail:', error);
    return { user: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://reset-password',
    });
    return { error };
  } catch (error) {
    return { error };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  } catch (error) {
    return { error };
  }
};

export const updateProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
};