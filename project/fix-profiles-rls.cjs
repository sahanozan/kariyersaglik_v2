const https = require('https');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://imqcxaxvjnvhkojyxuyz.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWN4YXh2am52aGtvanl4dXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2OTc2NywiZXhwIjoyMDc0NDQ1NzY3fQ.h6yweQzDbRRkhLUtOdyuEAx288sQ_CsdImVkx-EvQIE';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: 'imqcxaxvjnvhkojyxuyz.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve({ data: data, error: null });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function fixProfilesRLS() {
  console.log('🔧 Fixing profiles table RLS policies...');

  try {
    const profilesPolicySQL = `
      -- Drop all existing policies on profiles table
      DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
      DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON profiles;
      DROP POLICY IF EXISTS "Users can create own profile during registration" ON profiles;
      DROP POLICY IF EXISTS "Allow profile creation during registration" ON profiles;
      DROP POLICY IF EXISTS "Users can insert own profile data" ON profiles;

      -- Create comprehensive policies for profiles

      -- 1. SELECT policy - Users can read their own profile, admins can read all
      CREATE POLICY "Users can read own profile, admins can read all"
        ON profiles
        FOR SELECT
        TO authenticated
        USING (
          -- Users can read their own profile
          (id = auth.uid()) OR
          -- Admins and moderators can read all profiles
          (EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'moderator')
            AND (p.is_blocked = false OR p.is_blocked IS NULL)
          ))
        );

      -- 2. INSERT policy - Users can create their own profile
      CREATE POLICY "Users can create their own profile"
        ON profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (
          -- Users can only create profiles with their own ID
          (id = auth.uid()) AND
          -- Ensure role is set to user by default
          (role = 'user' OR role IS NULL)
        );

      -- 3. UPDATE policy - Users can update their own profile, admins can update any
      CREATE POLICY "Users can update own profile, admins can update any"
        ON profiles
        FOR UPDATE
        TO authenticated
        USING (
          -- Users can update their own profile
          (id = auth.uid()) OR
          -- Admins and moderators can update any profile
          (EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'moderator')
            AND (p.is_blocked = false OR p.is_blocked IS NULL)
          ))
        )
        WITH CHECK (
          -- Users can update their own profile
          (id = auth.uid()) OR
          -- Admins and moderators can update any profile
          (EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'moderator')
            AND (p.is_blocked = false OR p.is_blocked IS NULL)
          ))
        );

      -- 4. DELETE policy - Only admins can delete profiles
      CREATE POLICY "Only admins can delete profiles"
        ON profiles
        FOR DELETE
        TO authenticated
        USING (
          -- Only admins can delete profiles
          (EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
            AND (p.is_blocked = false OR p.is_blocked IS NULL)
          ))
        );
    `;

    const result = await executeSQL(profilesPolicySQL);
    if (result.error) {
      console.error('❌ Error fixing profiles policies:', result.error);
    } else {
      console.log('✅ Profiles RLS policies fixed successfully');
    }

    console.log('🎉 Profiles RLS policy fixes completed!');
    
  } catch (error) {
    console.error('❌ Error during profiles RLS policy fixes:', error);
  }
}

// Run the fixes
fixProfilesRLS();

