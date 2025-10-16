/// <reference path="./deno.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { verifyAdminAuth, corsHeaders } from '../_shared/admin-middleware.ts';

interface AdminUpdateUserRequest {
  target_user_id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  institution?: string;
  about?: string;
  avatar_url?: string;
  role?: 'admin' | 'moderator' | 'user';
  is_blocked?: boolean;
  // Allow admin to update sensitive fields
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

    const updateData: AdminUpdateUserRequest = await req.json();

    if (!updateData.target_user_id) {
      throw new Error('Target user ID is required');
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabaseClient
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', updateData.target_user_id)
      .single();

    if (targetError || !targetUser) {
      throw new Error('Target user not found');
    }

    // Prevent updating admin users unless current user is admin
    if (targetUser.role === 'admin' && user.role !== 'admin') {
      throw new Error('Only admins can update other admins');
    }

    // Prepare update data
    const allowedFields = {
      first_name: updateData.first_name,
      last_name: updateData.last_name,
      city: updateData.city,
      institution: updateData.institution,
      about: updateData.about,
      avatar_url: updateData.avatar_url,
      role: updateData.role,
      is_blocked: updateData.is_blocked,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    const filteredData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    );

    // Update the user profile
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(filteredData)
      .eq('id', updateData.target_user_id)
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
    console.error('Error updating user:', error);
    
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
