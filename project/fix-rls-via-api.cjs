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

async function fixRLSPolicies() {
  console.log('🔧 Starting RLS policy fixes via API...');

  try {
    // 1. Fix posts table RLS policies
    console.log('📝 Fixing posts table RLS policies...');
    
    const postsPolicySQL = `
      -- Drop all existing policies on posts table
      DROP POLICY IF EXISTS "Users can update posts" ON posts;
      DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
      DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
      DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
      DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
      DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;
      DROP POLICY IF EXISTS "Anyone can read non-deleted posts" ON posts;
      DROP POLICY IF EXISTS "Users can create their own posts" ON posts;

      -- Create comprehensive policies

      -- 1. INSERT policy - Users can create their own posts
      CREATE POLICY "Users can create their own posts"
        ON posts
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

      -- 2. SELECT policy - Anyone can read non-deleted posts
      CREATE POLICY "Anyone can read non-deleted posts"
        ON posts
        FOR SELECT
        TO authenticated
        USING (deleted_at IS NULL);

      -- 3. UPDATE policy - Users can update own posts, admins can update any
      CREATE POLICY "Users can update own posts, admins can update any"
        ON posts
        FOR UPDATE
        TO authenticated
        USING (
          -- Users can update their own posts
          (auth.uid() = user_id) OR 
          -- Admins and moderators can update any post
          (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        )
        WITH CHECK (
          -- Users can update their own posts
          (auth.uid() = user_id) OR 
          -- Admins and moderators can update any post
          (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        );

      -- 4. DELETE policy - Users can delete own posts, admins can delete any
      CREATE POLICY "Users can delete own posts, admins can delete any"
        ON posts
        FOR DELETE
        TO authenticated
        USING (
          -- Users can delete their own posts
          (auth.uid() = user_id) OR 
          -- Admins and moderators can delete any post
          (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        );
    `;

    const postsResult = await executeSQL(postsPolicySQL);
    if (postsResult.error) {
      console.error('❌ Error fixing posts policies:', postsResult.error);
    } else {
      console.log('✅ Posts RLS policies fixed successfully');
    }

    // 2. Fix event_registrations table RLS policies
    console.log('📝 Fixing event_registrations table RLS policies...');
    
    const eventRegPolicySQL = `
      -- Drop all existing policies on event_registrations table
      DROP POLICY IF EXISTS "Users can read own registrations" ON event_registrations;
      DROP POLICY IF EXISTS "Event creators can read registrations" ON event_registrations;
      DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;
      DROP POLICY IF EXISTS "Event creators can update registrations" ON event_registrations;
      DROP POLICY IF EXISTS "Admin can manage all registrations" ON event_registrations;

      -- Create comprehensive policies for event_registrations

      -- 1. SELECT policy - Users can read their own registrations and event creators can read all registrations for their events
      CREATE POLICY "Users can read own registrations and event creators can read all"
        ON event_registrations
        FOR SELECT
        TO authenticated
        USING (
          -- Users can read their own registrations
          (user_id = auth.uid()) OR
          -- Event creators can read all registrations for their events
          (EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_registrations.event_id
            AND events.user_id = auth.uid()
          )) OR
          -- Admins and moderators can read all registrations
          (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        );

      -- 2. INSERT policy - Users can create registrations for themselves
      CREATE POLICY "Users can create their own registrations"
        ON event_registrations
        FOR INSERT
        TO authenticated
        WITH CHECK (
          -- Users can only create registrations for themselves
          (user_id = auth.uid()) AND
          -- Ensure the event exists and is active
          (EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_id
            AND events.is_active = true
          ))
        );

      -- 3. UPDATE policy - Event creators can update registrations for their events, users can update their own
      CREATE POLICY "Event creators and users can update registrations"
        ON event_registrations
        FOR UPDATE
        TO authenticated
        USING (
          -- Users can update their own registrations
          (user_id = auth.uid()) OR
          -- Event creators can update registrations for their events
          (EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_registrations.event_id
            AND events.user_id = auth.uid()
          )) OR
          -- Admins and moderators can update any registration
          (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        )
        WITH CHECK (
          -- Users can update their own registrations
          (user_id = auth.uid()) OR
          -- Event creators can update registrations for their events
          (EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_registrations.event_id
            AND events.user_id = auth.uid()
          )) OR
          -- Admins and moderators can update any registration
          (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        );

      -- 4. DELETE policy - Users can delete their own registrations, event creators can delete registrations for their events
      CREATE POLICY "Users and event creators can delete registrations"
        ON event_registrations
        FOR DELETE
        TO authenticated
        USING (
          -- Users can delete their own registrations
          (user_id = auth.uid()) OR
          -- Event creators can delete registrations for their events
          (EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_registrations.event_id
            AND events.user_id = auth.uid()
          )) OR
          -- Admins and moderators can delete any registration
          (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
            AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
          ))
        );
    `;

    const eventRegResult = await executeSQL(eventRegPolicySQL);
    if (eventRegResult.error) {
      console.error('❌ Error fixing event_registrations policies:', eventRegResult.error);
    } else {
      console.log('✅ Event registrations RLS policies fixed successfully');
    }

    console.log('🎉 All RLS policy fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during RLS policy fixes:', error);
  }
}

// Run the fixes
fixRLSPolicies();

