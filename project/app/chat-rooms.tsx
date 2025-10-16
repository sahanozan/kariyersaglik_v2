import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Lock, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ChatRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  required_branch: string | null;
  member_count: number;
  is_user_allowed: boolean;
}

export default function ChatRoomsPage() {
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch current user data
  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch chat rooms when currentUserData changes
  useEffect(() => {
    if (currentUserData) {
      fetchChatRooms();
    }
  }, [currentUserData]);

  const fetchCurrentUserData = async () => {
    try {
      // Check if user exists before making request
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }

      console.log('Fetching user data for ID:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      console.log('Fetched user data:', data);
      setCurrentUserData(data);
      
      // fetchChatRooms will be called by useEffect when currentUserData changes
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
      }
    }
  };

  const fetchChatRooms = async () => {
    if (!currentUserData) {
      // Wait for user data to load first
      setTimeout(() => {
        if (currentUserData) {
          fetchChatRooms();
        }
      }, 1000);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('id');

      if (error) throw error;

      const processedRooms: ChatRoom[] = data.map(room => {
        return checkRoomAccess(room, currentUserData);
      });

      // Calculate member counts

      // Özel sıralama: Belirtilen sıra + alfabetik
      const roomOrder = [
        'genel',            // Genel Sohbet (en üstte)
        'doktor',           // Doktorlar
        'dis-hekimi',       // Diş Hekimleri
        'eczaci',           // Eczacılar
        'hemsire',          // Hemşireler
        'fizyoterapi',      // Fizyoterapi
        'ebe',              // Ebeler
        'paramedik',        // Paramedikler
        'anestezist',       // Anestezi Teknisyenleri
        'ameliyathane',     // Ameliyathane Teknisyenleri
        'radyoloji',        // Tıbbi Görüntüleme
        'laboratuvar',      // Tıbbi Laboratuvar
        'diyaliz',          // Diyaliz
        'optisyen',         // Optisyenler
        'odyolog',          // Odyologlar
        'radyoterapi',      // Radyoterapi
        'cocuk-gelisimi',   // Çocuk Gelişimi
        'yasli-bakim',      // Yaşlı Bakım
        'tibbi-sekreter',   // Tıbbi Sekreter
        'perfuzyon',        // Perfüzyon
        'acil-tip',         // Acil Tıp
        'beslenme'          // Beslenme ve Diyetetik
      ];

      const sortedRooms = processedRooms.sort((a, b) => {
        const aIndex = roomOrder.indexOf(a.id);
        const bIndex = roomOrder.indexOf(b.id);
        
        // Her ikisi de özel sıralamada varsa
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // Sadece a özel sıralamada varsa
        if (aIndex !== -1) return -1;
        
        // Sadece b özel sıralamada varsa
        if (bIndex !== -1) return 1;
        
        // Her ikisi de özel sıralamada yoksa alfabetik sırala
        return a.name.localeCompare(b.name, 'tr');
      });

      setChatRooms(sortedRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkRoomAccess = (room: any, userData: any) => {
    const isAdmin = userData?.role === 'admin';
    const isModerator = userData?.role === 'moderator';
    
    console.log(`🔍 Checking access for user ${userData?.id} (${userData?.branch}) to room ${room.name} (${room.required_branch})`);
    
    // Admin and moderators can access all rooms
    if (isAdmin || isModerator) {
      console.log(`✅ ${isModerator ? 'Moderator' : 'Admin'} access granted to room: ${room.name}`);
      return {
        id: room.id,
        name: room.name,
        emoji: room.emoji,
        description: room.description,
        required_branch: room.required_branch,
        member_count: 0,
        is_user_allowed: true
      };
    }
    
    // General chat room is open to everyone
    if (room.id === 'genel' || !room.required_branch) {
      return {
        id: room.id,
        name: room.name,
        emoji: room.emoji,
        description: room.description,
        required_branch: room.required_branch,
        member_count: 0,
        is_user_allowed: true
      };
    }
    
    // Branch-specific room access
    const userBranch = userData?.branch;
    const roomBranch = room.required_branch;
    
    console.log('🔍 Room Access Check:', {
      roomId: room.id,
      roomName: room.name,
      userBranch: userBranch,
      roomBranch: roomBranch,
      userId: userData?.id
    });
    
    let hasAccess = false;
    
    // Exact branch match
    if (userBranch === roomBranch) {
      console.log('✅ Exact branch match found');
      hasAccess = true;
    } else {
      // Check branch mappings for room access
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
          'Perfüzyon Teknikeri',
          'Perfüzyon Teknisyeni',
          'Perfüzyon Teknikleri'
        ],
        'Beslenme': ['Beslenme ve Diyetetik'],
        'Acil Tıp': ['Acil Durum ve Afet Yönetimi']
      };
      
      // Check if user's branch is allowed in this room
      console.log(`🔍 Checking branch mappings for room: ${roomBranch}`);
      console.log(`🔍 User branch: ${userBranch}`);
      
      for (const [roomReq, allowedBranches] of Object.entries(roomBranchMappings)) {
        console.log(`🔍 Checking mapping: ${roomReq} -> [${allowedBranches.join(', ')}]`);
        if (roomReq === roomBranch && allowedBranches.includes(userBranch)) {
          console.log(`✅ Branch mapping found: ${userBranch} -> ${roomReq}`);
          hasAccess = true;
          break;
        }
      }
      
      if (!hasAccess) {
        console.log(`❌ No matching branch mapping found for ${userBranch} in room ${roomBranch}`);
      }
    }
    
    console.log(`${hasAccess ? '✅' : '❌'} Access result for ${room.name}: ${hasAccess}`);
    
    return {
      id: room.id,
      name: room.name,
      emoji: room.emoji,
      description: room.description,
      required_branch: room.required_branch,
      member_count: 0,
      is_user_allowed: hasAccess
    };
  };


  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={[
        styles.roomCard,
        !item.is_user_allowed && styles.lockedRoomCard
      ]}
      onPress={() => {
        if (item.is_user_allowed) {
          router.push(`/chat-room/${item.id}`);
        }
      }}
      activeOpacity={item.is_user_allowed ? 0.8 : 1}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomEmoji}>{item.emoji}</Text>
        <View style={styles.roomInfo}>
          <Text style={[
            styles.roomName,
            !item.is_user_allowed && styles.lockedText
          ]}>
            {item.name}
          </Text>
          <View style={styles.roomMeta}>
            <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
          </View>
        </View>
        {!item.is_user_allowed ? (
          <Lock size={20} color="#9CA3AF" />
        ) : (
          <View style={styles.roomActions}>
            {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
              <View style={styles.moderatorBadge}>
                <Text style={styles.moderatorBadgeText}>
                  {currentUserData?.role === 'moderator' ? 'MOD' : 'ADM'}
                </Text>
              </View>
            )}
            <MessageCircle size={20} color="#EF4444" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kariyer Sohbetleri</Text>
        <TouchableOpacity 
          onPress={() => {
            if (currentUserData) {
              fetchChatRooms();
            }
          }} 
          style={styles.refreshButton}
        >
          <RefreshCw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* User Branch Info */}
      <View style={styles.userBranchInfo}>
        <Text style={styles.userBranchText}>
          {currentUserData?.role === 'admin' ? (
            <Text style={styles.adminBadge}>👑 Admin - Tüm Odalara Erişim</Text>
          ) : currentUserData?.role === 'moderator' ? (
            <Text style={styles.moderatorBadge}>🛡️ Moderatör - Tüm Odalara Erişim</Text>
          ) : (
            <>Aktif Branşınız: <Text style={styles.userBranchHighlight}>
              {currentUserData?.branch || 'Branş Bilgisi Yok'}
            </Text></>
          )}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Sohbet odaları yükleniyor...</Text>
        </View>
      ) : (
        <>
          {/* Debug Info for Admin */}
          {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                👤 User: {currentUserData.first_name} {currentUserData.last_name}
              </Text>
              <Text style={styles.debugText}>
                🔑 Role: {currentUserData.role}
              </Text>
              <Text style={styles.debugText}>
                🏥 Branch: {currentUserData.branch}
              </Text>
              <Text style={styles.debugText}>
                🏠 Total Rooms: {chatRooms.length}
              </Text>
              <Text style={styles.debugText}>
                ✅ Accessible Rooms: {chatRooms.filter(r => r.is_user_allowed).length}
              </Text>
            </View>
          )}
          <FlatList
            data={chatRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id}
            style={styles.roomsList}
            contentContainerStyle={styles.roomsContent}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBranchInfo: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  userBranchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  userBranchHighlight: {
    color: '#EF4444',
    fontWeight: '600',
  },
  adminBadge: {
    color: '#DC2626',
    fontWeight: '700',
  },
  moderatorBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  moderatorBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  roomActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  roomsList: {
    flex: 1,
  },
  roomsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lockedRoomCard: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  debugInfo: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
});