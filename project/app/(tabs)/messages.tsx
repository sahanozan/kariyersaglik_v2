import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, CheckCheck, MoveVertical as MoreVertical, Video, Info } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMessage } from '@/contexts/MessageContext';
import { supabase } from '@/lib/supabase';
import { formatPostDateTime } from '@/lib/utils';
import RedBorderedBanner from '@/components/RedBorderedBanner';

interface Conversation {
  id: string;
  conversation_id: string;
  last_message: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  other_user: {
    id: string;
    first_name: string;
    last_name: string;
    branch: string;
    avatar_url: string | null;
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { refreshUnreadCount } = useMessage();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setConversations([]);
        setLoading(false);
        return;
      }
      
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(first_name, last_name, branch, avatar_url, role),
          receiver:profiles!private_messages_receiver_id_fkey(first_name, last_name, branch, avatar_url, role)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        setConversations([]);
        return;
      }

      // Group by conversation_id and get latest message
      const conversationMap = new Map();
      
      messages.forEach(message => {
        const convId = message.conversation_id;
        if (!conversationMap.has(convId) || 
            new Date(message.created_at || '') > new Date(conversationMap.get(convId)?.created_at || '')) {
          conversationMap.set(convId, message);
        }
      });

      const latestMessages = Array.from(conversationMap.values());
      
      // Create conversations with profile data
      const conversationsData: Conversation[] = latestMessages.map(msg => {
        const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        const otherUserProfile = msg.sender_id === user?.id ? msg.receiver : msg.sender;
        
        // Count unread messages for this conversation
        const unreadCount = messages.filter(m => 
          m.conversation_id === msg.conversation_id && 
          m.receiver_id === user?.id && 
          !m.is_read
        ).length;

        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          last_message: msg.content,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          unread_count: unreadCount,
          other_user: {
            id: otherUserId,
            first_name: otherUserProfile?.first_name || 'Bilinmeyen',
            last_name: otherUserProfile?.last_name || 'Kullanıcı',
            branch: otherUserProfile?.branch || 'Branş Yok',
            role: otherUserProfile?.role,
            avatar_url: otherUserProfile?.avatar_url,
          }
        };
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const showConversationActions = (conversation: Conversation) => {
    Alert.alert(
      'Mesaj İşlemleri',
      `${conversation.other_user.first_name} ${conversation.other_user.last_name} ile konuşma`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Profili Görüntüle',
          onPress: () => router.push(`/user-profile/${conversation.other_user.id}`)
        },
        { 
          text: 'Sesli Arama',
          onPress: () => {
            const fullName = `${conversation.other_user.first_name} ${conversation.other_user.last_name}`;
            Alert.alert('Arama', `${fullName} aranıyor...`);
          }
        },
        { 
          text: conversation.unread_count > 0 ? 'Okundu İşaretle' : 'Okunmadı İşaretle',
          onPress: () => markAsRead(conversation.conversation_id)
        },
        { 
          text: 'Konuşmayı Sil', 
          style: 'destructive',
          onPress: () => deleteConversation(
            conversation.conversation_id, 
            `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
          )
        }
      ]
    );
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user?.id || '');

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.conversation_id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));

      // Refresh unread count in context
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteConversation = (conversationId: string, otherUserName: string) => {
    Alert.alert(
      'Konuşmayı Sil',
      `${otherUserName} ile olan konuşmayı silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('private_messages')
                .delete()
                .eq('conversation_id', conversationId)
                .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

              if (error) throw error;
              
              setConversations(prev => prev.filter(conv => conv.conversation_id !== conversationId));
              Alert.alert('Başarılı', 'Konuşma silindi');
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Hata', 'Konuşma silinirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('receiver_id', user?.id || '');

      if (error) throw error;

      setConversations(prev => prev.map(conv => ({ ...conv, unread_count: 0 })));
      
      // Refresh unread count in context
      refreshUnreadCount();
      
      Alert.alert('Başarılı', 'Tüm mesajlar okundu olarak işaretlendi');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Hata', 'Mesajlar güncellenirken hata oluştu');
    }
  };

  const deleteAllConversations = () => {
    Alert.alert(
      'Tüm Mesajları Sil',
      'Tüm konuşmaları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Tümünü Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('private_messages')
                .delete()
                .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

              if (error) throw error;

              setConversations([]);
              Alert.alert('Başarılı', 'Tüm konuşmalar silindi');
            } catch (error) {
              console.error('Error deleting all conversations:', error);
              Alert.alert('Hata', 'Konuşmalar silinirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const showConversationOptions = (conversation: Conversation) => {
    Alert.alert(
      'Mesaj İşlemleri',
      `${conversation.other_user.first_name} ${conversation.other_user.last_name} ile konuşma`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: conversation.unread_count > 0 ? 'Okundu Olarak İşaretle' : 'Okunmadı Olarak İşaretle',
          onPress: () => markAsRead(conversation.conversation_id)
        },
        { 
          text: 'Konuşmayı Sil', 
          style: 'destructive',
          onPress: () => deleteConversation(
            conversation.conversation_id, 
            `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
          )
        }
      ]
    );
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


  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <View style={[styles.messageItem, item.unread_count > 0 && styles.unreadMessage]}>
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={() => router.push(`/user-profile/${item.other_user.id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ 
            uri: item.other_user.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }} 
          style={styles.avatar} 
        />
        {item.unread_count > 0 && (
          <View style={styles.onlineIndicator} />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.messageContent}
        activeOpacity={0.7}
        onPress={() => {
          markAsRead(item.conversation_id);
          router.push(`/chat-conversation/${item.other_user.id}`);
        }}
      >
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, item.unread_count > 0 && styles.unreadText]}>
              {getFormattedName(item.other_user.first_name, item.other_user.last_name, item.other_user.branch)}
            </Text>
            {(item.other_user as any).role && (item.other_user as any).role !== 'user' && (
              <View style={[
                styles.roleIndicator,
                (item.other_user as any).role === 'admin' && styles.adminRole,
                (item.other_user as any).role === 'moderator' && styles.moderatorRole,
              ]}>
                <Text style={styles.roleEmoji}>
                  {(item.other_user as any).role === 'admin' ? '👑' : '🛡️'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.messageTime}>
            <Text style={styles.timeText}>
              {formatPostDateTime(item.created_at)}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.senderTitle}>{item.other_user.branch}</Text>
        <Text style={[styles.messagePreview, item.unread_count > 0 && styles.unreadText]} numberOfLines={2}>
          {item.last_message}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => showConversationActions(item)}
          activeOpacity={0.7}
        >
          <MoreVertical size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoContainerInner}>
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Mesaj İşlemleri',
              'Yapmak istediğiniz işlemi seçin:',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Tümünü Okundu İşaretle', onPress: markAllAsRead },
                { text: 'Tüm Mesajları Sil', style: 'destructive', onPress: deleteAllConversations }
              ]
            );
          }}
        >
          <MoreVertical size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>


      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Mesaj Yok</Text>
          <Text style={styles.emptyStateText}>
            Henüz mesajınız bulunmuyor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#EF4444']}
              tintColor="#EF4444"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Reklam Banner - Alt navigasyonun üstünde */}
      <View style={styles.bannerContainer}>
        <RedBorderedBanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainerInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 100,
    maxHeight: 100,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesList: {
    flex: 1,
  },
  messageItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadMessage: {
    backgroundColor: '#FEF7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowOpacity: 0.15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  roleIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  adminRole: {
    backgroundColor: '#FEF2F2',
  },
  moderatorRole: {
    backgroundColor: '#F0FDF4',
  },
  roleEmoji: {
    fontSize: 12,
  },
  unreadText: {
    fontWeight: '700',
    color: '#EF4444',
  },
  messageTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  senderTitle: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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