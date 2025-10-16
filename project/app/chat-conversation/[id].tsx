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
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMessage } from '@/contexts/MessageContext';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  sender_name: string;
  sender_branch: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  branch: string;
  avatar_url: string | null;
  institution?: string;
  city?: string;
  role?: string;
}

export default function ChatConversationPage() {
  const { id } = useLocalSearchParams();
  const conversationId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const { refreshUnreadCount } = useMessage();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user && id) {
      fetchOtherUser();
      fetchCurrentUserData();
      fetchMessages();
      markMessagesAsRead(); // Mark messages as read when entering conversation
    }
  }, [user, id]);

  // Mark messages as read when entering conversation
  const markMessagesAsRead = async () => {
    try {
      if (!user?.id || !conversationId) return;

      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Refresh unread count in context
      refreshUnreadCount();
      console.log('✅ Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchOtherUser = async () => {
    try {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', Array.isArray(id) ? id[0] : id)
        .single();

      if (error) throw error;
      setOtherUser(data as UserProfile);
    } catch (error) {
      console.error('Error fetching other user:', error);
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı');
    }
  };

  const fetchCurrentUserData = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserData(data);
    } catch (error) {
      console.error('Error fetching current user data:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      if (!user?.id || !id) {
        setMessages([]);
        setLoading(false);
        return;
      }
      
      const conversationId = generateConversationId(user?.id || '', Array.isArray(id) ? id[0] : id);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        Alert.alert('Hata', 'Mesajlar yüklenirken hata oluştu');
        setMessages([]);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, branch, avatar_url, role')
        .in('id', senderIds.filter(id => id !== null) as string[]);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        Alert.alert('Hata', 'Kullanıcı bilgileri yüklenirken hata oluştu');
        setMessages([]);
        return;
      }

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const formattedMessages = messagesData.map((msg: any) => {
        const profile = profilesMap.get(msg.sender_id);
        return {
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          text: msg.content,
          timestamp: msg.created_at || new Date().toISOString(),
          isOwn: msg.sender_id === user?.id,
          sender_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Bilinmeyen',
          sender_branch: profile?.branch || 'Bilinmeyen',
        };
      });

      setMessages(formattedMessages as unknown as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Hata', 'Mesajlar yüklenirken hata oluştu');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const generateConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (!user?.id || !id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      const conversationId = generateConversationId(user?.id || '', Array.isArray(id) ? id[0] : id);
      
      const { data: messageData, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user?.id,
          receiver_id: Array.isArray(id) ? id[0] : id,
          content: message.trim(),
          conversation_id: conversationId,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Hata', 'Mesaj gönderilemedi');
        return;
      }

      setMessage('');
      await fetchMessages();
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Hata', 'Mesaj gönderilemedi');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      {!item.isOwn && (
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.sender_name}</Text>
          <Text style={styles.senderBranch}>{item.sender_branch}</Text>
        </View>
      )}
      <Text style={[
        styles.messageText,
        item.isOwn ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {item.content}
      </Text>
      <Text style={[
        styles.messageTime,
        item.isOwn ? styles.ownMessageTime : styles.otherMessageTime
      ]}>
        {new Date(item.timestamp).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yükleniyor...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {otherUser?.first_name} {otherUser?.last_name}
            </Text>
            <Text style={styles.userBranch}>{otherUser?.branch}</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userBranch: {
    fontSize: 14,
    color: '#6B7280',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  senderBranch: {
    fontSize: 11,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownMessageText: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  otherMessageText: {
    backgroundColor: '#FFFFFF',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  ownMessageTime: {
    textAlign: 'right',
    color: '#6B7280',
  },
  otherMessageTime: {
    textAlign: 'left',
    color: '#9CA3AF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
