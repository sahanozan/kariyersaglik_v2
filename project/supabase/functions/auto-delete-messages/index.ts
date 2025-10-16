import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting auto-delete expired messages process...')

    // Call the auto_delete_expired_messages function
    const { data, error } = await supabaseClient.rpc('auto_delete_expired_messages')

    if (error) {
      console.error('❌ Error in auto_delete_expired_messages:', error)
      throw error
    }

    console.log('✅ Auto-delete process completed successfully')

    // Get count of deleted messages for logging
    const { count } = await supabaseClient
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .not('deleted_at', 'is', null)
      .gte('deleted_at', new Date(Date.now() - 60000).toISOString()) // Last minute

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auto-delete process completed',
        deleted_count: count || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error in auto-delete function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
