import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
  Modal,
  FlatList,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, Shield, UserX, Trash2, Crown, Users, MessageCircle, FileText, UserPlus, UserMinus, Eye, ChartBar as BarChart3, Activity, Clock, TrendingUp, Database, Settings, X, Filter, Download, RefreshCw, Edit, ChevronDown, Check, Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { HEALTH_BRANCHES } from '@/lib/constants';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  branch: string;
  city: string;
  institution: string;
  role: 'admin' | 'moderator' | 'user';
  is_blocked: boolean;
  created_at: string;
  last_login: string | null;
  avatar_url: string | null;
}

interface SystemStats {
  totalUsers: number;
  onlineUsers: number;
  moderators: number;
  blockedUsers: number;
  totalPosts: number;
  totalMessages: number;
  totalJobListings: number;
  recentUsers: number;
  activeToday: number;
  messageToday: number;
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [editUserForm, setEditUserForm] = useState({
    first_name: '',
    last_name: '',
    city: '',
    institution: '',
    about: '',
    branch: '',
    avatar_url: '',
    role: 'user' as 'moderator' | 'user',
    is_blocked: false,
  });
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    onlineUsers: 0,
    moderators: 0,
    blockedUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    totalJobListings: 0,
    recentUsers: 0,
    activeToday: 0,
    messageToday: 0,
  });

  // Modal states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showModeratorsModal, setShowModeratorsModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'moderators' | 'blocked' | 'recent'>('all');

  useEffect(() => {
    fetchCurrentUserData();
    fetchUsers();
    fetchStats();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchStats()]);
    setRefreshing(false);
  };

  const fetchCurrentUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .single();

      if (error) throw error;
      setCurrentUserData(data);
    } catch (error) {
      console.error('Error fetching current user data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Check admin access before fetching
      if (currentUserData && currentUserData.role !== 'admin') {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Fetch only active users (not deleted)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as User[] || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      // Direct query instead of RPC function
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          city,
          institution,
          about,
          avatar_url,
          is_blocked,
          created_at,
          updated_at,
          deleted_at,
          deletion_reason,
          deleted_by
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedUsers(data || []);
    } catch (error) {
      console.error('Error fetching deleted users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Check admin access before fetching stats
      if (currentUserData && currentUserData.role !== 'admin') {
        return;
      }
      
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Moderators
      const { count: moderators } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'moderator')
        .eq('is_blocked', false);

      // Blocked users
      const { count: blockedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_blocked', true);

      // Recent users (last 7 days) - Istanbul timezone
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      // Convert to Istanbul timezone
      const istWeekAgo = new Date(weekAgo.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
      
      const { count: recentUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Active today (users with last_login today) - Istanbul timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Convert to Istanbul timezone
      const istToday = new Date(today.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
      
      const { count: activeToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', today.toISOString());

      // Total posts
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Total messages
      const { count: totalMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Total job listings
      const { count: totalJobListings } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Messages today
      const { count: messageToday } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .is('deleted_at', null);

      setStats({
        totalUsers: totalUsers || 0,
        onlineUsers: activeToday || 0,
        moderators: moderators || 0,
        blockedUsers: blockedUsers || 0,
        totalPosts: totalPosts || 0,
        totalMessages: totalMessages || 0,
        totalJobListings: totalJobListings || 0,
        recentUsers: recentUsers || 0,
        activeToday: activeToday || 0,
        messageToday: messageToday || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const promoteToModerator = async (userId: string, userName: string) => {
    Alert.alert(
      'Moderatör Ata',
      `${userName} kullanıcısını moderatör yapmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Moderatör Yap',
          onPress: async () => {
            try {
              // Use secure admin endpoint
              const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-update-user`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  target_user_id: userId,
                  role: 'moderator'
                }),
              });

              const result = await response.json();

              if (!result.success) {
                throw new Error(result.error || 'User promotion failed');
              }

              Alert.alert('Başarılı', `${userName} moderatör yapıldı!`);
              await Promise.all([fetchUsers(), fetchStats()]);
            } catch (error) {
              console.error('Error promoting user:', error);
              Alert.alert('Hata', 'Moderatör atama işlemi başarısız');
            }
          }
        }
      ]
    );
  };

  const demoteFromModerator = async (userId: string, userName: string) => {
    Alert.alert(
      'Moderatörlük Kaldır',
      `${userName} kullanıcısının moderatörlük yetkisini kaldırmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yetkiyi Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  role: 'user',
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);

              if (error) throw error;
              Alert.alert('Başarılı', `${userName} kullanıcısının moderatörlük yetkisi kaldırıldı`);
              await Promise.all([fetchUsers(), fetchStats()]);
            } catch (error) {
              console.error('Error demoting user:', error);
              Alert.alert('Hata', 'Moderatörlük kaldırma işlemi başarısız');
            }
          }
        }
      ]
    );
  };

  const toggleUserBlock = async (userId: string, userName: string, isBlocked: boolean) => {
    // Prevent blocking admin users
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'admin') {
      Alert.alert('Hata', 'Admin kullanıcılar engellenemez');
      return;
    }

    const action = isBlocked ? 'engeli kaldır' : 'engelle';
    Alert.alert(
      `Kullanıcıyı ${action}`,
      `${userName} kullanıcısını ${action}mak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (!isBlocked) {
                // Block user using secure endpoint
                const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-update-user`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    target_user_id: userId,
                    is_blocked: true
                  }),
                });

                const result = await response.json();

                if (!result.success) {
                  throw new Error(result.error || 'User block failed');
                }
                
                Alert.alert('Başarılı', `${userName} engellendi`);
              } else {
                // Unblock user using secure endpoint
                const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/admin-update-user`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    target_user_id: userId,
                    is_blocked: false
                  }),
                });

                const result = await response.json();

                if (!result.success) {
                  throw new Error(result.error || 'User unblock failed');
                }
                
                Alert.alert('Başarılı', `${userName} kullanıcısının engeli kaldırıldı`);
              }

              await Promise.all([fetchUsers(), fetchStats()]);
            } catch (error) {
              console.error('Error toggling user block:', error);
              Alert.alert(
                'Hata',
                `${error instanceof Error ? error.message : 'Kullanıcı engelleme işlemi başarısız oldu'}`
              );
            }
          }
        }
      ]
    );
  };

  const deleteUser = async (userId: string, userName: string) => {
    // Prevent deleting admin users
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'admin') {
      Alert.alert('Hata', 'Admin kullanıcılar silinemez');
      return;
    }

    Alert.alert(
      'Kullanıcıyı Sil',
      `${userName} kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm verileri silinecektir.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              // Soft delete kullanıcı - direct update
              const { error: deleteError } = await supabase
                .from('profiles')
                .update({
                  deleted_at: new Date().toISOString(),
                  deletion_reason: 'Admin tarafından silindi',
                  deleted_by: user?.id
                })
                .eq('id', userId);

              if (deleteError) {
                throw new Error(deleteError.message || 'Kullanıcı silinirken bir hata oluştu');
              }
              
              Alert.alert('Başarılı', `${userName} kullanıcısı silindi`);
              await Promise.all([fetchUsers(), fetchDeletedUsers(), fetchStats()]);
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert(
                'Hata',
                `${error instanceof Error ? error.message : 'Kullanıcı silme işlemi başarısız oldu'}`
              );
            }
          }
        }
      ]
    );
  };

  const restoreUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Kullanıcıyı Geri Yükle',
      `${userName} kullanıcısını geri yüklemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Geri Yükle',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  deleted_at: null,
                  deletion_reason: null,
                  deleted_by: null
                })
                .eq('id', userId);

              if (error) {
                throw new Error(error.message || 'Kullanıcı geri yüklenirken bir hata oluştu');
              }
              
              Alert.alert('Başarılı', `${userName} kullanıcısı geri yüklendi`);
              await Promise.all([fetchUsers(), fetchDeletedUsers(), fetchStats()]);
            } catch (error) {
              console.error('Error restoring user:', error);
              Alert.alert(
                'Hata',
                `${error instanceof Error ? error.message : 'Kullanıcı geri yükleme işlemi başarısız oldu'}`
              );
            }
          }
        }
      ]
    );
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      city: user.city || '',
      institution: user.institution || '',
      about: user.about || '',
      branch: user.branch || '',
      avatar_url: user.avatar_url || '',
      role: user.role === 'admin' ? 'user' : (user.role || 'user'),
      is_blocked: user.is_blocked || false,
    });
    setShowEditUserModal(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      console.log('Updating user:', editingUser.id);
      console.log('Form data:', editUserForm);
      
      // Use direct Supabase update instead of endpoint for now
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: editUserForm.first_name,
          last_name: editUserForm.last_name,
          city: editUserForm.city,
          institution: editUserForm.institution,
          about: editUserForm.about,
          branch: editUserForm.branch,
          avatar_url: editUserForm.avatar_url,
          role: editUserForm.role,
          is_blocked: editUserForm.is_blocked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        throw error;
      }

      Alert.alert('Başarılı', 'Kullanıcı bilgileri güncellendi!');
      setShowEditUserModal(false);
      await Promise.all([fetchUsers(), fetchDeletedUsers(), fetchStats()]);
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Hata', `Kullanıcı güncellenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const permanentDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Kullanıcıyı Kalıcı Olarak Sil',
      `${userName} kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kalıcı Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

              if (error) {
                throw new Error(error.message || 'Kullanıcı kalıcı olarak silinirken bir hata oluştu');
              }
              
              Alert.alert('Başarılı', `${userName} kullanıcısı kalıcı olarak silindi`);
              await Promise.all([fetchUsers(), fetchDeletedUsers(), fetchStats()]);
            } catch (error) {
              console.error('Error permanently deleting user:', error);
              Alert.alert(
                'Hata',
                `${error instanceof Error ? error.message : 'Kullanıcı kalıcı silme işlemi başarısız oldu'}`
              );
            }
          }
        }
      ]
    );
  };

  const exportUserData = async () => {
    try {
      const csvData = users.map(user => ({
        'Ad Soyad': `${user.first_name} ${user.last_name}`,
        'E-posta': user.email,
        'Branş': user.branch,
        'Şehir': user.city,
        'Kurum': user.institution,
        'Rol': user.role,
        'Durum': user.is_blocked ? 'Engelli' : 'Aktif',
        'Kayıt Tarihi': new Date(user.created_at).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }),
        'Son Giriş': user.last_login ? new Date(user.last_login).toLocaleDateString('tr-TR', {
          timeZone: 'Europe/Istanbul'
        }) : 'Hiç'
      }));

      const csvString = Object.keys(csvData[0]).join(',') + '\n' + 
        csvData.map(row => Object.values(row).join(',')).join('\n');

      Alert.alert(
        'Veri Dışa Aktarma',
        `${users.length} kullanıcı verisi hazırlandı`,
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Kopyala', 
            onPress: () => {
              if (Platform.OS === 'web' && navigator.clipboard) {
                navigator.clipboard.writeText(csvString)
                  .then(() => Alert.alert('Başarılı', 'Veriler panoya kopyalandı!'))
                  .catch(() => Alert.alert('Bilgi', 'Veriler hazırlandı'));
              } else {
                Alert.alert('Bilgi', 'Veriler hazırlandı');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Hata', 'Veri dışa aktarılırken hata oluştu');
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

  const getFilteredUsers = (searchTerm: string = '') => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.institution.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filterType) {
      case 'moderators':
        return filtered.filter(user => user.role === 'moderator');
      case 'blocked':
        return filtered.filter(user => user.is_blocked);
      case 'recent':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        // Convert to Istanbul timezone for comparison
        const istWeekAgo = new Date(weekAgo.toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
        return filtered.filter(user => new Date(user.created_at) > istWeekAgo);
      default:
        return filtered;
    }
  };

  const renderDeletedUserItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.userCard, styles.deletedUserCard]}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {item.first_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.deletedInfo}>
              Silindi: {new Date(item.deleted_at).toLocaleDateString('tr-TR')}
            </Text>
            <Text style={styles.deletedReason}>
              Sebep: {item.deletion_reason}
            </Text>
            {item.deleted_by_name && (
              <Text style={styles.deletedBy}>
                Silen: {item.deleted_by_name}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => restoreUser(item.id, `${item.first_name} ${item.last_name}`)}
          >
            <Text style={styles.restoreButtonText}>Geri Yükle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.permanentDeleteButton}
            onPress={() => permanentDeleteUser(item.id, `${item.first_name} ${item.last_name}`)}
          >
            <Text style={styles.permanentDeleteButtonText}>Kalıcı Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUserItem = ({ item }: { item: User }) => {
    // Check if user was online in last 24 hours (Istanbul timezone)
    const isOnline = item.last_login && 
      new Date(item.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    return (
      <View style={[
        styles.userCard,
        item.is_blocked && styles.blockedUserCard,
        item.role === 'admin' && styles.adminUserCard,
        item.role === 'moderator' && styles.moderatorUserCard,
      ]}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              onPress={() => router.push(`/user-profile/${item.id}`)}
              activeOpacity={0.7}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
              ) : (
                <View style={[styles.userAvatar, styles.defaultAvatar]}>
                  <Text style={styles.avatarText}>
                    {item.first_name.charAt(0)}{item.last_name.charAt(0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Status indicators */}
            {isOnline && (
              <View style={styles.onlineIndicator} />
            )}
            
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Crown size={10} color="#FFFFFF" />
              </View>
            )}
            
            {item.role === 'moderator' && (
              <View style={styles.moderatorBadge}>
                <Shield size={10} color="#FFFFFF" />
              </View>
            )}
            
            {item.is_blocked && (
              <View style={styles.blockedBadge}>
                <UserX size={10} color="#FFFFFF" />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.profileViewButton}
              onPress={() => router.push(`/user-profile/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.profileViewIcon}>
                <Eye size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={[
              styles.userName,
              item.is_blocked && styles.blockedText
            ]}>
              {getFormattedName(item.first_name, item.last_name, item.branch)}
            </Text>
            <Text style={styles.userBranch}>{item.branch}</Text>
            <Text style={styles.userLocation}>{item.city} • {item.institution}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userDate}>
              {new Date(item.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {item.role !== 'admin' && (
          <View style={styles.userActions}>
            {/* Moderator management */}
            {item.role === 'user' && !item.is_blocked && currentUserData?.role === 'admin' && (
              <TouchableOpacity
                style={styles.promoteButton}
                onPress={() => {
                  const fullName = `${item.first_name} ${item.last_name}`;
                  promoteToModerator(item.id, fullName);
                }}
              >
                <UserPlus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {item.role === 'moderator' && currentUserData?.role === 'admin' && (
              <TouchableOpacity
                style={styles.demoteButton}
                onPress={() => {
                  const fullName = `${item.first_name} ${item.last_name}`;
                  demoteFromModerator(item.id, fullName);
                }}
              >
                <UserMinus size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Block/Unblock - Both admin and moderator can do this */}
            {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
              <TouchableOpacity
                style={item.is_blocked ? styles.unblockButton : styles.blockButton}
                onPress={() => {
                  const fullName = `${item.first_name} ${item.last_name}`;
                  toggleUserBlock(item.id, fullName, item.is_blocked);
                }}
              >
                <UserX size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Edit - Only admin can edit users */}
            {currentUserData?.role === 'admin' && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditUserModal(item)}
              >
                <Edit size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Delete - Only admin can delete users */}
            {currentUserData?.role === 'admin' && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  const fullName = `${item.first_name} ${item.last_name}`;
                  deleteUser(item.id, fullName);
                }}
              >
                <Trash2 size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Check admin access
  if (currentUserData && currentUserData.role !== 'admin') {
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
          <Text style={styles.accessDeniedText}>Bu sayfaya sadece adminler erişebilir.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Sistem Yönetim Paneli</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <RefreshCw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
          onPress={() => {
            setActiveTab('active');
            fetchUsers();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Aktif Kullanıcılar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'deleted' && styles.activeTab]}
          onPress={() => {
            setActiveTab('deleted');
            fetchDeletedUsers();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'deleted' && styles.activeTabText]}>
            Silinen Kullanıcılar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1F2937']}
            tintColor="#1F2937"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* System Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>📊 Sistem Özeti</Text>
          
          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={[styles.statCard, styles.primaryCard]}
              onPress={() => setShowUsersModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <Users size={24} color="#3B82F6" />
                <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              </View>
              <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
              <Text style={styles.statSubtext}>Tümünü Görüntüle</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, styles.successCard]}
              onPress={() => setShowModeratorsModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <Shield size={24} color="#10B981" />
                <Text style={styles.statNumber}>{stats.moderators}</Text>
              </View>
              <Text style={styles.statLabel}>Moderatör</Text>
              <Text style={styles.statSubtext}>Yönet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, styles.warningCard]}
              onPress={() => {
                setFilterType('blocked');
                setShowUsersModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <UserX size={24} color="#F59E0B" />
                <Text style={styles.statNumber}>{stats.blockedUsers}</Text>
              </View>
              <Text style={styles.statLabel}>Engelli</Text>
              <Text style={styles.statSubtext}>Yönet</Text>
            </TouchableOpacity>

            <View style={[styles.statCard, styles.infoCard]}>
              <View style={styles.statHeader}>
                <Activity size={24} color="#8B5CF6" />
                <Text style={styles.statNumber}>{stats.onlineUsers}</Text>
              </View>
              <Text style={styles.statLabel}>Online</Text>
              <Text style={styles.statSubtext}>Son 24 saat</Text>
            </View>
          </View>

          {/* Secondary Stats */}
          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStatItem}>
              <MessageCircle size={20} color="#6B7280" />
              <Text style={styles.secondaryStatNumber}>{stats.totalMessages}</Text>
              <Text style={styles.secondaryStatLabel}>Mesaj</Text>
            </View>
            
            <View style={styles.secondaryStatItem}>
              <FileText size={20} color="#6B7280" />
              <Text style={styles.secondaryStatNumber}>{stats.totalPosts}</Text>
              <Text style={styles.secondaryStatLabel}>Paylaşım</Text>
            </View>
            
            <View style={styles.secondaryStatItem}>
              <TrendingUp size={20} color="#6B7280" />
              <Text style={styles.secondaryStatNumber}>{stats.recentUsers}</Text>
              <Text style={styles.secondaryStatLabel}>Yeni (7 gün)</Text>
            </View>
            
            <View style={styles.secondaryStatItem}>
              <BarChart3 size={20} color="#6B7280" />
              <Text style={styles.secondaryStatNumber}>{stats.messageToday}</Text>
              <Text style={styles.secondaryStatLabel}>Bugün</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Hızlı İşlemler</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/admin/pending-jobs')}
            >
              <FileText size={20} color="#F59E0B" />
              <Text style={styles.quickActionText}>İş İlanı Onayları</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/admin/pending-events')}
            >
              <Calendar size={20} color="#7C3AED" />
              <Text style={styles.quickActionText}>Etkinlik Onayları</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/admin/manage-drugs')}
            >
              <Database size={20} color="#8B5CF6" />
              <Text style={styles.quickActionText}>İlaç Yönetimi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/admin/manage-algorithms')}
            >
              <Settings size={20} color="#EF4444" />
              <Text style={styles.quickActionText}>Algoritma Yönetimi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={exportUserData}
            >
              <Download size={20} color="#6B7280" />
              <Text style={styles.quickActionText}>Veri Dışa Aktar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Users List based on active tab */}
        {activeTab === 'active' ? (
          <View style={styles.recentUsersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 Aktif Kullanıcılar</Text>
              <TouchableOpacity onPress={() => setShowUsersModal(true)}>
                <Text style={styles.viewAllLink}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1F2937" />
              </View>
            ) : (
              <FlatList
                data={users.slice(0, 5)}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        ) : (
          <View style={styles.recentUsersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🗑️ Silinen Kullanıcılar</Text>
              <Text style={styles.viewAllLink}>{deletedUsers.length} kullanıcı</Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1F2937" />
              </View>
            ) : (
              <FlatList
                data={deletedUsers}
                renderItem={renderDeletedUserItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* All Users Modal */}
      <Modal visible={showUsersModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowUsersModal(false)}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>Kullanıcı Yönetimi ({stats.totalUsers})</Text>
            </View>
            <View style={styles.modalHeaderRight}>
              <TouchableOpacity onPress={() => setShowUsersModal(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search and Filter */}
          <View style={styles.modalControls}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Kullanıcı ara..."
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.filterButtons}>
              {[
                { key: 'all', label: 'Tümü', count: users.length },
                { key: 'moderators', label: 'Moderatör', count: stats.moderators },
                { key: 'blocked', label: 'Engelli', count: stats.blockedUsers },
                { key: 'recent', label: 'Yeni', count: stats.recentUsers },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    filterType === filter.key && styles.activeFilterButton
                  ]}
                  onPress={() => setFilterType(filter.key as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterType === filter.key && styles.activeFilterButtonText
                  ]}>
                    {filter.label} ({filter.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FlatList
            data={getFilteredUsers(modalSearchQuery)}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.modalUsersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1F2937']}
                tintColor="#1F2937"
              />
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditUserModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowEditUserModal(false)}
            >
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Kullanıcı Düzenle</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditUserModal(false)}
            >
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editUserForm} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.editHeader}>
              <View style={styles.editHeaderContent}>
                <Text style={styles.editHeaderTitle}>Kullanıcı Düzenle</Text>
                <Text style={styles.editHeaderSubtitle}>Kullanıcı bilgilerini güncelleyin</Text>
              </View>
            </View>

            {/* Personal Information */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>👤</Text>
                <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
              </View>
              
              <View style={styles.formGrid}>
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Ad Soyad</Text>
                    <View style={styles.nameRow}>
                      <TextInput
                        style={[styles.formInput, styles.nameInput]}
                        value={editUserForm.first_name}
                        onChangeText={(text) => setEditUserForm({...editUserForm, first_name: text})}
                        placeholder="Ad"
                      />
                      <TextInput
                        style={[styles.formInput, styles.nameInput]}
                        value={editUserForm.last_name}
                        onChangeText={(text) => setEditUserForm({...editUserForm, last_name: text})}
                        placeholder="Soyad"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Şehir</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editUserForm.city}
                      onChangeText={(text) => setEditUserForm({...editUserForm, city: text})}
                      placeholder="Şehir"
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Kurum</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editUserForm.institution}
                      onChangeText={(text) => setEditUserForm({...editUserForm, institution: text})}
                      placeholder="Kurum"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Branş/Ünvan</Text>
                  <TouchableOpacity
                    style={styles.branchSelector}
                    onPress={() => setShowBranchModal(true)}
                  >
                    <Text style={[
                      styles.branchSelectorText,
                      !editUserForm.branch && styles.branchSelectorPlaceholder
                    ]}>
                      {editUserForm.branch || 'Branş seçin'}
                    </Text>
                    <ChevronDown size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Hakkında</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={editUserForm.about}
                    onChangeText={(text) => setEditUserForm({...editUserForm, about: text})}
                    placeholder="Kendiniz hakkında kısa bir açıklama..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Profil Fotoğrafı</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editUserForm.avatar_url}
                    onChangeText={(text) => setEditUserForm({...editUserForm, avatar_url: text})}
                    placeholder="https://example.com/photo.jpg"
                  />
                </View>
              </View>
            </View>

            {/* Account Settings */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚙️</Text>
                <Text style={styles.sectionTitle}>Hesap Ayarları</Text>
              </View>
              
              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Kullanıcı Rolü</Text>
                  <View style={styles.roleContainer}>
                    {[
                      { value: 'user', label: 'Kullanıcı', icon: '👤', color: '#6B7280' },
                      { value: 'moderator', label: 'Moderatör', icon: '🛡️', color: '#3B82F6' }
                    ].map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.roleButton,
                          editUserForm.role === role.value && styles.roleButtonSelected
                        ]}
                        onPress={() => setEditUserForm({...editUserForm, role: role.value as 'moderator' | 'user'})}
                      >
                        <Text style={styles.roleIcon}>{role.icon}</Text>
                        <Text style={[
                          styles.roleText,
                          editUserForm.role === role.value && styles.roleTextSelected
                        ]}>
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Hesap Durumu</Text>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      editUserForm.is_blocked && styles.statusButtonBlocked
                    ]}
                    onPress={() => setEditUserForm({...editUserForm, is_blocked: !editUserForm.is_blocked})}
                  >
                    <View style={styles.statusContent}>
                      <Text style={styles.statusIcon}>
                        {editUserForm.is_blocked ? '🚫' : '✅'}
                      </Text>
                      <View style={styles.statusTextContainer}>
                        <Text style={[
                          styles.statusText,
                          editUserForm.is_blocked && styles.statusTextBlocked
                        ]}>
                          {editUserForm.is_blocked ? 'Engelli' : 'Aktif'}
                        </Text>
                        <Text style={[
                          styles.statusSubtext,
                          editUserForm.is_blocked && styles.statusSubtextBlocked
                        ]}>
                          {editUserForm.is_blocked ? 'Hesap engellenmiş' : 'Hesap aktif'}
                        </Text>
                      </View>
                      <View style={[
                        styles.toggleSwitch,
                        editUserForm.is_blocked && styles.toggleSwitchActive
                      ]}>
                        <View style={[
                          styles.toggleButton,
                          editUserForm.is_blocked && styles.toggleButtonActive
                        ]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowEditUserModal(false)}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleEditUser}>
                <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Branch Selection Modal */}
      <Modal
        visible={showBranchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.branchModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Branş Seçin</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Branş ara..."
                value={branchSearchQuery}
                onChangeText={setBranchSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <FlatList
              data={HEALTH_BRANCHES.filter(branch => 
                branch.toLowerCase().includes(branchSearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    editUserForm.branch === item && styles.selectedOption
                  ]}
                  onPress={() => {
                    setEditUserForm({...editUserForm, branch: item});
                    setShowBranchModal(false);
                    setBranchSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    editUserForm.branch === item && styles.selectedOptionText
                  ]}>
                    {item}
                  </Text>
                  {editUserForm.branch === item && (
                    <Check size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Moderators Modal */}
      <Modal visible={showModeratorsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowModeratorsModal(false)}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalTitle}>Moderatör Yönetimi ({stats.moderators})</Text>
            </View>
            <View style={styles.modalHeaderRight}>
              <TouchableOpacity onPress={() => setShowModeratorsModal(false)}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalControls}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Moderatör ara..."
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <FlatList
            data={getFilteredUsers(modalSearchQuery).filter(u => u.role === 'moderator')}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.modalUsersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#10B981']}
                tintColor="#10B981"
              />
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overviewSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: '#6B7280',
  },
  secondaryStats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryStatItem: {
    alignItems: 'center',
  },
  secondaryStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 2,
  },
  secondaryStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickActionsSection: {
    marginTop: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  recentUsersSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  blockedUserCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  adminUserCard: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  moderatorUserCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  defaultAvatar: {
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moderatorBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  blockedText: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  // Deleted user styles
  deletedUserCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  deletedInfo: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  deletedReason: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  deletedBy: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  restoreButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  restoreButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  permanentDeleteButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  permanentDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  userBranch: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
  },
  promoteButton: {
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoteButton: {
    backgroundColor: '#F59E0B',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockButton: {
    backgroundColor: '#EF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockButton: {
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalBackButton: {
    marginRight: 12,
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalHeaderLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modalHeaderRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  editModalHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalControls: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  modalUsersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileViewButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileViewIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Edit User Modal Styles
  editUserForm: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  backButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Modern Edit User Modal Styles
  editHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  editHeaderContent: {
    alignItems: 'center',
  },
  editHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  editHeaderSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  formGrid: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nameInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Branch Selector
  branchScrollView: {
    maxHeight: 200,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
  },
  branchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  branchChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  branchChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  branchChipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  // Role Buttons
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  roleButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  roleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  roleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  roleTextSelected: {
    color: '#1D4ED8',
  },
  // Status Button
  statusButton: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  statusButtonBlocked: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  statusTextBlocked: {
    color: '#DC2626',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusSubtextBlocked: {
    color: '#B91C1C',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#FCA5A5',
  },
  toggleButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },
  // Action Buttons
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Branch Selector
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  branchSelectorText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  branchSelectorPlaceholder: {
    color: '#9CA3AF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  branchModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  optionsList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  selectedOptionText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});