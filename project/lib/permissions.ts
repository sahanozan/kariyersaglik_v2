import { supabase } from './supabase';

export const checkUserPermissions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', userId)
      .single();

    if (error) {
      return { isAdmin: false, isModerator: false, isBlocked: true };
    }

    return {
      isAdmin: data.role === 'admin',
      isModerator: data.role === 'moderator',
      isBlocked: data.is_blocked || false,
    };
  } catch (error) {
    return { isAdmin: false, isModerator: false, isBlocked: true };
  }
};

export const canManageUsers = async (userId: string) => {
  const permissions = await checkUserPermissions(userId);
  return permissions.isAdmin || permissions.isModerator;
};

export const canApproveJobs = async (userId: string) => {
  const permissions = await checkUserPermissions(userId);
  return permissions.isAdmin || permissions.isModerator;
};

export const canManageAlgorithms = async (userId: string) => {
  const permissions = await checkUserPermissions(userId);
  return permissions.isAdmin;
};

export const canManageDrugs = async (userId: string) => {
  const permissions = await checkUserPermissions(userId);
  return permissions.isAdmin;
};

export const canAccessChatRoom = async (userId: string, roomId: string) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('role, branch, is_blocked')
      .eq('id', userId)
      .single();

    if (userError || !user || user.is_blocked) {
      return false;
    }

    // Admin and moderators can access all rooms
    if (user.role === 'admin' || user.role === 'moderator') {
      return true;
    }

    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('required_branch')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return false;
    }

    // If no branch requirement, everyone can access
    if (!room.required_branch) {
      return true;
    }

    // Check if user's branch matches room requirement
    return user.branch === room.required_branch;
  } catch (error) {
    return false;
  }
};