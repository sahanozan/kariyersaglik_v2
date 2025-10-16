import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Building, UserPlus, MessageCircle, Shield, UserMinus } from 'lucide-react-native';
import { FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  branch: string;
  city: string;
  institution: string;
  role: 'admin' | 'moderator' | 'user';
  about: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function UserProfilePage() {
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [currentUserData, setCurrentUserData] = useState<UserProfile | null>(null);
  const [hasCV, setHasCV] = useState(false);

  // Check if current user is admin or moderator
  const isAdminView = currentUserData?.role === 'admin' || currentUserData?.role === 'moderator';

  useEffect(() => {
    if (id && user) {
      fetchUserProfile();
      checkFriendshipStatus();
      fetchCurrentUserData();
      checkCVAvailability();
    }
  }, [id, user]);

  const fetchCurrentUserData = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserData(data as UserProfile);
    } catch (error) {
      console.error('Error fetching current user data:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        console.log('❌ No user ID provided');
        setLoading(false);
        return;
      }
      
      console.log('🔄 Fetching user profile for ID:', id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        throw error;
      }
      
      console.log('✅ User profile fetched:', data);
      setUserProfile(data as UserProfile);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      if (error instanceof Error && 'code' in error && error.code === 'PGRST116') {
        Alert.alert('Hata', 'Kullanıcı profili bulunamadı');
      } else {
        Alert.alert('Hata', `Kullanıcı profili yüklenirken hata oluştu: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      if (!user?.id || !userId) {
        return;
      }
      
      // Check if already friends
      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${user?.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user?.id})`)
        .maybeSingle();

      if (friendshipError && friendshipError.code !== 'PGRST116') {
        throw friendshipError;
      }

      if (friendship) {
        setFriendshipStatus('friends');
        return;
      }

      // Check if friend request exists
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .eq('status', 'pending')
        .maybeSingle();

      if (requestError && requestError.code !== 'PGRST116') {
        throw requestError;
      }

      if (request) {
        setFriendshipStatus('pending');
      } else {
        setFriendshipStatus('none');
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const checkCVAvailability = async () => {
    try {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('cvs')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setHasCV(!!data);
    } catch (error) {
      console.error('Error checking CV availability:', error);
    }
  };

  const canViewCV = () => {
    // Own profile
    if (user?.id === userProfile?.id) return true;
    // Admin/moderator view
    if (isAdminView) return true;
    // Friends can view
    if (friendshipStatus === 'friends') return true;
    // Job poster can view if user applied to their job
    return false;
  };

  const sendFriendRequest = async () => {
    try {
      if (!user?.id || !userId) {
        Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
        return;
      }
      
      // Check if they are already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
        .maybeSingle();
      
      if (existingFriendship) {
        Alert.alert('Bilgi', 'Bu kullanıcı zaten arkadaşınız');
        return;
      }
      
      // Check if there's a pending request
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .maybeSingle();
      
      if (existingRequest && existingRequest.status === 'pending') {
        Alert.alert('Bilgi', 'Bu kullanıcıya zaten arkadaşlık isteği gönderilmiş');
        return;
      }
      
      // If there's any existing request (rejected, accepted, or pending), delete it first
      if (existingRequest) {
        await supabase
          .from('friend_requests')
          .delete()
          .eq('id', existingRequest.id);
      }
      
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user?.id,
          receiver_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi!');
      setFriendshipStatus('pending');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Hata', 'Arkadaşlık isteği gönderilirken hata oluştu');
    }
  };

  const sendMessage = () => {
    if (!id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }
    router.push(`/chat-conversation/${id}`);
  };

  const removeFriend = async () => {
    try {
      if (!user?.id || !userId) {
        Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
        return;
      }

      Alert.alert(
        'Arkadaşlıktan Çıkar',
        `${userProfile?.first_name} ${userProfile?.last_name} ile arkadaşlığınızı sonlandırmak istediğinizden emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Arkadaşlıktan Çıkar',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete any existing friend requests first
                await supabase
                  .from('friend_requests')
                  .delete()
                  .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`);

                // Find and delete the friendship
                const { error } = await supabase
                  .from('friendships')
                  .delete()
                  .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`);

                if (error) throw error;

                Alert.alert('Başarılı', `${userProfile?.first_name} ${userProfile?.last_name} ile arkadaşlığınız sonlandırıldı`);
                setFriendshipStatus('none');
                // Refresh friendship status
                await checkFriendshipStatus();
              } catch (error) {
                console.error('Error removing friend:', error);
                Alert.alert('Hata', 'Arkadaşlık sonlandırılırken hata oluştu');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in removeFriend:', error);
      Alert.alert('Hata', 'İşlem sırasında hata oluştu');
    }
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

  const getFormattedName = (firstName: string, lastName: string, branch: string) => {
    return `${firstName} ${lastName.toUpperCase()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yükleniyor...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kullanıcı Bulunamadı</Text>
          <View style={styles.headerRight} />
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
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card - Role-based styling */}
        {userProfile.role === 'admin' ? (
          <View style={styles.adminProfileCard}>
            {/* Admin Crown Header */}
            <View style={styles.adminCrownHeader}>
              <View style={styles.adminCrown}>
                <Text style={styles.adminCrownText}>👑</Text>
              </View>
              <Text style={styles.adminHeaderText}>YÖNETİCİ</Text>
            </View>
            
            <Image 
              source={{ 
                uri: userProfile.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
              }} 
              style={styles.adminAvatar} 
            />
            <View style={styles.adminProfileInfo}>
              <Text style={styles.adminProfileName}>
                {getFormattedName(userProfile.first_name, userProfile.last_name, userProfile.branch)}
              </Text>
              <Text style={styles.adminProfileTitle}>{userProfile.branch}</Text>
              
              {/* Admin Status */}
              <View style={styles.adminStatusBadge}>
                <Shield size={16} color="#FFFFFF" />
                <Text style={styles.adminStatusText}>SÜPER YÖNETİCİ</Text>
              </View>
              
              <View style={styles.adminLocationInfo}>
                <Building size={16} color="#FFFFFF" />
                <Text style={styles.adminInstitution}>{userProfile.institution}</Text>
              </View>
              <View style={styles.adminLocationInfo}>
                <MapPin size={16} color="#FFFFFF" />
                <Text style={styles.adminCity}>{userProfile.city}</Text>
              </View>
              
              {/* Admin Powers */}
              <View style={styles.adminPowersSection}>
                <Text style={styles.adminPowersTitle}>YETKİLER</Text>
                <View style={styles.adminPowersList}>
                  <Text style={styles.adminPowerItem}>• Tüm kullanıcıları yönetebilir</Text>
                  <Text style={styles.adminPowerItem}>• Sistem ayarlarını değiştirebilir</Text>
                  <Text style={styles.adminPowerItem}>• Moderator atayabilir</Text>
                  <Text style={styles.adminPowerItem}>• Tüm içerikleri silebilir</Text>
                </View>
              </View>
            </View>
          </View>
        ) : userProfile.role === 'moderator' ? (
          <View style={styles.moderatorProfileCard}>
            {/* Moderator Shield Header */}
            <View style={styles.moderatorShieldHeader}>
              <View style={styles.moderatorShield}>
                <Shield size={20} color="#059669" />
              </View>
              <Text style={styles.moderatorHeaderText}>MODERATÖR</Text>
            </View>
            
            <Image 
              source={{ 
                uri: userProfile.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
              }} 
              style={styles.moderatorAvatar} 
            />
            <View style={styles.moderatorProfileInfo}>
              <Text style={styles.moderatorProfileName}>
                {getFormattedName(userProfile.first_name, userProfile.last_name, userProfile.branch)}
              </Text>
              <Text style={styles.moderatorProfileTitle}>{userProfile.branch}</Text>
              
              {/* Moderator Status */}
              <View style={styles.moderatorStatusBadge}>
                <Shield size={14} color="#FFFFFF" />
                <Text style={styles.moderatorStatusText}>MODERATÖR</Text>
              </View>
              
              <View style={styles.moderatorLocationInfo}>
                <Building size={16} color="#059669" />
                <Text style={styles.moderatorInstitution}>{userProfile.institution}</Text>
              </View>
              <View style={styles.moderatorLocationInfo}>
                <MapPin size={16} color="#059669" />
                <Text style={styles.moderatorCity}>{userProfile.city}</Text>
              </View>
              
              {/* Moderator Powers */}
              <View style={styles.moderatorPowersSection}>
                <Text style={styles.moderatorPowersTitle}>YETKİLER</Text>
                <View style={styles.moderatorPowersList}>
                  <Text style={styles.moderatorPowerItem}>• Mesajları yönetebilir</Text>
                  <Text style={styles.moderatorPowerItem}>• Kullanıcıları engelleyebilir</Text>
                  <Text style={styles.moderatorPowerItem}>• İçerikleri silebilir</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <Image 
              source={{ 
                uri: userProfile.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
              }} 
              style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {getFormattedName(userProfile.first_name, userProfile.last_name, userProfile.branch)}
              </Text>
              <Text style={styles.profileTitle}>{userProfile.branch}</Text>
              <View style={styles.locationInfo}>
                <Building size={16} color="#6B7280" />
                <Text style={styles.institution}>{userProfile.institution}</Text>
              </View>
              <View style={styles.locationInfo}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.city}>{userProfile.city}</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Admin/Moderator View: Show additional info */}
        {isAdminView && (
          <View style={styles.adminInfoSection}>
                <Text style={styles.adminInfoTitle}>Yönetici Bilgileri</Text>
                
                <View style={styles.adminInfoGrid}>
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>E-posta:</Text>
                    <Text style={styles.adminInfoValue}>{userProfile.email}</Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>Telefon:</Text>
                    <Text style={styles.adminInfoValue}>{(userProfile as any).phone || 'Belirtilmemiş'}</Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>Kayıt Tarihi:</Text>
                    <Text style={styles.adminInfoValue}>
                      {new Date(userProfile.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>Hesap Durumu:</Text>
                    <Text style={[
                      styles.adminInfoValue,
                      (userProfile as any).is_blocked ? styles.blockedStatus : styles.activeStatus
                    ]}>
                      {(userProfile as any).is_blocked ? 'Engelli' : 'Aktif'}
                    </Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>Kullanıcı ID:</Text>
                    <Text style={styles.adminInfoValue}>{userProfile.id}</Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>Rol:</Text>
                    <Text style={[
                      styles.adminInfoValue,
                      userProfile.role === 'admin' ? styles.adminRole : 
                      userProfile.role === 'moderator' ? styles.moderatorRole : styles.userRole
                    ]}>
                      {userProfile.role === 'admin' ? 'Yönetici' : 
                       userProfile.role === 'moderator' ? 'Moderatör' : 'Kullanıcı'}
                    </Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>Son Güncelleme:</Text>
                    <Text style={styles.adminInfoValue}>
                      {(userProfile as any).updated_at ?
                        new Date((userProfile as any).updated_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Bilinmiyor'
                      }
                    </Text>
                  </View>
                  
                  <View style={styles.adminInfoItem}>
                    <Text style={styles.adminInfoLabel}>E-posta Doğrulandı:</Text>
                    <Text style={[
                      styles.adminInfoValue,
                      (userProfile as any).email_verified ? styles.verifiedStatus : styles.unverifiedStatus
                    ]}>
                      {(userProfile as any).email_verified ? 'Evet' : 'Hayır'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Role Badge */}
            {userProfile.role && userProfile.role !== 'user' && (
              <View style={[
                styles.roleBadge,
                userProfile.role === 'admin' && styles.adminRoleBadge,
                userProfile.role === 'moderator' && styles.moderatorRoleBadge,
              ]}>
                <Shield size={14} color="#FFFFFF" />
                <Text style={styles.roleBadgeText}>
                  {userProfile.role === 'admin' ? 'Admin' : 'Moderatör'}
                </Text>
              </View>
            )}

        {/* About Section */}
        {userProfile.about && (
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.aboutText}>{userProfile.about}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {user?.id !== userProfile.id && !isAdminView && (
          <View style={styles.actionButtons}>
            {/* CV Button - Show if user has CV and current user can view it */}
            {canViewCV() && (
              <TouchableOpacity
                style={styles.cvButton}
                onPress={() => {
                  if (hasCV) {
                    router.push(`/cv-view/${userProfile.id}`);
                  } else {
                    Alert.alert('Bilgi', 'Bu kullanıcının henüz CV\'si bulunmuyor.');
                  }
                }}
                activeOpacity={0.8}
              >
                <FileText size={20} color="#FFFFFF" />
                <Text style={styles.cvButtonText}>
                  {hasCV ? 'CV / Özgeçmiş Görüntüle' : 'CV Henüz Eklenmemiş'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.messageButton}
              onPress={sendMessage}
              activeOpacity={0.8}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.messageButtonText}>Mesaj Gönder</Text>
            </TouchableOpacity>
            
            {friendshipStatus === 'none' && (
              <TouchableOpacity
                style={styles.friendButton}
                onPress={sendFriendRequest}
                activeOpacity={0.8}
              >
                <UserPlus size={20} color="#FFFFFF" />
                <Text style={styles.friendButtonText}>Arkadaş Ekle</Text>
              </TouchableOpacity>
            )}
            
            {friendshipStatus === 'pending' && (
              <View style={styles.pendingButton}>
                <Text style={styles.pendingButtonText}>İstek Gönderildi</Text>
              </View>
            )}
            
            {friendshipStatus === 'friends' && (
              <TouchableOpacity
                style={styles.removeFriendButton}
                onPress={removeFriend}
                activeOpacity={0.8}
              >
                <UserMinus size={20} color="#FFFFFF" />
                <Text style={styles.removeFriendButtonText}>Arkadaşlıktan Çıkar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Admin/Moderator Action Buttons */}
        {isAdminView && user?.id !== userProfile.id && (
          <View style={styles.adminActionButtons}>
            {/* CV Button for admin view */}
            {canViewCV() && (
              <TouchableOpacity
                style={styles.adminCVButton}
                onPress={() => {
                  if (hasCV) {
                    router.push(`/cv-view/${userProfile.id}`);
                  } else {
                    Alert.alert('Bilgi', 'Bu kullanıcının henüz CV\'si bulunmuyor.');
                  }
                }}
                activeOpacity={0.8}
              >
                <FileText size={20} color="#FFFFFF" />
                <Text style={styles.adminCVButtonText}>
                  {hasCV ? 'CV Görüntüle' : 'CV Henüz Yok'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.adminMessageButton}
              onPress={sendMessage}
              activeOpacity={0.8}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.adminMessageButtonText}>Mesaj Gönder</Text>
            </TouchableOpacity>
            
            {/* Friend Request Button for admin view */}
            {friendshipStatus === 'none' && (
              <TouchableOpacity
                style={styles.adminFriendButton}
                onPress={sendFriendRequest}
                activeOpacity={0.8}
              >
                <UserPlus size={20} color="#FFFFFF" />
                <Text style={styles.adminFriendButtonText}>Arkadaş Ekle</Text>
              </TouchableOpacity>
            )}
            
            {friendshipStatus === 'pending' && (
              <View style={styles.adminPendingButton}>
                <Text style={styles.adminPendingButtonText}>İstek Gönderildi</Text>
              </View>
            )}
            
            {friendshipStatus === 'friends' && (
              <View style={styles.adminFriendsButton}>
                <Text style={styles.adminFriendsButtonText}>Arkadaş</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.adminViewButton}
              onPress={() => Alert.alert(
                'Admin Görünümü',
                'Bu kullanıcının tüm bilgilerini görüntülüyorsunuz.',
                [{ text: 'Tamam' }]
              )}
              activeOpacity={0.8}
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.adminViewButtonText}>Admin Görünümü</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Member Since */}
        <View style={styles.memberSince}>
          <Text style={styles.memberSinceText}>
            Üye olma tarihi: {new Date(userProfile.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  institution: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  city: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  adminRoleBadge: {
    backgroundColor: '#DC2626',
  },
  moderatorRoleBadge: {
    backgroundColor: '#059669',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  // Admin Profile Card Styles
  adminProfileCard: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FEF2F2',
  },
  adminCrownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  adminCrown: {
    marginRight: 8,
  },
  adminCrownText: {
    fontSize: 24,
  },
  adminHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  adminAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  adminProfileInfo: {
    alignItems: 'center',
  },
  adminProfileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  adminProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FEF2F2',
    marginBottom: 12,
    textAlign: 'center',
  },
  adminStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  adminStatusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  adminLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminInstitution: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  adminCity: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  adminPowersSection: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  adminPowersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  adminPowersList: {
    alignItems: 'flex-start',
  },
  adminPowerItem: {
    fontSize: 13,
    color: '#FEF2F2',
    marginBottom: 4,
    fontWeight: '500',
  },
  // Moderator Profile Card Styles
  moderatorProfileCard: {
    backgroundColor: '#059669',
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#ECFDF5',
  },
  moderatorShieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moderatorShield: {
    marginRight: 8,
  },
  moderatorHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  moderatorAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  moderatorProfileInfo: {
    alignItems: 'center',
  },
  moderatorProfileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  moderatorProfileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECFDF5',
    marginBottom: 10,
    textAlign: 'center',
  },
  moderatorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 14,
  },
  moderatorStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  moderatorLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  moderatorInstitution: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  moderatorCity: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  moderatorPowersSection: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  moderatorPowersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  moderatorPowersList: {
    alignItems: 'flex-start',
  },
  moderatorPowerItem: {
    fontSize: 11,
    color: '#ECFDF5',
    marginBottom: 3,
    fontWeight: '500',
  },
  aboutSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  cvButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cvButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  messageButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  friendButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  pendingButton: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pendingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  friendsButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  friendsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeFriendButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  removeFriendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  memberSince: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
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
  memberSinceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  adminInfoSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  adminInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  adminInfoItem: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adminInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  blockedStatus: {
    color: '#DC2626',
    fontWeight: '700',
  },
  activeStatus: {
    color: '#059669',
    fontWeight: '700',
  },
  adminRole: {
    color: '#DC2626',
    fontWeight: '700',
  },
  moderatorRole: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  userRole: {
    color: '#6B7280',
    fontWeight: '500',
  },
  verifiedStatus: {
    color: '#059669',
    fontWeight: '700',
  },
  unverifiedStatus: {
    color: '#DC2626',
    fontWeight: '700',
  },
  adminFriendButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  adminFriendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  adminPendingButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  adminPendingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  adminFriendsButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  adminFriendsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  adminActionButtons: {
    marginTop: 16,
    gap: 12,
  },
  adminCVButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  adminCVButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  adminMessageButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminMessageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  adminViewButton: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminViewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
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
});