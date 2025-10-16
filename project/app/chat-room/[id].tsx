import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, MoveVertical as MoreVertical, Shield, UserX, Trash2, Pin, PinOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notificationService';
import AdvertisementBanner from '@/components/AdvertisementBanner';

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  user_title: string;
  user_avatar: string | null;
  user_first_name: string;
  user_last_name: string;
  user_role: string;
  message: string;
  created_at: string;
  is_own: boolean;
  is_pinned?: boolean;
  pinned_at?: string;
  pinned_by?: string;
  expires_at?: string;
}

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActionsModal, setShowMessageActionsModal] = useState(false);

  // Test real-time connection
  const testRealtimeConnection = async () => {
    try {
      console.log('🧪 Testing real-time connection...');
      
      const testChannel = supabase
        .channel('test_connection')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'chat_messages'
          }, 
          (payload) => {
            console.log('✅ Real-time test successful:', payload);
          }
        )
        .subscribe((status) => {
          console.log('🧪 Real-time test status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time is working!');
            testChannel.unsubscribe();
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time test failed:', status);
          }
        });
    } catch (error) {
      console.error('❌ Real-time test error:', error);
    }
  };

  // Fetch current user data and room data
  useEffect(() => {
    console.log('🔍 ChatRoom useEffect - User state:', { 
      user: !!user, 
      userId: user?.id, 
      userIdType: typeof user?.id,
      userEmail: user?.email 
    });
    
    if (user && user.id && user.id !== 'undefined') {
      fetchCurrentUserData();
      fetchRoomData();
      testRealtimeConnection();
      
      // Set up real-time subscription for new messages
      console.log('🔄 Setting up real-time subscription for room:', id);
      
      const subscription = supabase
        .channel(`chat_room_${id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `room_id=eq.${id}`
          }, 
          async (payload) => {
            console.log('📨 Real-time message update received:', {
              eventType: payload.eventType,
              messageId: payload.new?.id || payload.old?.id,
              roomId: payload.new?.room_id || payload.old?.room_id
            });
            
            if (payload.eventType === 'INSERT' && payload.new) {
              console.log('➕ New message detected, adding to state');
              await addNewMessage(payload.new);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              console.log('🔄 Message update detected, updating state');
              await updateMessage(payload.new);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              console.log('🗑️ Message deletion detected, removing from state');
              await removeMessage(payload.old.id);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription error');
          }
        });

      // Initial fetch after subscription setup
      fetchMessages();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, id]);

  const fetchCurrentUserData = async () => {
    try {
      if (!user?.id) {
        console.error('❌ No user ID available');
        return;
      }

      console.log('🔄 Fetching current user data for:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user data:', error);
        throw error;
      }
      
      console.log('✅ Current user data:', data);
      setCurrentUserData(data);
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  };

  const fetchRoomData = async () => {
    try {
      console.log('🔄 Fetching room data for:', id);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error) {
        console.error('❌ Error fetching room data:', error);
        throw error;
      }
      
      console.log('✅ Room data:', data);
      setRoomData(data);
    } catch (error) {
      console.error('❌ Error fetching room data:', error);
    }
  };

  // Check if current user is admin or moderator
  const isAdminOrModerator = (): boolean => {
    return currentUserData?.role === 'admin' || currentUserData?.role === 'moderator';
  };

  // Check if user can manage a specific message
  const canManageMessage = (messageItem: Message): boolean => {
    // Admin and moderators can manage any message
    if (isAdminOrModerator()) {
      return true;
    }
    // Users can only manage their own messages
    if (!user?.id) return false;
    return messageItem.user_id === user.id;
  };

  // Ünvan kısaltmaları
  const getTitleAbbreviation = (branch: string) => {
    const abbreviations: Record<string, string> = {
      'Doktor': 'Dr.',
      'Diş Hekimi': 'Dt.',
      'Eczacı': 'Ecz.',
      'Hemşire': 'Hemşire',
      'Fizyoterapi ve Rehabilitasyon': 'Fzt.',
      'Ebe': 'Ebe',
      'İlk ve Acil Yardım Teknikeri': 'Prm.',
      'Paramedik': 'Prm.',
      'Anestezi Teknikeri': 'Anest. Tekn.',
      'Anestezist': 'Anest.',
      'Ameliyathane Teknisyeni': 'Amel. Tekn.',
      'Tıbbi Görüntüleme Teknisyeni': 'Rad. Tekn.',
      'Tıbbi Laboratuvar Teknisyeni': 'Lab. Tekn.',
      'Diyaliz Teknisyeni': 'Diy. Tekn.',
      'Optisyen': 'Opt.',
      'Odyolog': 'Ody.',
      'Radyoterapi Teknisyeni': 'Radyoter. Tekn.',
      'Çocuk Gelişimi Uzmanı': 'Çoc. Gel. Uzm.',
      'Yaşlı Bakım Teknisyeni': 'Yaşlı Bak. Tekn.',
      'Tıbbi Sekreter': 'Tıbbi Sek.',
      'Perfüzyon Teknisyeni': 'Perf. Tekn.',
      'Acil Tıp Teknisyeni': 'Acil Tıp Tekn.',
      'Diyetisyen': 'Dyt.',
      'Beslenme ve Diyetetik': 'Dyt.',
    };
    
    return abbreviations[branch] || branch;
  };

  // Tam isim formatı
  const getFormattedName = (firstName: string, lastName: string, branch: string) => {
    return `${firstName} ${lastName.toUpperCase()}`;
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        console.log('❌ No room ID provided');
        setMessages([]);
        setLoading(false);
        return;
      }
      
      console.log('🔄 Fetching messages for room:', id);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          is_pinned,
          pinned_at,
          pinned_by,
          expires_at,
          profiles!chat_messages_user_id_fkey(first_name, last_name, branch, avatar_url, role, is_blocked)
        `)
        .eq('room_id', id as string)
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        throw error;
      }

      console.log('📨 Raw messages from DB:', data?.length || 0, data);
      
      const formattedMessages: Message[] = (data || []).filter((msg: any) => {
        const hasProfile = !!msg.profiles;
        if (!hasProfile) {
          console.log('⚠️ Message without profile:', msg);
        }
        return hasProfile;
      }).map((msg: any) => ({
        id: msg.id,
        user_id: msg.user_id,
        user_name: msg.profiles ? getFormattedName(msg.profiles.first_name || '', msg.profiles.last_name || '', msg.profiles.branch || '') : 'Bilinmeyen Kullanıcı',
        user_title: msg.profiles?.branch || 'Branş Yok',
        user_avatar: msg.profiles?.avatar_url || null,
        user_first_name: msg.profiles?.first_name || 'Bilinmeyen',
        user_last_name: msg.profiles?.last_name || 'Kullanıcı',
        user_role: msg.profiles?.role || 'user',
        message: msg.message,
        created_at: new Date(msg.created_at).toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Europe/Istanbul'
        }),
        is_own: user?.id ? msg.user_id === user.id : false,
        is_pinned: msg.is_pinned || false,
        pinned_at: msg.pinned_at,
        pinned_by: msg.pinned_by,
        expires_at: msg.expires_at
      }));

      console.log('📨 Formatted messages:', formattedMessages.length, formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new message to state (for real-time updates)
  const addNewMessage = async (newMessageData: any) => {
    try {
      console.log('➕ Adding new message to state:', newMessageData);
      
      // Fetch profile data for the new message
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, branch, avatar_url, role, is_blocked')
        .eq('id', newMessageData.user_id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile for new message:', profileError);
        return;
      }

      if (!profileData) {
        console.log('⚠️ No profile found for new message user');
        return;
      }

      const formattedMessage: Message = {
        id: newMessageData.id,
        user_id: newMessageData.user_id,
        user_name: getFormattedName(profileData.first_name || '', profileData.last_name || '', profileData.branch || ''),
        user_title: profileData.branch || 'Branş Yok',
        user_avatar: profileData.avatar_url || null,
        user_first_name: profileData.first_name || 'Bilinmeyen',
        user_last_name: profileData.last_name || 'Kullanıcı',
        user_role: profileData.role || 'user',
        message: newMessageData.message,
        created_at: new Date(newMessageData.created_at).toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Europe/Istanbul'
        }),
        is_own: user?.id ? newMessageData.user_id === user.id : false,
        is_pinned: newMessageData.is_pinned || false,
        pinned_at: newMessageData.pinned_at,
        pinned_by: newMessageData.pinned_by,
        expires_at: newMessageData.expires_at
      };

      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some(msg => msg.id === formattedMessage.id);
        if (exists) {
          console.log('⚠️ Message already exists, skipping duplicate');
          return prevMessages;
        }
        
        console.log('✅ Adding new message to state');
        return [...prevMessages, formattedMessage];
      });

      // Auto scroll to bottom for new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('❌ Error adding new message:', error);
    }
  };

  // Update specific message in state
  const updateMessage = async (updatedMessageData: any) => {
    try {
      console.log('🔄 Updating message in state:', updatedMessageData);
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === updatedMessageData.id 
            ? {
                ...msg,
                message: updatedMessageData.message,
                created_at: new Date(updatedMessageData.created_at).toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZone: 'Europe/Istanbul'
                }),
                is_pinned: updatedMessageData.is_pinned || false,
                pinned_at: updatedMessageData.pinned_at,
                pinned_by: updatedMessageData.pinned_by,
                expires_at: updatedMessageData.expires_at
              }
            : msg
        )
      );
    } catch (error) {
      console.error('❌ Error updating message:', error);
    }
  };

  // Remove message from state
  const removeMessage = async (messageId: string) => {
    try {
      console.log('🗑️ Removing message from state:', messageId);
      
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      );
    } catch (error) {
      console.error('❌ Error removing message:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    console.log('📤 SendMessage - Initial check:', {
      hasUser: !!user,
      userId: user?.id,
      userIdType: typeof user?.id,
      roomId: id,
      roomIdType: typeof id
    });

    if (!user?.id || !id) {
      console.error('❌ SendMessage - Missing user or room ID');
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    // Ensure we have valid IDs
    const userId = user.id;
    const roomId = id as string;

    console.log('📤 SendMessage - Processed IDs:', {
      userId,
      userIdType: typeof userId,
      roomId,
      roomIdType: typeof roomId
    });

    if (!userId || userId === 'undefined' || !roomId || roomId === 'undefined') {
      console.error('❌ SendMessage - Invalid IDs:', { userId, roomId });
      Alert.alert('Hata', 'Geçersiz kullanıcı veya oda bilgisi');
      return;
    }

    console.log('📤 Sending message:', { 
      message: message.trim(), 
      room_id: roomId, 
      user_id: userId,
      user_email: user.email 
    });

    try {
      // First, join the room if not already a member
      console.log('🔄 Joining room...');
      const { data: memberData, error: memberError } = await supabase
        .from('chat_room_members')
        .upsert({
          room_id: roomId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        } as any, {
          onConflict: 'room_id,user_id'
        })
        .select();

      if (memberError) {
        console.error('❌ Member error:', memberError);
        Alert.alert('Hata', `Odaya katılma hatası: ${(memberError as any)?.message}`);
        throw memberError;
      }

      console.log('✅ Joined room successfully:', memberData);

      // Insert message with 24-hour expiration
      console.log('🔄 Inserting message...');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { data: insertData, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: userId,
          message: message.trim(),
          expires_at: expiresAt.toISOString()
        } as any)
        .select();

      if (error) {
        console.error('❌ Message insert error:', error);
        Alert.alert('Hata', `Mesaj ekleme hatası: ${(error as any)?.message}`);
        throw error;
      }

      console.log('✅ Message inserted successfully:', insertData);

      setMessage('');
      
      // Fetch messages to ensure immediate update
      await fetchMessages();
      console.log('📨 Messages refreshed after sending');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Hata', `Mesaj gönderilemedi: ${(error as any)?.message || 'Bilinmeyen hata'}`);
    }
  };

  const openUserProfile = (userId: string) => {
    router.push(`/user-profile/${userId}`);
  };

  const handleLongPress = (messageId: string, messageUserId: string) => {
    // Only admin and moderators can manage messages
    if (currentUserData?.role !== 'admin' && currentUserData?.role !== 'moderator') {
      return;
    }
    
    console.log('🔧 Moderator/Admin message management activated');

    const messageUser = messages.find(m => m.id === messageId);
    const userName = messageUser ? `${messageUser.user_first_name} ${messageUser.user_last_name}` : 'Kullanıcı';

      const message = messages.find(m => m.id === messageId);
      const isPinned = message?.is_pinned || false;

      Alert.alert(
        'Mesaj İşlemleri',
        `${userName} tarafından gönderilen mesaj`,
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: isPinned ? 'Sabitlemeyi Kaldır' : 'Mesajı Sabitle', 
            style: 'default',
            onPress: () => isPinned ? unpinMessage(messageId) : pinMessage(messageId)
          },
          { 
            text: 'Mesajı Sil', 
            style: 'destructive',
            onPress: () => deleteMessage(messageId)
          },
          ...(messageUserId !== currentUserData?.id ? [{
            text: 'Kullanıcıyı Engelle',
            style: 'destructive' as const,
            onPress: () => blockUser(messageUserId, userName)
          }] : [])
        ]
      );
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .rpc('delete_chat_message', {
          message_id: messageId
        } as any);

      if (error) throw error;
      Alert.alert('Başarılı', 'Mesaj silindi');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Hata', `Mesaj silinirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`);
    }
  };

  const pinMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .rpc('pin_chat_message', {
          message_id: messageId
        } as any);

      if (error) throw error;
      Alert.alert('Başarılı', 'Mesaj sabitlendi');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error pinning message:', error);
      Alert.alert('Hata', `Mesaj sabitlenirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`);
    }
  };

  const unpinMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .rpc('unpin_chat_message', {
          message_id: messageId
        } as any);

      if (error) throw error;
      Alert.alert('Başarılı', 'Mesaj sabitlemesi kaldırıldı');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error unpinning message:', error);
      Alert.alert('Hata', `Mesaj sabitlemesi kaldırılırken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`);
    }
  };

  const blockUser = async (userId: string, userName: string) => {
    // Don't allow blocking admin users
    const targetUser = messages.find(m => m.user_id === userId);
    if (targetUser?.user_role === 'admin') {
      Alert.alert('Hata', 'Admin kullanıcılar engellenemez');
      return;
    }

    Alert.alert(
      'Kullanıcıyı Engelle',
      `${userName} kullanıcısını engellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            await performBlockUser(userId, userName);
          }
        }
      ]
    );
  };

  const performBlockUser = async (userId: string, userName: string) => {
    try {
      // Block user and cleanup all content using Supabase function
      const { error: blockError } = await supabase
        .rpc('block_user_and_cleanup', {
          user_id: userId
        });

      if (blockError) throw blockError;

      Alert.alert('Başarılı', `${userName} engellendi ve tüm gönderileri silindi`);
      fetchMessages(); // Refresh messages to update UI
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Hata', `Kullanıcı engellenirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`);
    }
  };

  // Show message action menu
  const showMessageActions = (messageItem: Message) => {
    console.log('🔧 showMessageActions called:', {
      messageId: messageItem.id,
      userRole: currentUserData?.role,
      canManage: canManageMessage(messageItem)
    });
    
    if (!canManageMessage(messageItem)) {
      console.log('❌ Cannot manage message - no permission');
      return;
    }
    
    setSelectedMessage(messageItem);
    
    const isOwnMessage = user?.id ? messageItem.user_id === user.id : false;
    const isAdmin = currentUserData?.role === 'admin';
    const isModerator = currentUserData?.role === 'moderator';
    
    console.log('👤 User info:', { isOwnMessage, isAdmin, isModerator });
    
    const actions = [];
    
    // Everyone can delete their own messages
    if (isOwnMessage) {
      actions.push({
        text: 'Mesajı Sil',
        style: 'destructive' as const,
        onPress: () => confirmDeleteMessage(messageItem)
      });
    }
    
    // Admin and moderators can delete any message
    if ((isAdmin || isModerator) && !isOwnMessage) {
      actions.push({
        text: 'Mesajı Sil (Moderatör)',
        style: 'destructive' as const,
        onPress: () => confirmDeleteMessage(messageItem)
      });
    }
    
    // Admin and moderators can pin/unpin messages
    if (isAdmin || isModerator) {
      const isPinned = messageItem.is_pinned || false;
      console.log('📌 Adding pin action:', { isPinned, messageId: messageItem.id });
      actions.push({
        text: isPinned ? 'Sabitlemeyi Kaldır' : 'Mesajı Sabitle',
        style: 'default' as const,
        onPress: () => isPinned ? unpinMessage(messageItem.id) : pinMessage(messageItem.id)
      });
    }
    
    // Admin and moderators can block users (except other admins)
    if ((isAdmin || isModerator) && !isOwnMessage && messageItem.user_role !== 'admin') {
      actions.push({
        text: 'Kullanıcıyı Engelle',
        style: 'destructive' as const,
        onPress: () => {
          const fullName = `${messageItem.user_first_name} ${messageItem.user_last_name}`;
          confirmBlockUser(messageItem.user_id, fullName);
        }
      });
    }
    
    // View user profile
    actions.push({
      text: 'Profili Görüntüle',
      onPress: () => openUserProfile(messageItem.user_id)
    });
    
    actions.push({ text: 'İptal', style: 'cancel' as const });
    
    console.log('📋 Final actions:', actions.map(a => a.text));
    
    Alert.alert(
      'Mesaj İşlemleri',
      `${messageItem.user_first_name} ${messageItem.user_last_name} tarafından gönderilen mesaj`,
      actions
    );
  };

  // Confirm message deletion
  const confirmDeleteMessage = (messageItem: Message) => {
    const isOwnMessage = user?.id ? messageItem.user_id === user.id : false;
    const title = isOwnMessage ? 'Mesajı Sil' : 'Mesajı Sil (Moderatör)';
    const message = isOwnMessage 
      ? 'Bu mesajı silmek istediğinizden emin misiniz?'
      : `${messageItem.user_first_name} ${messageItem.user_last_name} kullanıcısının mesajını silmek istediğinizden emin misiniz?`;
    
    Alert.alert(
      title,
      message,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deleteMessage(messageItem.id)
        }
      ]
    );
  };

  // Confirm user blocking
  const confirmBlockUser = (userId: string, userName: string) => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${userName} kullanıcısını engellemek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Engelle', 
          style: 'destructive',
          onPress: () => performBlockUser(userId, userName)
        }
      ]
    );
  };

  const showAdminPanel = () => {
    if (currentUserData?.role !== 'admin' && currentUserData?.role !== 'moderator') return;
    
    const isModerator = currentUserData?.role === 'moderator';
    
    Alert.alert(
      isModerator ? 'Moderatör Paneli' : 'Admin Paneli',
      isModerator 
        ? 'Moderatör olarak tüm sohbet odalarına erişiminiz var. Mesaj yönetimi yapabilirsiniz.'
        : 'Admin olarak tüm sohbet odalarına erişiminiz var. Mesaj yönetimi yapabilirsiniz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Admin Paneli',
          onPress: () => router.push('/admin-panel')
        },
        { 
          text: 'Oda Ayarları',
          onPress: () => Alert.alert('Bilgi', 'Oda ayarları: Mesajları uzun basarak silebilirsiniz')
        }
      ]
    );
  };

  // Check if user has access to this room
  const hasRoomAccess = () => {
    if (!currentUserData || !roomData) {
      console.log('❌ No user data or room data available');
      return false;
    }
    
    // Admin and moderators can access all rooms
    if (currentUserData.role === 'admin' || currentUserData.role === 'moderator') {
      console.log('✅ Admin/Moderator access granted - Full access to all chat rooms');
      return true;
    }
    
    // General chat room is open to everyone
    if (roomData.id === 'genel' || !roomData.required_branch) {
      console.log('✅ General room access granted');
      return true;
    }
    
    // Branch-specific room access
    const userBranch = currentUserData.branch;
    const roomBranch = roomData.required_branch;
    
    console.log('🔍 Checking branch access:', {
      userBranch,
      roomBranch,
      roomId: roomData.id
    });
    
    // Exact branch match
    if (userBranch === roomBranch) {
      console.log('✅ Exact branch match found');
      return true;
    }
    
    // Check branch mappings
    const roomBranchMappings: Record<string, string[]> = {
      'Doktor': ['Doktor'],
      'Diş Hekimi': ['Diş Hekimi'],
      'Eczacı': ['Eczacı'],
      'Hemşire': ['Hemşire'],
      'Fizyoterapi': ['Fizyoterapi ve Rehabilitasyon'],
      'Ebe': ['Ebe'],
      'Paramedik': [
        'İlk ve Acil Yardım Teknikeri (Paramedik)', 
        'İlk ve Acil Yardım (Paramedik)',
        'Paramedik',
        'İlk ve Acil Yardım Teknikeri'
      ],
      'Anestezist': [
        'Anestezi Teknikeri', 
        'Anestezist',
        'Anestezi Teknikeri'
      ],
      'Ameliyathane': [
        'Ameliyathane Teknisyeni', 
        'Ameliyathane Hizmetleri',
        'Ameliyathane Teknikeri'
      ],
      'Radyoloji': [
        'Tıbbi Görüntüleme Teknisyeni', 
        'Tıbbi Görüntüleme Teknikleri',
        'Tıbbi Görüntüleme Teknikeri'
      ],
      'Laboratuvar': [
        'Tıbbi Laboratuvar Teknisyeni', 
        'Tıbbi Laboratuvar Teknikleri',
        'Tıbbi Laboratuvar Teknikeri'
      ],
      'Diyaliz Teknisyeni': [
        'Diyaliz Teknisyeni', 
        'Diyaliz',
        'Diyaliz Teknikeri'
      ],
      'Optisyen': ['Optisyen', 'Optisyenlik'],
      'Odyolog': ['Odyolog', 'Odyometri'],
      'Radyoterapi': [
        'Radyoterapi Teknisyeni', 
        'Radyoterapi',
        'Radyoterapi Teknikeri'
      ],
      'Çocuk Gelişimi': [
        'Çocuk Gelişimi Uzmanı', 
        'Çocuk Gelişimi'
      ],
      'Yaşlı Bakım': [
        'Yaşlı Bakım Teknisyeni', 
        'Yaşlı Bakımı',
        'Yaşlı Bakım Teknikeri'
      ],
      'Tıbbi Sekreter': [
        'Tıbbi Sekreter', 
        'Tıbbi Dokümantasyon ve Sekreterlik'
      ],
      'Perfüzyon': [
        'Perfüzyon Teknisyeni', 
        'Perfüzyon Teknikleri',
        'Perfüzyon Teknikeri'
      ],
      'Beslenme': ['Beslenme ve Diyetetik'],
      'Acil Tıp': ['Acil Durum ve Afet Yönetimi']
    };
    
    // Check if user's branch is allowed in this room
    let hasAccess = false;
    for (const [roomReq, allowedBranches] of Object.entries(roomBranchMappings)) {
      if (roomReq === roomBranch && allowedBranches.includes(userBranch)) {
        console.log(`✅ Branch access granted: ${userBranch} -> ${roomReq}`);
        hasAccess = true;
        break;
      }
    }
    
    if (!hasAccess) {
      console.log(`❌ Access denied: ${userBranch} cannot access ${roomBranch}`);
    }
    
    return hasAccess;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.is_own) {
      // Own messages - right side, Telegram/WhatsApp style
      return (
        <View style={styles.messageRow}>
          <View style={styles.ownMessageContainer}>
            <TouchableOpacity
              style={[
                styles.ownMessageBubble,
                item.is_pinned && styles.pinnedMessageBubble
              ]}
              onLongPress={() => canManageMessage(item) ? showMessageActions(item) : null}
              activeOpacity={0.8}
            >
              <TouchableOpacity 
                style={styles.ownUserInfoInBubble}
                onPress={() => openUserProfile(item.user_id)}
                activeOpacity={0.7}
              >
                <View style={styles.ownUserInfoAvatar}>
                  {item.user_avatar ? (
                    <Image source={{ uri: item.user_avatar }} style={styles.ownUserInfoAvatarImage} />
                  ) : (
                    <View style={styles.ownUserInfoAvatarPlaceholder}>
                      <Text style={styles.ownUserInfoAvatarText}>
                        {item.user_first_name.charAt(0)}{item.user_last_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  {item.user_role === 'admin' && (
                    <View style={styles.ownUserInfoRoleIndicator}>
                      <Text style={styles.ownUserInfoRoleIcon}>👑</Text>
                    </View>
                  )}
                  {item.user_role === 'moderator' && (
                    <View style={styles.ownUserInfoRoleIndicator}>
                      <Text style={styles.ownUserInfoRoleIcon}>🛡️</Text>
                    </View>
                  )}
                </View>
                <View style={styles.ownUserInfoText}>
                  <Text style={styles.ownUserInfoTitle}>{item.user_title || item.user_role}</Text>
                  <Text style={[
                    styles.ownUserInfoName,
                    item.user_role === 'admin' && styles.adminName,
                    item.user_role === 'moderator' && styles.moderatorName,
                  ]}>
                    {item.user_first_name} {item.user_last_name}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {item.is_pinned && (
                <View style={styles.pinnedIndicator}>
                  <Pin size={12} color="#10B981" />
                  <Text style={styles.pinnedText}>Sabitlenmiş</Text>
                </View>
              )}
              <Text style={styles.ownMessageText}>{item.message}</Text>
              <View style={styles.ownMessageFooter}>
                <Text style={styles.ownMessageTime}>{item.created_at}</Text>
                {canManageMessage(item) && (
                  <TouchableOpacity
                    style={styles.messageMenuButton}
                    onPress={() => showMessageActions(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MoreVertical size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Other users' messages - left side, Telegram/WhatsApp group style
    return (
      <View style={styles.messageRow}>
        <View style={styles.otherMessageContainer}>
          <View style={styles.otherMessageContent}>
            <TouchableOpacity
              style={[
                styles.otherMessageBubble,
                item.is_pinned && styles.pinnedMessageBubble
              ]}
              onLongPress={() => canManageMessage(item) ? showMessageActions(item) : null}
              activeOpacity={0.8}
            >
              <TouchableOpacity 
                style={styles.userInfoInBubble}
                onPress={() => openUserProfile(item.user_id)}
                activeOpacity={0.7}
              >
                <View style={styles.userInfoAvatar}>
                  {item.user_avatar ? (
                    <Image source={{ uri: item.user_avatar }} style={styles.userInfoAvatarImage} />
                  ) : (
                    <View style={styles.userInfoAvatarPlaceholder}>
                      <Text style={styles.userInfoAvatarText}>
                        {item.user_first_name.charAt(0)}{item.user_last_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  {item.user_role === 'admin' && (
                    <View style={styles.userInfoRoleIndicator}>
                      <Text style={styles.userInfoRoleIcon}>👑</Text>
                    </View>
                  )}
                  {item.user_role === 'moderator' && (
                    <View style={styles.userInfoRoleIndicator}>
                      <Text style={styles.userInfoRoleIcon}>🛡️</Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfoText}>
                  <Text style={styles.userInfoTitle}>{item.user_title || item.user_role}</Text>
                  <Text style={[
                    styles.userInfoName,
                    item.user_role === 'admin' && styles.adminName,
                    item.user_role === 'moderator' && styles.moderatorName,
                  ]}>
                    {item.user_first_name} {item.user_last_name}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {item.is_pinned && (
                <View style={styles.pinnedIndicator}>
                  <Pin size={12} color="#10B981" />
                  <Text style={styles.pinnedText}>Sabitlenmiş</Text>
                </View>
              )}
              <Text style={styles.otherMessageText}>{item.message}</Text>
              <View style={styles.otherMessageFooter}>
                <Text style={styles.otherMessageTime}>{item.created_at}</Text>
                {canManageMessage(item) && (
                  <TouchableOpacity
                    style={styles.messageMenuButton}
                    onPress={() => showMessageActions(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MoreVertical size={14} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Show loading if user is not loaded yet
  if (!user || !user.id || user.id === 'undefined') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Kullanıcı bilgileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasRoomAccess()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erişim Reddedildi</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>
            Bu sohbet odasına sadece {roomData?.required_branch || 'belirli branş'} mensupları erişebilir.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {roomData ? `${roomData.emoji} ${roomData.name}` : 'Sohbet Odası'}
        </Text>
        {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
          <TouchableOpacity onPress={showAdminPanel} style={styles.adminButton}>
            <Shield size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Badge */}
      {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
        <View style={styles.roleBadge}>
          <Shield size={16} color="#10B981" />
          <Text style={styles.roleBadgeText}>
            {currentUserData?.role === 'admin' ? 'Admin - Tüm Odalar' : 'Moderatör - Tüm Odalar'}
          </Text>
        </View>
      )}

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 60, // Estimated item height (reduced)
            offset: 60 * index,
            index,
          })}
        />
      )}

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Mesajınızı yazın..."
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
            activeOpacity={0.8}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Reklam Banner - Alt navigasyonun üstünde */}
      <View style={styles.bannerContainer}>
        <AdvertisementBanner 
          onPress={() => {
            // Reklam tıklama işlemi
            console.log('Reklam banner\'ına tıklandı');
          }}
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 16,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
    marginLeft: 4,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  // Telegram/WhatsApp group message design
  messageRow: {
    marginBottom: 2,
    paddingHorizontal: 6,
  },
  ownMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 10,
    maxWidth: '98%',
    minWidth: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ownMessageText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 1,
  },
  ownMessageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  ownMessageTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  otherMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 8,
    marginTop: 2,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  roleIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleIcon: {
    fontSize: 8,
  },
  otherMessageContent: {
    flex: 1,
    maxWidth: '80%',
  },
  userNameContainer: {
    marginBottom: 2,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginRight: 6,
  },
  userTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    maxWidth: '98%',
    minWidth: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  otherMessageText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 1,
  },
  otherMessageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  otherMessageTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  adminName: {
    color: '#DC2626',
  },
  moderatorName: {
    color: '#059669',
  },
  // User info inside message bubbles
  userInfoInBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 35,
    width: '100%',
  },
  userInfoAvatar: {
    position: 'relative',
    marginRight: 8,
  },
  userInfoAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  userInfoAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfoRoleIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  userInfoRoleIcon: {
    fontSize: 10,
  },
  userInfoText: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  userInfoName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  userInfoTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Own message user info inside bubble
  ownUserInfoInBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'flex-end',
    minHeight: 35,
    width: '100%',
  },
  ownUserInfoAvatar: {
    position: 'relative',
    marginLeft: 8,
  },
  ownUserInfoAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  ownUserInfoAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownUserInfoAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ownUserInfoRoleIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  ownUserInfoRoleIcon: {
    fontSize: 10,
  },
  ownUserInfoText: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'column',
    minWidth: 0,
  },
  ownUserInfoName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 1,
  },
  ownUserInfoTitle: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    backgroundColor: '#EF4444',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  // New styles for own messages with user info
  ownMessageWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ownAvatarContainer: {
    marginLeft: 8,
    position: 'relative',
  },
  ownMessageContentWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  ownMessageHeader: {
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  ownUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  // Message menu button styles
  messageMenuButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginLeft: 8,
  },
  // Pin message styles
  pinnedMessageBubble: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pinnedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 75, // Tab bar yüksekliği
    left: 0,
    right: 0,
    zIndex: 5,
    elevation: 5,
    paddingHorizontal: 16,
  },
});