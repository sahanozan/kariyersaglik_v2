const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://imqcxaxvjnvhkojyxuyz.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWN4YXh2am52aGtvanl4dXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2OTc2NywiZXhwIjoyMDc0NDQ1NzY3fQ.h6yweQzDbRRkhLUtOdyuEAx288sQ_CsdImVkx-EvQIE';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixRLSPolicies() {
  console.log('🔧 Starting RLS policy fixes...');

  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Since we can't execute raw SQL directly, let's check current policies
    console.log('📋 Checking current RLS policies...');
    
    // Test posts table access
    console.log('🔍 Testing posts table access...');
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, title, user_id, deleted_at')
      .limit(1);
    
    if (postsError) {
      console.error('❌ Posts table access error:', postsError);
    } else {
      console.log('✅ Posts table accessible');
    }

    // Test event_registrations table access
    console.log('🔍 Testing event_registrations table access...');
    const { data: regData, error: regError } = await supabase
      .from('event_registrations')
      .select('id, event_id, user_id, status')
      .limit(1);
    
    if (regError) {
      console.error('❌ Event registrations table access error:', regError);
    } else {
      console.log('✅ Event registrations table accessible');
    }

    // Test admin user access
    console.log('🔍 Testing admin user access...');
    const { data: adminData, error: adminError } = await supabase
      .from('profiles')
      .select('id, role, is_blocked')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminError) {
      console.error('❌ Admin user access error:', adminError);
    } else {
      console.log('✅ Admin user data accessible:', adminData);
    }

    console.log('📝 RLS policies need to be fixed via Supabase Dashboard');
    console.log('🔗 Please run the SQL commands in Supabase Dashboard SQL Editor');
    
  } catch (error) {
    console.error('❌ Error during RLS policy fixes:', error);
  }
}

// Run the fixes
fixRLSPolicies();

