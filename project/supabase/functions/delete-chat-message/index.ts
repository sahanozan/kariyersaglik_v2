/// <reference path="./deno.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { verifyAdminAuth, corsHeaders } from '../_shared/admin-middleware.ts';

interface DeleteMessageRequest {
  message_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.success) {
      return authResult.response!;
    }

    const { user } = authResult;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message_id }: DeleteMessageRequest = await req.json();

    if (!message_id) {
      throw new Error('Message ID is required');
    }

    // Soft delete the message
    const { data, error } = await supabaseClient
      .from('chat_messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', message_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});});

});