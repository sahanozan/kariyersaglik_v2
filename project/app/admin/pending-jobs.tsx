import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check, X, Eye, MapPin, Building, Calendar, User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PendingJob {
  id: string;
  title: string;
  institution: string;
  city: string;
  branch: string;
  description: string;
  requirements: string;
  contact_person: string;
  phone: string;
  email: string;
  created_at: string;
  posted_by: string;
  profiles?: {
    first_name: string;
    last_name: string;
    branch: string;
  };
}

export default function PendingJobsPage() {
  const { user } = useAuth();
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCurrentUserData();
    fetchPendingJobs();
  }, []);

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
      console.error('Error fetching current user data:', error);
    }
  };

  const fetchPendingJobs = async () => {
    try {
      setLoading(true);
      
      // Check admin/moderator access
      if (currentUserData && 
          currentUserData.role !== 'admin' && 
          currentUserData.role !== 'moderator') {
        setPendingJobs([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          profiles!job_listings_posted_by_fkey(first_name, last_name, branch)
        `)
        .eq('is_active', true)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingJobs(data as PendingJob[] || []);
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveJob = async (jobId: string, jobTitle: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
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

              if (error) throw error;

              Alert.alert('Başarılı', 'İş ilanı onaylandı ve yayınlandı!');
              fetchPendingJobs(); // Refresh list
            } catch (error) {
              console.error('Error approving job:', error);
              Alert.alert('Hata', 'İş ilanı onaylanırken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const rejectJob = async (jobId: string, jobTitle: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    Alert.alert(
      'İş İlanını Reddet',
      `"${jobTitle}" başlıklı iş ilanını reddetmek istediğinizden emin misiniz? Bu işlem ilanı tamamen silecektir.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet ve Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('job_listings')
                .delete()
                .eq('id', jobId);

              if (error) throw error;

              Alert.alert('Başarılı', 'İş ilanı reddedildi ve silindi');
              fetchPendingJobs(); // Refresh list
            } catch (error) {
              console.error('Error rejecting job:', error);
              Alert.alert('Hata', 'İş ilanı reddedilirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const viewJobDetail = (job: PendingJob) => {
    setSelectedJob(job);
    setShowDetailModal(true);
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

  const renderJobItem = ({ item }: { item: PendingJob }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobIconContainer}>
          <Text style={styles.jobIcon}>
            {getJobIcon(item.branch)}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <View style={styles.jobMeta}>
            <Building size={14} color="#6B7280" />
            <Text style={styles.institution}>{item.institution}</Text>
          </View>
          <View style={styles.jobMeta}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.city}>{item.city}</Text>
          </View>
          <View style={styles.jobMeta}>
            <User size={14} color="#6B7280" />
            <Text style={styles.postedBy}>
              {item.profiles?.first_name} {item.profiles?.last_name}
            </Text>
          </View>
        </View>
        <View style={styles.jobDate}>
          <Text style={styles.postedDate}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => viewJobDetail(item)}
        >
          <Eye size={16} color="#3B82F6" />
          <Text style={styles.viewButtonText}>Detay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => approveJob(item.id, item.title)}
        >
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.approveButtonText}>Onayla</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectJob(item.id, item.title)}
        >
          <X size={16} color="#FFFFFF" />
          <Text style={styles.rejectButtonText}>Reddet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Check admin/moderator access
  if (currentUserData && currentUserData.role !== 'admin' && currentUserData.role !== 'moderator') {
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
          <Text style={styles.accessDeniedText}>Bu sayfaya sadece adminler ve moderatörler erişebilir.</Text>
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
        <Text style={styles.headerTitle}>İş İlanı Onayları</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Pending Jobs Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {pendingJobs.length} onay bekleyen ilan
        </Text>
      </View>

      {/* Pending Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Onay bekleyen ilanlar yükleniyor...</Text>
        </View>
      ) : pendingJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Onay Bekleyen İlan Yok</Text>
          <Text style={styles.emptyStateText}>
            Şu anda onay bekleyen iş ilanı bulunmuyor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingJobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          style={styles.jobsList}
          contentContainerStyle={styles.jobsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Job Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>İş İlanı Detayı</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          
          {selectedJob && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Pozisyon Bilgileri</Text>
                <Text style={styles.detailLabel}>İş Pozisyonu:</Text>
                <Text style={styles.detailValue}>{selectedJob.title}</Text>
                
                <Text style={styles.detailLabel}>Kurum/Hastane:</Text>
                <Text style={styles.detailValue}>{selectedJob.institution}</Text>
                
                <Text style={styles.detailLabel}>Şehir:</Text>
                <Text style={styles.detailValue}>{selectedJob.city}</Text>
                
                <Text style={styles.detailLabel}>Branş:</Text>
                <Text style={styles.detailValue}>{selectedJob.branch}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>İş Tanımı</Text>
                <Text style={styles.detailContent}>{selectedJob.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Aranan Nitelikler</Text>
                <Text style={styles.detailContent}>{selectedJob.requirements}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>İletişim Bilgileri</Text>
                <Text style={styles.detailLabel}>İletişim Kişisi:</Text>
                <Text style={styles.detailValue}>{selectedJob.contact_person}</Text>
                
                <Text style={styles.detailLabel}>Telefon:</Text>
                <Text style={styles.detailValue}>{selectedJob.phone}</Text>
                
                <Text style={styles.detailLabel}>E-posta:</Text>
                <Text style={styles.detailValue}>{selectedJob.email}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>İlan Veren</Text>
                <Text style={styles.detailValue}>
                  {selectedJob.profiles?.first_name} {selectedJob.profiles?.last_name}
                </Text>
                <Text style={styles.detailLabel}>Branş: {selectedJob.profiles?.branch}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalApproveButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    approveJob(selectedJob.id, selectedJob.title);
                  }}
                >
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.modalApproveButtonText}>Onayla</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalRejectButton}
                  onPress={() => {
                    setShowDetailModal(false);
                    rejectJob(selectedJob.id, selectedJob.title);
                  }}
                >
                  <X size={20} color="#FFFFFF" />
                  <Text style={styles.modalRejectButtonText}>Reddet</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#D97706',
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
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
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
  postedBy: {
    fontSize: 14,
    color: '#D97706',
    marginLeft: 6,
    fontWeight: '500',
  },
  jobDate: {
    alignItems: 'flex-end',
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    backgroundColor: '#D97706',
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
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  detailContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  modalApproveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
  },
  modalApproveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalRejectButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
  },
  modalRejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});