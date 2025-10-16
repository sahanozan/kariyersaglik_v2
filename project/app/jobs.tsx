import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Search, Plus, MapPin, Building, Filter, X, Gift } from 'lucide-react-native';
import { MoveVertical as MoreVertical, Trash2, UserX } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { handleSupabaseError } from '@/lib/utils';
import RewardedAdModal from '@/components/RewardedAdModal';
import { adService } from '@/lib/adService';

interface JobListing {
  id: string;
  title: string;
  institution: string;
  city: string;
  branch: string;
  contact_person: string;
  phone: string;
  email: string;
  created_at: string;
  posted_by: string;
  is_approved: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function JobsPage() {
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [searchCity, setSearchCity] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showBranchFilter, setShowBranchFilter] = useState(false);
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdModal, setShowAdModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
      checkAccess();
    }
    fetchJobListings();
  }, []);

  // Sayfa her odaklandığında erişimi kontrol et
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎬 Jobs: Page focused, checking access...');
      if (user && currentUserData) {
        checkAccess();
      }
    }, [user, currentUserData])
  );

  // Check if user has access to jobs (admin, moderator, or has watched ad)
  const checkAccess = () => {
    console.log('🔍 Jobs: checkAccess called, user role:', currentUserData?.role);
    
    // Admin/Moderator kontrolü
    if (currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') {
      console.log('✅ Jobs: Admin/Moderator access granted');
      setHasAccess(true);
    } else {
      console.log('🎬 Jobs: Regular user, showing ad on every entry');
      // Her girişte reklam göster (24 saat erişim yok)
      setHasAccess(false);
      // Show ad modal immediately
      console.log('🎬 Jobs: Showing ad modal immediately');
      setShowAdModal(true);
      
      // Arka planda reklamı yükle
      if (!adService.isAdReadyJobs()) {
        console.log('⏳ Jobs: Preloading ad in background...');
        adService.preloadAdJobs();
      }
    }
  };

  // Handle ad reward
  const handleAdReward = () => {
    console.log('🎉 Jobs: Ad reward earned, granting access');
    setHasAccess(true);
    setAdWatched(true);
    setShowAdModal(false);
    // No need to store in localStorage since we show ad on every entry
  };

  // Handle job access
  const handleJobAccess = () => {
    if (hasAccess) {
      return; // Already has access
    }
    
    console.log('🎬 Jobs: Checking ad readiness...');
    console.log('🎬 Jobs: Ad ready status:', adService.isAdReadyJobs());
    
    if (adService.isAdReadyJobs()) {
      console.log('✅ Jobs: Ad is ready, showing modal');
      setShowAdModal(true);
    } else {
      console.log('⏳ Jobs: Ad not ready, preloading...');
      adService.preloadAdJobs();
      
      // 3 saniye bekle ve tekrar kontrol et
      setTimeout(() => {
        console.log('🎬 Jobs: Re-checking ad after preload...');
        if (adService.isAdReadyJobs()) {
          console.log('✅ Jobs: Ad is now ready, showing modal');
          setShowAdModal(true);
        } else {
          console.log('❌ Jobs: Ad still not ready, showing error');
          Alert.alert(
            'Reklam Hazır Değil',
            'Reklam yükleniyor. Lütfen birkaç saniye bekleyin ve tekrar deneyin.',
            [{ text: 'Tamam' }]
          );
        }
      }, 3000);
    }
  };

  const fetchCurrentUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      setCurrentUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchJobListings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          profiles!job_listings_posted_by_fkey(first_name, last_name)
        `)
        .eq('is_active', true);

      // Regular users only see approved jobs
      if (!currentUserData || 
          (currentUserData.role !== 'admin' && currentUserData.role !== 'moderator')) {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setJobListings((data || []) as JobListing[]);
    } catch (error) {
      console.error('Error fetching job listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const showJobOptions = (job: JobListing) => {
    // Admin ve moderatör kontrolü
    const isAdmin = currentUserData?.role === 'admin';
    const isModerator = currentUserData?.role === 'moderator';
    
    if (!isAdmin && !isModerator) {
      return;
    }

    const options = [
      { text: 'İptal', style: 'cancel' as const },
      {
        text: 'Detayları Görüntüle',
        style: 'default' as const,
        onPress: () => router.push(`/job-detail/${job.id}`)
      }
    ];

    // Onay seçenekleri
    if (!job.is_approved) {
      options.push({
        text: 'İlanı Onayla',
        style: 'default' as const,
        onPress: () => approveJobListing(job.id, job.title)
      });
    }

    // Silme seçeneği
    options.push({
      text: 'İlanı Sil',
      style: 'default' as const,
      onPress: () => handleDeleteJob(job.id, job.title)
    });

    // Kullanıcı engelleme seçeneği
    if ((isAdmin || isModerator) && job.posted_by !== user?.id) {
      options.push({
        text: 'İş Vereni Engelle',
        style: 'default' as const,
        onPress: () => {
          const fullName = `${job.profiles?.first_name || 'Bilinmeyen'} ${job.profiles?.last_name || 'Kullanıcı'}`;
          handleBlockJobPoster(job.posted_by, fullName);
        }
      });
    }

    Alert.alert(
      'İş İlanı İşlemleri',
      `${job.profiles?.first_name || 'Bilinmeyen'} ${job.profiles?.last_name || 'Kullanıcı'} tarafından paylaşılan iş ilanı`,
      options
    );
  };

  const approveJobListing = async (jobId: string, jobTitle: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (currentUserData?.role !== 'admin' && currentUserData?.role !== 'moderator') {
      Alert.alert('Hata', 'Bu işlem için yetkiniz bulunmuyor');
      return;
    }

    Alert.alert(
      'İş İlanını Onayla',
      `"${jobTitle}" başlıklı iş ilanını onaylamak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('job_listings')
                .update({
                  is_approved: true,
                  approved_by: user?.id,
                  approved_at: new Date().toISOString()
                })
                .eq('id', jobId);

              if (error) {
                throw error;
              }

              Alert.alert('Başarılı', 'İş ilanı onaylandı ve yayınlandı');
              fetchJobListings(); // Refresh job listings
            } catch (error) {
              console.error('Error approving job:', error);
              Alert.alert('Hata', handleSupabaseError(error));
            }
          }
        }
      ]
    );
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (currentUserData?.role !== 'admin' && currentUserData?.role !== 'moderator') {
      Alert.alert('Hata', 'Bu işlem için yetkiniz bulunmuyor');
      return;
    }

    Alert.alert(
      'İş İlanını Sil',
      `"${jobTitle}" başlıklı iş ilanını silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('job_listings')
                .delete()
                .eq('id', jobId);

              if (error) {
                throw error;
              }

              Alert.alert('Başarılı', 'İş ilanı silindi');
              fetchJobListings(); // Refresh job listings
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Hata', handleSupabaseError(error));
            }
          }
        }
      ]
    );
  };

  const handleBlockJobPoster = async (userId: string, userName: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (currentUserData?.role !== 'admin' && currentUserData?.role !== 'moderator') {
      Alert.alert('Hata', 'Sadece adminler ve moderatörler kullanıcı engelleyebilir');
      return;
    }

    // Don't allow blocking admin users
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (targetUser?.role === 'admin') {
      Alert.alert('Hata', 'Admin kullanıcılar engellenemez');
      return;
    }

    Alert.alert(
      'İş Vereni Engelle',
      `${userName} kullanıcısını engellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: true })
                .eq('id', userId);

              if (error) throw error;

              Alert.alert('Başarılı', `${userName} engellendi`);
              fetchJobListings(); // Refresh job listings
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Hata', handleSupabaseError(error));
            }
          }
        }
      ]
    );
  };

  const branches = [
    'Doktor',
    'Diş Hekimi',
    'Eczacı',
    'Hemşire',
    'Fizyoterapi ve Rehabilitasyon',
    'Ebe',
    'İlk ve Acil Yardım (Paramedik)',
    'Anestezi Teknikeri',
    'Ameliyathane Teknisyeni',
    'Tıbbi Görüntüleme Teknisyeni',
    'Tıbbi Laboratuvar Teknisyeni',
    'Diyaliz Teknisyeni',
    'Optisyen',
    'Odyolog',
    'Radyoterapi Teknisyeni',
    'Çocuk Gelişimi Uzmanı',
    'Yaşlı Bakım Teknisyeni',
    'Tıbbi Sekreter',
    'Perfüzyon Teknisyeni',
    'Beslenme ve Diyetetik',
  ];

  const filteredJobs = jobListings.filter(job => {
    const cityMatch = !searchCity || job.city.toLowerCase().includes(searchCity.toLowerCase());
    const branchMatch = !selectedBranch || job.branch === selectedBranch;
    return cityMatch && branchMatch;
  });

  const clearFilters = () => {
    setSearchCity('');
    setSelectedBranch('');
    setShowBranchFilter(false);
  };

  const getJobIcon = (branch: string) => {
    const icons: Record<string, string> = {
      'Doktor': '👨‍⚕️',
      'Diş Hekimi': '🦷',
      'Eczacı': '💊',
      'Hemşire': '👩‍⚕️',
      'Fizyoterapi ve Rehabilitasyon': '🏃‍♂️',
      'Ebe': '👶',
      'İlk ve Acil Yardım (Paramedik)': '🚑',
      'Anestezi Teknikeri': '😴',
      'Ameliyathane Teknisyeni': '🔬',
      'Tıbbi Görüntüleme Teknisyeni': '📡',
      'Tıbbi Laboratuvar Teknisyeni': '🧪',
      'Diyaliz Teknisyeni': '🩺',
      'Optisyen': '👓',
      'Odyolog': '👂',
      'Radyoterapi Teknisyeni': '☢️',
      'Çocuk Gelişimi Uzmanı': '🧸',
      'Yaşlı Bakım Teknisyeni': '👴',
      'Tıbbi Sekreter': '📋',
      'Perfüzyon Teknisyeni': '❤️',
      'Beslenme ve Diyetetik': '🥗',
    };
    return icons[branch] || '🏥';
  };

  const renderJobItem = ({ item }: { item: JobListing }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => {
        if (hasAccess) {
          router.push(`/job-detail/${item.id}`);
        } else {
          handleJobAccess();
        }
      }}
      activeOpacity={0.8}
    >
      {/* Approval status indicator for admins/moderators */}
      {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && !item.is_approved && (
        <View style={styles.pendingApprovalBadge}>
          <Text style={styles.pendingApprovalText}>Onay Bekliyor</Text>
        </View>
      )}
      
      {/* Ad required indicator for regular users */}
      {!hasAccess && (currentUserData?.role !== 'admin' && currentUserData?.role !== 'moderator') && (
        <View style={styles.adRequiredBadge}>
          <Gift size={14} color="#7C3AED" />
          <Text style={styles.adRequiredText}>Reklam İzle</Text>
        </View>
      )}
      <View style={styles.jobHeader}>
        <View style={styles.jobIconContainer}>
          <Text style={styles.jobIcon}>
            {getJobIcon(item.branch)}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.title || 'İş İlanı'}</Text>
          <View style={styles.jobMeta}>
            <Building size={14} color="#6B7280" />
            <Text style={styles.institution}>{item.institution || 'Kurum belirtilmemiş'}</Text>
          </View>
          <View style={styles.jobMeta}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.city}>{item.city || 'Şehir belirtilmemiş'}</Text>
          </View>
        </View>
        <View style={styles.jobDate}>
          <Text style={styles.postedDate}>
            {new Date(item.created_at).toLocaleDateString('tr-TR', {
              timeZone: 'Europe/Istanbul'
            })}
          </Text>
          {(currentUserData?.role === 'admin' || currentUserData?.role === 'moderator') && (
            <TouchableOpacity
              style={styles.jobMenuButton}
              onPress={() => showJobOptions(item)}
            >
              <MoreVertical size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
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
        <Text style={styles.headerTitle}>İş İlanları</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/create-job')}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Search and Filter Row */}
        <View style={styles.filterRow}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Şehir ara..."
              value={searchCity}
              onChangeText={setSearchCity}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, selectedBranch && styles.activeFilterButton]}
            onPress={() => setShowBranchFilter(!showBranchFilter)}
            activeOpacity={0.7}
          >
            <Filter size={20} color={selectedBranch ? "#FFFFFF" : "#6B7280"} />
            <Text style={[styles.filterButtonText, selectedBranch && styles.activeFilterButtonText]}>
              {selectedBranch ? 'Filtrelendi' : 'Branş'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {(selectedBranch || searchCity) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>Aktif Filtreler:</Text>
            <View style={styles.activeFilters}>
              {selectedBranch && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>{selectedBranch}</Text>
                  <TouchableOpacity onPress={() => setSelectedBranch('')}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
              {searchCity && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>Şehir: {searchCity}</Text>
                  <TouchableOpacity onPress={() => setSearchCity('')}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={styles.clearAllButton} onPress={clearFilters}>
                <Text style={styles.clearAllText}>Tümünü Temizle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Branch Filter Dropdown */}
        {showBranchFilter && (
          <View style={styles.branchFilterContainer}>
            <Text style={styles.branchFilterTitle}>Branş Seçin:</Text>
            <ScrollView 
              style={styles.branchScrollView}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <View style={styles.branchGrid}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch}
                    style={[
                      styles.branchButton,
                      selectedBranch === branch && styles.selectedBranchButton
                    ]}
                    onPress={() => {
                      setSelectedBranch(branch);
                      setShowBranchFilter(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.branchIcon}>{getJobIcon(branch)}</Text>
                    <Text style={[
                      styles.branchButtonText,
                      selectedBranch === branch && styles.selectedBranchButtonText
                    ]}>
                      {branch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredJobs.length} iş ilanı bulundu
        </Text>
      </View>

      {/* Job Listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>İş ilanları yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          style={styles.jobsList}
          contentContainerStyle={styles.jobsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Rewarded Ad Modal */}
      <RewardedAdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onCancel={() => {
          setShowAdModal(false);
          router.push('/(tabs)'); // Ana sayfaya yönlendir
        }}
        onRewardEarned={handleAdReward}
        title="İş İlanlarına Erişim"
        description="Kısa bir reklam izleyerek iş ilanlarına erişim kazanın!"
        rewardText="İş ilanlarına erişim"
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  activeFiltersTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  activeFilterTag: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  clearAllButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  branchFilterContainer: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 300,
  },
  branchFilterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  branchScrollView: {
    maxHeight: 240,
  },
  branchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedBranchButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  branchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  branchButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  selectedBranchButtonText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  jobsList: {
    flex: 1,
  },
  jobsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobIcon: {
    fontSize: 20,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  jobMeta: {
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
  pendingApprovalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  pendingApprovalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobDate: {
    alignItems: 'flex-end',
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  jobMenuButton: {
    padding: 4,
    marginTop: 4,
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
  },
  // Ad required badge styles
  adRequiredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    gap: 4,
  },
  adRequiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
});