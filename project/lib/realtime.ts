import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  // Chat room real-time subscription
  subscribeToChatRoom(roomId: string, onMessage: (payload: any) => void) {
    const channelName = `chat_room_${roomId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        }, 
        onMessage
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Private messages real-time subscription
  subscribeToPrivateMessages(conversationId: string, onMessage: (payload: any) => void) {
    const channelName = `private_messages_${conversationId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'private_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        onMessage
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Friend requests real-time subscription
  subscribeToFriendRequests(userId: string, onUpdate: (payload: any) => void) {
    const channelName = `friend_requests_${userId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friend_requests',
          filter: `receiver_id=eq.${userId}`
        }, 
        onUpdate
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Job listings real-time subscription
  subscribeToJobListings(onUpdate: (payload: any) => void) {
    const channelName = 'job_listings_updates';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'job_listings'
        }, 
        onUpdate
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Algorithms real-time subscription
  subscribeToAlgorithms(onUpdate: (payload: any) => void) {
    const channelName = 'algorithms_updates';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'algorithms'
        }, 
        onUpdate
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Drugs real-time subscription
  subscribeToDrugs(onUpdate: (payload: any) => void) {
    const channelName = 'drugs_updates';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'drugs'
        }, 
        onUpdate
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();