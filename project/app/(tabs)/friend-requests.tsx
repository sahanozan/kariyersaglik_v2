import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Check, X, User, Eye, Clock, MapPin, Building } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPostDateTime } from '@/lib/utils';
import { handleSupabaseError } from '@/lib/utils';
import RedBorderedBanner from '@/components/RedBorderedBanner';

// Friend count functions - now using real database
export const getFriendCount = async (userId: string): Promise<number> => {
  try {
    // Check if userId is valid
    if (!userId) {
      console.warn('getFriendCount: No userId provided');
      return 0;
    }

    // Check if supabase is properly configured
    if (!supabase) {
      console.warn('getFriendCount: Supabase client not available');
      return 0;
    }

    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
    if (error) {
      console.error('getFriendCount: Database error:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('getFriendCount: Network or other error:', error);
    return 0;
  }
};

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
    branch: string;
    institution: string;
    city: string;
    avatar_url: string | null;
    role: string;
  } | null;
  receiver_profile?: {
    first_name: string;
    last_name: string;
    branch: string;
    institution: string;
    city: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

export default function FriendRequestsPage() {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriendRequests();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    }
  }, [user?.id]);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      // Gelen istekler
      const { data: incoming, error: incomingError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender_profile:profiles!friend_requests_sender_id_fkey(
            first_name,
            last_name,
            branch,
            institution,
            city,
            avatar_url,
            role
          )
        `)
        .eq('receiver_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (incomingError) {
        console.error('❌ Error fetching incoming requests:', incomingError);
      } else {
        console.log('✅ Incoming requests fetched:', incoming?.length || 0);
        console.log('📝 Sample incoming request:', incoming?.[0]);
        // Map the data to match our interface
        const mappedIncoming = (incoming || []).map((req: any) => ({
          ...req,
          sender_profile: req.sender_profile
        }));
        setIncomingRequests(mappedIncoming);
      }

      // Gönderilen istekler
      const { data: outgoing, error: outgoingError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          receiver_profile:profiles!friend_requests_receiver_id_fkey(
            first_name,
            last_name,
            branch,
            institution,
            city,
            avatar_url,
            role
          )
        `)
        .eq('sender_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (outgoingError) {
        console.error('❌ Error fetching outgoing requests:', outgoingError);
      } else {
        console.log('✅ Outgoing requests fetched:', outgoing?.length || 0);
        console.log('📝 Sample outgoing request:', outgoing?.[0]);
        // Map the data to match our interface
        const mappedOutgoing = (outgoing || []).map((req: any) => ({
          ...req,
          receiver_profile: req.receiver_profile
        }));
        setOutgoingRequests(mappedOutgoing);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      Alert.alert('Hata', 'Arkadaşlık istekleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string, name: string) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create friendship
      const user1 = senderId < (user?.id || '') ? senderId : (user?.id || '');
      const user2 = senderId < (user?.id || '') ? (user?.id || '') : senderId;

      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert({
          user1_id: user1,
          user2_id: user2
        });

      if (friendshipError) throw friendshipError;

      // Get updated friend count
      const newFriendCount = await getFriendCount(user?.id || '');
      
      Alert.alert(
        'Başarılı', 
        `${name} ile arkadaşlık bağlantınız kuruldu!\n\nToplam arkadaş sayınız: ${newFriendCount}`,
        [
          { text: 'Tamam' },
        ]
      );

      fetchFriendRequests(); // Refresh requests
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği kabul edilirken hata oluştu');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      
      Alert.alert('Başarılı', 'Arkadaşlık isteği reddedildi');
      fetchFriendRequests(); // Refresh requests
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği reddedilirken hata oluştu');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleCancelRequest = async (requestId: string, receiverName: string) => {
    if (processingRequests.has(requestId)) return;
    
    Alert.alert(
      'İsteği İptal Et',
      `${receiverName} kullanıcısına gönderdiğiniz arkadaşlık isteğini iptal etmek istediğinizden emin misiniz?`,
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequests(prev => new Set(prev).add(requestId));
            
            try {
              const { error } = await supabase
                .from('friend_requests')
                .delete()
                .eq('id', requestId);

              if (error) throw error;

              Alert.alert('Başarılı', 'Arkadaşlık isteği iptal edildi');
              fetchFriendRequests(); // Refresh requests
            } catch (error) {
              console.error('Error canceling friend request:', error);
              Alert.alert('Hata', 'Arkadaşlık isteği iptal edilirken hata oluştu');
            } finally {
              setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
              });
            }
          }
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
      'İlk ve Acil Yardım Teknikeri (Paramedik)': 'Prm.',
      'Ameliyathane Teknikeri': 'Amel. Tekn.',
      'Anestezi Teknikeri': 'Anest. Tekn.',
      'Beslenme ve Diyetetik': 'Dyt.',
      'Çocuk Gelişimi Uzmanı': 'Çoc. Gel. Uzm.',
      'Diyaliz Teknikeri': 'Diy. Tekn.',
      'Diyetisyen': 'Dyt.',
      'Odyolog': 'Ody.',
      'Optisyen': 'Opt.',
      'Perfüzyon Teknikeri': 'Perf. Tekn.',
      'Radyoterapi Teknikeri': 'Radyoter. Tekn.',
      'Tıbbi Görüntüleme Teknikeri': 'Rad. Tekn.',
      'Tıbbi Laboratuvar Teknikeri': 'Lab. Tekn.',
      'Tıbbi Sekreter': 'Tıbbi Sek.',
      'Yaşlı Bakım Teknikeri': 'Yaşlı Bak. Tekn.',
    };
    
    return abbreviations[branch] || branch;
  };

  const getFormattedName = (firstName: string, lastName: string, branch: string) => {
    return `${firstName} ${lastName.toUpperCase()}`;
  };

  const renderIncomingRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <TouchableOpacity 
        style={styles.profileSection}
        onPress={() => router.push(`/user-profile/${item.sender_id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ 
            uri: item.sender_profile?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }} 
          style={styles.avatar} 
        />
        <View style={styles.newRequestIndicator} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.requestContent}
        onPress={() => router.push(`/user-profile/${item.sender_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.requestHeader}>
          <Text style={styles.requestName}>
            {item.sender_profile ? 
              getFormattedName(
                item.sender_profile.first_name, 
                item.sender_profile.last_name, 
                item.sender_profile.branch
              ) : 
              'Bilinmeyen Kullanıcı'}
          </Text>
          {item.sender_profile?.role && item.sender_profile.role !== 'user' && (
            <View style={[
              styles.roleIndicator,
              item.sender_profile.role === 'admin' && styles.adminRole,
              item.sender_profile.role === 'moderator' && styles.moderatorRole,
            ]}>
              <Text style={styles.roleEmoji}>
                {item.sender_profile.role === 'admin' ? '👑' : '🛡️'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.requestTitle}>{item.sender_profile?.branch || 'Branş Bilgisi Yok'}</Text>
        <View style={styles.locationInfo}>
          <Building size={12} color="#9CA3AF" />
          <Text style={styles.institutionText}>{item.sender_profile?.institution || 'Kurum Bilgisi Yok'}</Text>
        </View>
        <View style={styles.locationInfo}>
          <MapPin size={12} color="#9CA3AF" />
          <Text style={styles.cityText}>{item.sender_profile?.city || 'Şehir Bilgisi Yok'}</Text>
        </View>
        <View style={styles.requestTime}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.requestTimeText}>
            {formatPostDateTime(item.created_at)} gönderildi
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => router.push(`/user-profile/${item.sender_id}`)}
          activeOpacity={0.7}
        >
          <Eye size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            processingRequests.has(item.id) && styles.buttonDisabled
          ]}
          onPress={() => handleAcceptRequest(
            item.id, 
            item.sender_id, 
            `${item.sender_profile?.first_name || 'Bilinmeyen'} ${item.sender_profile?.last_name || 'Kullanıcı'}`
          )}
          disabled={processingRequests.has(item.id)}
          activeOpacity={0.8}
        >
          {processingRequests.has(item.id) ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Check size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.rejectButton,
            processingRequests.has(item.id) && styles.buttonDisabled
          ]}
          onPress={() => handleRejectRequest(item.id)}
          disabled={processingRequests.has(item.id)}
          activeOpacity={0.8}
        >
          {processingRequests.has(item.id) ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <X size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutgoingRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <TouchableOpacity 
        style={styles.profileSection}
        onPress={() => router.push(`/user-profile/${item.receiver_id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ 
            uri: item.receiver_profile?.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }} 
          style={styles.avatar} 
        />
        <View style={styles.pendingIndicator} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.requestContent}
        onPress={() => router.push(`/user-profile/${item.receiver_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.requestHeader}>
          <Text style={styles.requestName}>
            {item.receiver_profile ? 
              getFormattedName(
                item.receiver_profile.first_name, 
                item.receiver_profile.last_name, 
                item.receiver_profile.branch
              ) : 
              'Bilinmeyen Kullanıcı'}
          </Text>
          {item.receiver_profile?.role && item.receiver_profile.role !== 'user' && (
            <View style={[
              styles.roleIndicator,
              item.receiver_profile.role === 'admin' && styles.adminRole,
              item.receiver_profile.role === 'moderator' && styles.moderatorRole,
            ]}>
              <Text style={styles.roleEmoji}>
                {item.receiver_profile.role === 'admin' ? '👑' : '🛡️'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.requestTitle}>{item.receiver_profile?.branch || 'Branş Bilgisi Yok'}</Text>
        <View style={styles.locationInfo}>
          <Building size={12} color="#9CA3AF" />
          <Text style={styles.institutionText}>{item.receiver_profile?.institution || 'Kurum Bilgisi Yok'}</Text>
        </View>
        <View style={styles.locationInfo}>
          <MapPin size={12} color="#9CA3AF" />
          <Text style={styles.cityText}>{item.receiver_profile?.city || 'Şehir Bilgisi Yok'}</Text>
        </View>
        <View style={styles.requestTime}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.requestTimeText}>
            {formatPostDateTime(item.created_at)} gönderildi
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() => router.push(`/user-profile/${item.receiver_id}`)}
          activeOpacity={0.7}
        >
          <Eye size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            processingRequests.has(item.id) && styles.buttonDisabled
          ]}
          onPress={() => handleCancelRequest(
            item.id,
            `${item.sender_profile?.first_name || 'Bilinmeyen'} ${item.sender_profile?.last_name || 'Kullanıcı'}`
          )}
          disabled={processingRequests.has(item.id)}
          activeOpacity={0.8}
        >
          {processingRequests.has(item.id) ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <X size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerTitle}>Arkadaşlık İstekleri</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            Gelen İstekler ({incomingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'outgoing' && styles.activeTab]}
          onPress={() => setActiveTab('outgoing')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
            Gönderilen İstekler ({outgoingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Arkadaşlık istekleri yükleniyor...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'incoming' ? (
            incomingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Gelen İstek Yok</Text>
                <Text style={styles.emptyStateText}>
                  Şu anda size gönderilmiş bekleyen arkadaşlık isteği bulunmuyor.
                </Text>
              </View>
            ) : (
              <FlatList
                data={incomingRequests}
                renderItem={renderIncomingRequestItem}
                keyExtractor={(item) => item.id}
                style={styles.requestsList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#EF4444']}
                    tintColor="#EF4444"
                  />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.requestsContent}
              />
            )
          ) : (
            outgoingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Gönderilen İstek Yok</Text>
                <Text style={styles.emptyStateText}>
                  Henüz kimseye arkadaşlık isteği göndermediniz.
                </Text>
              </View>
            ) : (
              <FlatList
                data={outgoingRequests}
                renderItem={renderOutgoingRequestItem}
                keyExtractor={(item) => item.id}
                style={styles.requestsList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#EF4444']}
                    tintColor="#EF4444"
                  />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.requestsContent}
              />
            )
          )}
        </>
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
  headerRight: {
    width: 60,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  requestsList: {
    flex: 1,
  },
  requestsContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileSection: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  newRequestIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pendingIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  requestContent: {
    flex: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  roleIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
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
  requestTitle: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  institutionText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  cityText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  requestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  requestTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 12,
  },
  viewProfileButton: {
    backgroundColor: '#EFF6FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
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