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
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Settings, MapPin, Building, Users, CreditCard as Edit, Camera, Shield, Key, Download, Trash2, Gift } from 'lucide-react-native';
// Ana sayfada görsel yükleme yok - sadece Profile ve Posts bölümlerinde
import { LogOut } from 'lucide-react-native';
import { FileText } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
// ImagePicker removed - using mock implementation
import { getFriendCount } from '@/lib/friendUtils';
import RedBorderedBanner from '@/components/RedBorderedBanner';
import RewardedAdModal from '@/components/RewardedAdModal';
import { adService } from '@/lib/adService';

interface Algorithm {
  id: string;
  title: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  content: Record<string, unknown>;
}

interface Drug {
  id: string;
  name: string;
  active_ingredient: string;
  category: string;
  company: string;
  content: Record<string, unknown>;
}

export default function HomePage() {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [hasJobAccess, setHasJobAccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeModerators: 0,
    blockedUsers: 0,
  });
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    city: '',
    institution: '',
    about: '',
    avatar_url: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [userProfile] = useState({
    name: 'Kullanıcı',
    title: 'İlk ve Acil Yardım Teknikeri',
    institution: 'Kurum Bilgisi Yok',
    city: 'Şehir Bilgisi Yok',
    about: 'Acil tıp alanında 5 yıllık deneyime sahip, hasta bakımı ve acil müdahale konularında uzmanlaşmış bir sağlık profesyoneliyim.',
    avatar: 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  });

  // Fetch real data from database
  useEffect(() => {
    // Only fetch data when user is authenticated
    if (user) {
      fetchCounts();
      fetchOfflineData(); // This will update algorithms and drugs state
    }
    
    // Initialize AdMob
    console.log('🎬 Home: Initializing AdMob...');
    adService.initializeAdMob();
    
    // Real-time subscriptions for data updates
    let algorithmsSubscription: any, drugsSubscription: any, profilesSubscription: any;
    
    if (user) {
      algorithmsSubscription = supabase
        .channel('algorithms_changes_home')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'algorithms'
          }, 
          () => {
            console.log('🔄 HomePage: Algorithms updated, refreshing...');
            fetchOfflineData(); // Refresh when data changes
          }
        )
        .subscribe();

      drugsSubscription = supabase
        .channel('drugs_changes_home')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'drugs'
          }, 
          () => {
            console.log('🔄 HomePage: Drugs updated, refreshing...');
            fetchOfflineData(); // Refresh when data changes
          }
        )
        .subscribe();

      // Admin stats real-time subscription
      if (currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') {
        profilesSubscription = supabase
          .channel('profiles_changes_home')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'profiles'
            }, 
            () => {
              console.log('🔄 HomePage: Profiles updated, refreshing admin stats...');
              fetchAdminStats(); // Refresh admin stats when profiles change
            }
          )
          .subscribe();
      }
    }

    return () => {
      if (algorithmsSubscription) algorithmsSubscription.unsubscribe();
      if (drugsSubscription) drugsSubscription.unsubscribe();
      if (profilesSubscription) profilesSubscription.unsubscribe();
    };
  }, [user]);

  const fetchCounts = async () => {
    try {
      if (user?.id) {
        const friendCount = await getFriendCount(user.id);
        setFriendCount(friendCount);
        
        // Get posts count
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (postsError) {
          console.error('Error fetching posts count:', postsError);
        } else {
          setPostsCount(postsCount || 0);
        }
        
        // Get job applications count
        const { count: applicationsCount, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (applicationsError) {
          console.error('Error fetching applications count:', applicationsError);
        } else {
          setApplicationsCount(applicationsCount || 0);
        }
        
        // Get admin stats if user is admin/moderator
        if (currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') {
          await fetchAdminStats();
        }
      }
    } catch (error) {
      console.error('Error in fetchCounts:', error);
      // Set default values on error
      setFriendCount(0);
      setPostsCount(0);
      setApplicationsCount(0);
    }
  };

  const fetchOfflineData = async () => {
    try {
      setDataLoading(true);
      console.log('🔄 HomePage: Fetching offline data...');
      
      // Algoritmaları çek
      const { data: algorithmsData, error: algorithmsError } = await supabase
        .from('algorithms')
        .select('*')
        .order('urgency', { ascending: false })
        .order('title', { ascending: true });

      if (algorithmsError) {
        console.error('Error fetching algorithms:', algorithmsError);
        console.log('❌ HomePage: Algorithms fetch failed');
        setAlgorithms([]);
      } else {
        console.log('✅ HomePage: Algorithms fetched:', algorithmsData?.length || 0);
        setAlgorithms((algorithmsData || []).map(item => ({
          ...item,
          content: item.content as Record<string, unknown>
        })) as Algorithm[]);
      }

      // İlaçları çek
      const { data: drugsData, error: drugsError } = await supabase
        .from('drugs')
        .select('*')
        .order('name', { ascending: true });

      if (drugsError) {
        console.error('Error fetching drugs:', drugsError);
        console.log('❌ HomePage: Drugs fetch failed');
        setDrugs([]);
      } else {
        console.log('✅ HomePage: Drugs fetched:', drugsData?.length || 0);
        setDrugs((drugsData || []).map(item => ({
          ...item,
          content: item.content as Record<string, unknown>
        })) as Drug[]);
      }
    } catch (error) {
      console.error('Error fetching offline data:', error);
      setAlgorithms([]);
      setDrugs([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchCurrentUserData = async () => {
    try {
      console.log('🔍 Home: Fetching user data for ID:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      
      console.log('🔍 Home: Fetched user data:', data);
      console.log('🔍 Home: User role:', data?.role);
      
      if (data) {
        setCurrentUserData(data);
        setEditForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          city: data.city || '',
          institution: data.institution || '',
          about: data.about || userProfile.about,
          avatar_url: data.avatar_url || '',
        });
      } else {
        console.log('❌ Home: No user data found');
        setCurrentUserData(null);
        setEditForm({
          first_name: '',
          last_name: '',
          city: '',
          institution: '',
          about: userProfile.about,
          avatar_url: '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
      checkJobAccess();
    }
  }, [user]);

  // Check if user has access to jobs
  const checkJobAccess = () => {
    if (currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') {
      console.log('✅ Home: Admin/Moderator access granted');
      setHasJobAccess(true);
    } else {
      console.log('🎬 Home: Regular user, will show ad on every entry');
      // Her girişte reklam göster (24 saat erişim yok)
      setHasJobAccess(false);
    }
  };

  // Handle ad reward
  const handleAdReward = () => {
    setHasJobAccess(true);
    setShowAdModal(false);
    router.push('/jobs');
  };

  // Handle job access
  const handleJobAccess = () => {
    if (hasJobAccess) {
      router.push('/jobs');
      return;
    }
    
    console.log('🎬 Home: Showing ad modal immediately');
    // Modal'ı hemen göster, reklam durumunu kontrol etme
    setShowAdModal(true);
    
    // Arka planda reklamı yükle
    if (!adService.isAdReady()) {
      console.log('⏳ Home: Preloading ad in background...');
      adService.preloadAdJobs();
    }
  };

  // Admin stats refresh effect
  useEffect(() => {
    if (user && currentUserData && (currentUserData.role === 'admin' || currentUserData.role === 'moderator')) {
      console.log('🔄 Refreshing admin stats...');
      fetchAdminStats();
    }
  }, [user, currentUserData]);

  const handleEditProfile = async () => {
    try {
      // Use secure endpoint that filters sensitive fields
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          city: editForm.city,
          institution: editForm.institution,
          about: editForm.about,
          avatar_url: editForm.avatar_url,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Profile update failed');
      }

      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi!');
      setShowEditModal(false);
      fetchCurrentUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken hata oluştu');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Şifre değiştirilirken hata oluştu: ${errorMessage}`);
    }
  };

  // Ana sayfada görsel yükleme yok - Profile bölümünde yapılacak

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz silinecek.\n\nEmin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Son Onay',
              'Hesabınızı silmek için "SİL" yazın:',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Devam Et',
                  style: 'destructive',
                  onPress: () => {
                    Alert.prompt(
                      'Hesap Silme Onayı',
                      'Hesabınızı silmek için "SİL" yazın:',
                      [
                        { text: 'İptal', style: 'cancel' },
                        {
                          text: 'Hesabı Sil',
                          style: 'destructive',
                          onPress: async (inputText) => {
                            if (inputText?.toUpperCase() === 'SİL') {
                              try {
                                await supabase
                                  .from('chat_messages')
                                  .delete()
                                  .eq('user_id', user?.id || '');

                                await supabase
                                  .from('chat_room_members')
                                  .delete()
                                  .eq('user_id', user?.id || '');

                                const { error: profileError } = await supabase
                                  .from('profiles')
                                  .delete()
                                  .eq('id', user?.id || '');

                                if (profileError) {
                                  throw profileError;
                                }

                                await signOut();
                                Alert.alert('Başarılı', 'Hesabınız başarıyla silindi');
                                router.replace('/auth/login');
                              } catch (error) {
                                console.error('Error deleting account:', error);
                                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
                                Alert.alert('Hata', `Hesap silinirken hata oluştu: ${errorMessage}`);
                              }
                            } else {
                              Alert.alert('Hata', 'Onay metni yanlış. Hesap silinmedi.');
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const downloadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .single();

      if (error) throw error;

      const userData = {
        'Ad Soyad': `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        'E-posta': data.email || '',
        'Branş': data.branch || '',
        'Şehir': data.city || '',
        'Kurum': data.institution || '',
        'Rol': data.role || 'user',
        'Hakkında': data.about || '',
        'Kayıt Tarihi': data.created_at ? new Date(data.created_at).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : '',
        'Son Güncelleme': data.updated_at ? new Date(data.updated_at).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : '',
        'Son Giriş': data.last_login ? new Date(data.last_login).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : 'Bilinmiyor'
      };

      const formattedData = Object.entries(userData)
        .map(([key, value]) => `${key}: ${value || 'Belirtilmemiş'}`)
        .join('\n');

      Alert.alert(
        'Kişisel Verileriniz',
        formattedData,
        [
          { text: 'Kapat', style: 'cancel' },
          { 
            text: 'Kopyala', 
            onPress: () => {
              if (Platform.OS === 'web' && navigator.clipboard) {
                navigator.clipboard.writeText(formattedData)
                  .then(() => Alert.alert('Başarılı', 'Verileriniz panoya kopyalandı!'))
                  .catch(() => Alert.alert('Bilgi', 'Verileriniz yukarıda görüntüleniyor'));
              } else {
                Alert.alert('Bilgi', 'Verileriniz yukarıda görüntüleniyor');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error downloading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Veri indirilirken hata oluştu: ${errorMessage}`);
    }
  };

  const fetchAdminStats = async () => {
    try {
      console.log('🔄 Fetching admin stats...');
      
      // Get total users count
      const { count: totalUsers, error: totalUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalUsersError) {
        console.error('❌ Error fetching total users:', totalUsersError);
      } else {
        console.log('✅ Total users:', totalUsers);
      }

      // Get active moderators count
      const { count: activeModerators, error: moderatorsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'moderator')
        .eq('is_blocked', false);

      if (moderatorsError) {
        console.error('❌ Error fetching active moderators:', moderatorsError);
      } else {
        console.log('✅ Active moderators:', activeModerators);
      }

      // Get blocked users count
      const { count: blockedUsers, error: blockedUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_blocked', true);

      if (blockedUsersError) {
        console.error('❌ Error fetching blocked users:', blockedUsersError);
      } else {
        console.log('✅ Blocked users:', blockedUsers);
      }

      const newStats = {
        totalUsers: totalUsers || 0,
        activeModerators: activeModerators || 0,
        blockedUsers: blockedUsers || 0,
      };

      console.log('📊 Final admin stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ Error fetching admin stats:', error);
      // Set default values on error
      setStats({
        totalUsers: 0,
        activeModerators: 0,
        blockedUsers: 0,
      });
    }
  };

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

  const quickActions = [
    {
      id: 'chat',
      title: 'Kariyer Sohbetleri',
      subtitle: 'Branş arkadaşlarınızla sohbet edin',
      icon: '💬',
      color: '#10B981',
      onPress: () => router.push('/chat-rooms'),
    },
    {
      id: 'jobs',
      title: 'Kariyer Sağlık İş İlanları',
      subtitle: 'İş ilanları ve kariyer fırsatları',
      icon: '💼',
      color: '#3B82F6',
      onPress: handleJobAccess,
    },
    {
      id: 'algorithms',
      title: 'Tedavi Algoritmaları',
      subtitle: dataLoading ? 'Yükleniyor...' : algorithms.length > 0 ? `${algorithms.length} algoritma mevcut` : 'Veri bulunamadı',
      icon: '📋',
      color: '#DC2626',
      onPress: () => {
        router.push('/treatment-algorithms');
      },
    },
    {
      id: 'drugs',
      title: 'İlaç Prospektüsleri',
      subtitle: dataLoading ? 'Yükleniyor...' : drugs.length > 0 ? `${drugs.length} ilaç mevcut` : 'Veri bulunamadı',
      icon: '💊',
      color: '#7C3AED',
      onPress: () => {
        router.push('/drug-prospectus');
      },
    },
  ];

  const adminActions = [
    {
      id: 'admin',
      title: 'Admin Paneli',
      subtitle: 'Kullanıcı yönetimi',
      icon: '👑',
      color: '#DC2626',
      onPress: () => router.push('/admin-panel'),
    },
  ];

  const settingsOptions = [
    {
      id: 'edit',
      title: 'Profili Düzenle',
      icon: Edit,
      onPress: () => setShowEditModal(true),
    },
    {
      id: 'photo',
      title: 'Profil Fotoğrafını Değiştir',
      icon: Camera,
      onPress: () => {
        Alert.alert('Bilgi', 'Profil fotoğrafını değiştirmek için Profile bölümüne gidin.');
      },
    },
    {
      id: 'password',
      title: 'Şifre Değiştir',
      icon: Key,
      onPress: () => setShowPasswordModal(true),
    },
    {
      id: 'data',
      title: 'Verilerimi İndir',
      icon: Download,
      onPress: downloadUserData,
    },
    {
      id: 'privacy',
      title: 'Gizlilik Politikası',
      icon: Shield,
      onPress: () => router.push('/privacy-policy'),
    },
    {
      id: 'terms',
      title: 'Kullanım Şartları',
      icon: FileText,
      onPress: () => router.push('/terms-of-service'),
    },
    {
      id: 'notifications',
      title: 'Bildirim Ayarları',
      icon: Settings,
      onPress: () => router.push('/notification-settings'),
    },
    {
      id: 'logout',
      title: 'Çıkış Yap',
      icon: LogOut,
      onPress: () => {
        Alert.alert(
          'Çıkış Yap',
          'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Çıkış Yap',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('Signing out from home page...');
                  await signOut();
                  console.log('Sign out completed, redirecting...');
                  router.replace('/auth/login');
                } catch (error) {
                  console.error('Logout error:', error);
                  // Force redirect even on error
                  router.replace('/auth/login');
                }
              }
            }
          ]
        );
      },
    },
    {
      id: 'delete',
      title: 'Hesabı Sil',
      icon: Trash2,
      onPress: handleDeleteAccount,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerTitle}>Ana Sayfa</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Actions Grid */}
        <View style={styles.actionsGrid}>
          <View style={styles.gridRow}>
            {quickActions.slice(0, 2).map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <View style={styles.actionInfo}>
                  {action.id === 'jobs' ? (
                    <>
                      <Text style={styles.actionTitle}>Kariyer Sağlık İş İlanları</Text>
                      <Text style={styles.actionSubtitle}>İş ilanları ve kariyer fırsatları</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.gridRow}>
            {quickActions.slice(2, 4).map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <View style={styles.actionInfo}>
                  {action.id === 'jobs' ? (
                    <>
                      <Text style={styles.actionTitle}>Kariyer Sağlık İş İlanları</Text>
                      <Text style={styles.actionSubtitle}>İş ilanları ve kariyer fırsatları</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Banner Reklam - Tedavi Algoritmaları ve İlaç Prospektüsleri altında */}
          <View style={styles.bannerSection}>
            <RedBorderedBanner />
          </View>
        </View>

        {/* Admin Actions - Only show for admin/moderator users */}
        {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
          <View style={styles.section}>
            <View style={styles.adminPanelCard}>
              <TouchableOpacity 
                style={styles.adminHeader}
                onPress={() => router.push('/admin-panel')}
                activeOpacity={0.8}
              >
                <View style={styles.adminBadge}>
                  <Shield size={16} color="#FFFFFF" />
                  <Text style={styles.adminBadgeText}>
                    {currentUserData?.role === 'admin' ? 'ADMIN' : 'MODERATÖR'}
                  </Text>
                </View>
                <Text style={styles.adminTitle}>Yönetim Paneli</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminStats}
                onPress={() => router.push('/admin-panel')}
                activeOpacity={0.8}
              >
                <View style={styles.adminStatItem}>
                  <Text style={styles.adminStatNumber}>{stats.totalUsers}</Text>
                  <Text style={styles.adminStatLabel}>Toplam Kullanıcı</Text>
                </View>
                <View style={styles.adminStatDivider} />
                <View style={styles.adminStatItem}>
                  <Text style={styles.adminStatNumber}>{stats.activeModerators}</Text>
                  <Text style={styles.adminStatLabel}>Aktif Moderatör</Text>
                </View>
                <View style={styles.adminStatDivider} />
                <View style={styles.adminStatItem}>
                  <Text style={styles.adminStatNumber}>{stats.blockedUsers}</Text>
                  <Text style={styles.adminStatLabel}>Engelli Hesap</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminPanelButton}
                onPress={() => router.push('/admin-panel')}
                activeOpacity={0.8}
              >
                <Shield size={20} color="#FFFFFF" />
                <Text style={styles.adminPanelButtonText}>Yönetim Paneline Git</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Menu */}
        {showSettings && (
          <View style={styles.settingsMenu}>
            <Text style={styles.settingsTitle}>Ayarlar</Text>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.settingsOption,
                  option.danger && styles.dangerOption,
                ]}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                {(() => {
                  const IconComponent = option.icon;
                  return (
                    <IconComponent 
                      size={20} 
                      color={option.danger ? '#DC2626' : '#374151'} 
                    />
                  );
                })()}
                <Text 
                  style={[
                    styles.settingsOptionText,
                    option.danger && styles.dangerText,
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ad</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={editForm.first_name}
                  editable={false}
                  placeholder="Adınız"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>Ad değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Soyad</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={editForm.last_name}
                  editable={false}
                  placeholder="Soyadınız"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>Soyad değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Branş</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.modalInput, styles.lockedInput]}
                  value={currentUserData?.branch || ''}
                  editable={false}
                  placeholder="Branşınız"
                />
                <View style={styles.lockIcon}>
                  <Text style={styles.lockText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.inputHint}>Branş değiştirilemez</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şehir</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.city}
                onChangeText={(text) => setEditForm({...editForm, city: text})}
                placeholder="Çalıştığınız şehir"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kurum</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.institution}
                onChangeText={(text) => setEditForm({...editForm, institution: text})}
                placeholder="Çalıştığınız kurum"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hakkında</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={editForm.about}
                onChangeText={(text) => setEditForm({...editForm, about: text})}
                placeholder="Kendiniz hakkında bilgi"
                multiline
                numberOfLines={4}
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleEditProfile}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mevcut Şifre</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                placeholder="Mevcut şifreniz"
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yeni Şifre</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                placeholder="Yeni şifreniz"
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yeni Şifre Tekrar</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                placeholder="Yeni şifrenizi tekrar girin"
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>Şifreyi Değiştir</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardEarned={handleAdReward}
        title="İş İlanlarına Erişim"
        description="Kısa bir reklam izleyerek iş ilanlarına erişim kazanın!"
        rewardText="İş ilanlarına erişim"
        adType="jobs"
      />
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 140,
    maxHeight: 140,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {},
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginTop: 24,
  },
  actionsGrid: {
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#EF4444',
    borderRadius: 20,
    padding: 24,
    width: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 40,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  actionInfo: {
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  adminPanelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10, // Banner'dan daha yüksek elevation
    zIndex: 10, // Banner'dan daha yüksek z-index
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  adminHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
  },
  adminStats: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  adminStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  adminStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  adminStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  adminStatDivider: {
    width: 1,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 12,
  },
  adminStatsButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  adminStatsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  adminPanelButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  adminPanelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  settingsMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    paddingVertical: 8,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  settingsOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerOption: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dangerText: {
    color: '#DC2626',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  lockedInputContainer: {
    position: 'relative',
  },
  lockedInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    paddingRight: 40,
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  adminPanelHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerSection: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});