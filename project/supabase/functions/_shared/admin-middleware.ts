import { createClient } from 'npm:@supabase/supabase-js@2.53.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface AdminAuthResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  response?: Response;
}

export async function verifyAdminAuth(req: Request): Promise<AdminAuthResult> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return {
        success: false,
        error: 'No authorization header',
        response: new Response(
          JSON.stringify({ 
            error: 'No authorization header',
            success: false 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      };
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
        response: new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            success: false 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      };
    }

    // Check if user is admin or moderator
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      return {
        success: false,
        error: 'Insufficient permissions',
        response: new Response(
          JSON.stringify({ 
            error: 'Insufficient permissions',
            success: false 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      };
    }

    return {
      success: true,
      user,
      profile
    };

  } catch (error) {
    return {
      success: false,
      error: 'Internal server error',
      response: new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    };
  }
}

export { corsHeaders };
