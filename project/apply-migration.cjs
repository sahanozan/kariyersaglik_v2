const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://imqcxaxvjnvhkojyxuyz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWN4YXh2am52aGtvanl4dXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2OTc2NywiZXhwIjoyMDc0NDQ1NzY3fQ.h6yweQzDbRRkhLUtOdyuEAx288sQ_CsdImVkx-EvIE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrationDirect() {
  try {
    console.log('🔄 Applying migration to add event columns to posts table...');
    
    const queries = [
      // Update post_type constraint
      `ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;`,
      `ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
        CHECK (post_type IN ('genel', 'vaka', 'soru', 'etkinlik', 'anket'));`,
      
      // Add event columns
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date text;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time text;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_location text;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants integer DEFAULT 50;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS registration_deadline text;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);`,
      `CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date) WHERE post_type = 'etkinlik';`,
      `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);`,
      
      // Disable RLS
      `ALTER TABLE posts DISABLE ROW LEVEL SECURITY;`
    ];
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`🔄 [${i+1}/${queries.length}] Executing:`, query.substring(0, 60) + '...');
      
      try {
        // Use direct SQL execution via Supabase
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
          console.error('❌ Query failed:', error.message);
          console.log('⚠️ Continuing with next query...');
        } else {
          console.log('✅ Query executed successfully');
        }
      } catch (err) {
        console.error('❌ Exception during query execution:', err.message);
        console.log('⚠️ Continuing with next query...');
      }
    }
    
    console.log('🎉 Migration process completed!');
    
    // Test the new columns
    console.log('🧪 Testing new columns...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('posts')
        .select('id, event_date, event_time, event_location, max_participants, registration_deadline, questions')
        .limit(1);
      
      if (testError) {
        console.error('❌ Test query failed:', testError.message);
      } else {
        console.log('✅ New columns are accessible!');
        console.log('📊 Sample data:', testData);
      }
    } catch (err) {
      console.error('❌ Test query exception:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error in migration process:', error.message);
  }
}

// Run the migration
applyMigrationDirect();






