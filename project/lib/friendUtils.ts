import { supabase } from './supabase';

export async function getFriendCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching friend count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getFriendCount:', error);
    return 0;
  }
}
