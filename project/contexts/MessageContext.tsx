import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
// import { notificationService } from '@/lib/notificationService';

interface MessageContextType {
  unreadMessageCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const { user } = useAuth();

  const refreshUnreadCount = async () => {
    try {
      if (!user?.id) {
        setUnreadMessageCount(0);
        return;
      }

      // Count unread messages
      const { count, error } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread message count:', error);
        return;
      }

      setUnreadMessageCount(count || 0);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      // Initialize notification service (disabled for Expo Go)
      // notificationService.registerForPushNotifications();
      
      refreshUnreadCount();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('unread_messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'private_messages',
            filter: `receiver_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('📱 New message received:', payload);
            refreshUnreadCount();
            
            // Send notification for new message (disabled for Expo Go)
            // if (payload.new) {
            //   notificationService.handleNewMessage(payload.new);
            // }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  return (
    <MessageContext.Provider value={{ unreadMessageCount, refreshUnreadCount }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}
