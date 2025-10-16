import { supabase } from './supabase';

// User queries
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
};

// Posts queries
export const getUserPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const createPost = async (postData: any) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(postData)
    .select()
    .single();

  return { data, error };
};

export const updatePost = async (postId: string, updates: any) => {
  const { data, error } = await supabase
    .from('posts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();

  return { data, error };
};

export const deletePost = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', postId)
    .select()
    .single();

  return { data, error };
};

// Friend requests queries
export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    })
    .select()
    .single();

  return { data, error };
};

export const acceptFriendRequest = async (requestId: string, senderId: string, receiverId: string) => {
  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateError) {
    return { data: null, error: updateError };
  }

  // Create friendship
  const user1 = senderId < receiverId ? senderId : receiverId;
  const user2 = senderId < receiverId ? receiverId : senderId;

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user1_id: user1,
      user2_id: user2,
    })
    .select()
    .single();

  return { data, error };
};

export const rejectFriendRequest = async (requestId: string) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select()
    .single();

  return { data, error };
};

// Job listings queries
export const getJobListings = async (isAdmin: boolean = false) => {
  let query = supabase
    .from('job_listings')
    .select(`
      *,
      profiles!job_listings_posted_by_fkey(first_name, last_name)
    `)
    .eq('is_active', true);

  // Regular users only see approved jobs
  if (!isAdmin) {
    query = query.eq('is_approved', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

export const createJobListing = async (jobData: any) => {
  const { data, error } = await supabase
    .from('job_listings')
    .insert({
      ...jobData,
      is_active: true,
      is_approved: false,
    })
    .select()
    .single();

  return { data, error };
};

export const approveJobListing = async (jobId: string, approverId: string) => {
  const { data, error } = await supabase
    .from('job_listings')
    .update({
      is_approved: true,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  return { data, error };
};

// Chat queries
export const getChatRooms = async () => {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('id');

  return { data, error };
};

export const getChatMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      id,
      user_id,
      message,
      created_at,
      profiles!chat_messages_user_id_fkey(first_name, last_name, branch, avatar_url, role, is_blocked)
    `)
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return { data, error };
};

export const sendChatMessage = async (roomId: string, userId: string, message: string) => {
  // First, join the room if not already a member
  await supabase
    .from('chat_room_members')
    .upsert({
      room_id: roomId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'room_id,user_id'
    });

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      message: message.trim()
    })
    .select()
    .single();

  return { data, error };
};

// Private messages queries
export const getPrivateMessages = async (userId: string, otherUserId: string) => {
  const conversationId = [userId, otherUserId].sort().join('_');
  
  const { data, error } = await supabase
    .from('private_messages')
    .select(`
      *,
      sender:profiles!private_messages_sender_id_fkey(first_name, last_name, branch)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return { data, error };
};

export const sendPrivateMessage = async (senderId: string, receiverId: string, content: string) => {
  const conversationId = [senderId, receiverId].sort().join('_');
  
  const { data, error } = await supabase
    .from('private_messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      conversation_id: conversationId,
      is_read: false
    })
    .select()
    .single();

  return { data, error };
};

// Algorithms and drugs queries
export const getAlgorithms = async () => {
  const { data, error } = await supabase
    .from('algorithms')
    .select('*')
    .order('urgency', { ascending: false })
    .order('title', { ascending: true });

  return { data, error };
};

export const getDrugs = async () => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .order('name', { ascending: true });

  return { data, error };
};

export const getAlgorithmById = async (id: string) => {
  const { data, error } = await supabase
    .from('algorithms')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};

export const getDrugById = async (id: string) => {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};