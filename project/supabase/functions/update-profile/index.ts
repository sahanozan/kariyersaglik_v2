/// <reference path="./deno.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { corsHeaders } from '../_shared/admin-middleware.ts';

interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  city?: string;
  institution?: string;
  about?: string;
  avatar_url?: string;
  // Explicitly exclude sensitive fields
  role?: never;
  is_blocked?: never;
  credits?: never;
  isAdmin?: never;
  admin?: never;
  permissions?: never;
  access_level?: never;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'No authorization header',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const updateData: UpdateProfileRequest = await req.json();

    // Filter out any sensitive fields that might be sent
    const allowedFields = {
      first_name: updateData.first_name,
      last_name: updateData.last_name,
      city: updateData.city,
      institution: updateData.institution,
      about: updateData.about,
      avatar_url: updateData.avatar_url,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    const filteredData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    );

    // Update the profile with only allowed fields
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(filteredData)
      .eq('id', user.id)
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
    console.error('Error updating profile:', error);
    
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
});
