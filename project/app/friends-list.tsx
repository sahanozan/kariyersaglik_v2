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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, UserMinus, MessageCircle, Phone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getFriendCount } from '@/lib/queries';

interface Friend {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  branch: string;
  institution: string;
  city: string;
  avatar_url: string | null;
  friendship_id: string;
  created_at: string;
}

export default function FriendsListPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setFriends([]);
        setLoading(false);
        return;
      }
      
      // Get friendships where current user is either user1 or user2
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`);

      if (friendshipsError) {
        console.error('❌ Error fetching friendships:', friendshipsError);
        throw friendshipsError;
      }

      if (!friendships || friendships.length === 0) {
        console.log('📝 No friendships found');
        setFriends([]);
        return;
      }

      console.log('👥 Found friendships:', friendships.length);

      // Get friend user IDs (the other user in each friendship)
      const friendUserIds = friendships.map(friendship => 
        friendship.user1_id === user?.id ? friendship.user2_id : friendship.user1_id
      );

      console.log('🆔 Friend user IDs:', friendUserIds);

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendUserIds.filter(id => id !== null) as string[]);

      if (profilesError) {
        console.error('❌ Error fetching friend profiles:', profilesError);
        throw profilesError;
      }

      console.log('👤 Friend profiles fetched:', profiles?.length || 0);

      // Combine friendship and profile data
      const friendsData: Friend[] = profiles?.map(profile => {
        const friendship = friendships.find(f => 
          f.user1_id === profile.id || f.user2_id === profile.id
        );
        
        return {
          id: profile.id,
          user_id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          branch: profile.branch,
          institution: profile.institution,
          city: profile.city,
          avatar_url: profile.avatar_url,
          friendship_id: friendship?.id || '',
          created_at: friendship?.created_at || '',
        };
      }) || [];

      setFriends(friendsData);
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Arkadaş listesi yüklenirken hata oluştu: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string, friendshipId: string, friendName: string) => {
    Alert.alert(
      'Arkadaşlıktan Çıkar',
      `${friendName} ile arkadaşlığınızı sonlandırmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Arkadaşlıktan Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

              if (error) throw error;

              // Get updated friend count
              const newFriendCount = await getFriendCount(user?.id || '');
              
              Alert.alert(
                'Başarılı', 
                `${friendName} ile arkadaşlığınız sonlandırıldı\n\nToplam arkadaş sayınız: ${newFriendCount}`
              );
              
              fetchFriends(); // Refresh the list
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Hata', 'Arkadaşlık sonlandırılırken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const sendMessage = (friendId: string) => {
    router.push(`/chat-conversation/${friendId}`);
  };

  const callFriend = (friendName: string) => {
    Alert.alert('Arama', `${friendName} aranıyor...`);
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

  const filteredFriends = friends.filter(friend =>
    `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <TouchableOpacity 
        style={styles.friendInfo}
        onPress={() => router.push(`/user-profile/${item.user_id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ 
            uri: item.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
          }} 
          style={styles.avatar} 
        />
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {getFormattedName(item.first_name, item.last_name, item.branch)}
          </Text>
          <Text style={styles.friendBranch}>{item.branch}</Text>
          <Text style={styles.friendInstitution}>{item.institution}</Text>
          <Text style={styles.friendCity}>{item.city}</Text>
          <Text style={styles.friendSince}>
            Arkadaş olma: {new Date(item.created_at).toLocaleDateString('tr-TR', {
              timeZone: 'Europe/Istanbul'
            })}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => sendMessage(item.user_id)}
          activeOpacity={0.8}
        >
          <MessageCircle size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => {
            const fullName = `${item.first_name} ${item.last_name}`;
            callFriend(fullName);
          }}
          activeOpacity={0.8}
        >
          <Phone size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFriend(
            item.user_id, 
            item.friendship_id, 
            `${item.first_name} ${item.last_name}`
          )}
          activeOpacity={0.8}
        >
          <UserMinus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Arkadaşlarım</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Arkadaş ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Friends Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredFriends.length} arkadaş
        </Text>
      </View>

      {/* Friends List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Arkadaşlar yükleniyor...</Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'Arkadaş Bulunamadı' : 'Henüz Arkadaşınız Yok'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery 
              ? 'Arama kriterlerinize uygun arkadaş bulunamadı.' 
              : 'Arkadaşlık istekleri göndererek yeni arkadaşlar edinebilirsiniz.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          style={styles.friendsList}
          contentContainerStyle={styles.friendsContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  friendsList: {
    flex: 1,
  },
  friendsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  friendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  friendBranch: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 2,
  },
  friendInstitution: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  friendCity: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  friendSince: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#10B981',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: '#DC2626',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});