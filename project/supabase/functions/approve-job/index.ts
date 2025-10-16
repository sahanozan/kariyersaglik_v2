/// <reference path="./deno.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { verifyAdminAuth, corsHeaders } from '../_shared/admin-middleware.ts';

interface ApproveJobRequest {
  job_id: string;
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

    const { job_id }: ApproveJobRequest = await req.json();

    if (!job_id) {
      throw new Error('Job ID is required');
    }

    // Approve the job listing
    const { data, error } = await supabaseClient
      .from('job_listings')
      .update({
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', job_id)
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
    console.error('Error approving job:', error);
    
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