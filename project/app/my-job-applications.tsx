import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Briefcase, Clock, CircleCheck as CheckCircle, Circle as XCircle, Eye } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface JobApplication {
  id: string;
  status: string;
  applied_at: string;
  reviewed_at: string | null;
  notes: string;
  job_listings: {
    id: string;
    title: string;
    institution: string;
    city: string;
    branch: string;
    posted_by: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function MyJobApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setApplications([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_listings!job_applications_job_id_fkey(
            id,
            title,
            institution,
            city,
            branch,
            posted_by,
            profiles!job_listings_posted_by_fkey(first_name, last_name)
          )
        `)
        .eq('applicant_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as JobApplication[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Hata', 'Başvurular yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#D97706';
      case 'reviewed': return '#3B82F6';
      case 'accepted': return '#10B981';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'reviewed': return 'İncelendi';
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'reviewed': return Eye;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const renderApplicationItem = ({ item }: { item: JobApplication }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <TouchableOpacity
        style={styles.applicationCard}
        onPress={() => router.push(`/job-detail/${item.job_listings.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.applicationHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{item.job_listings.title}</Text>
            <Text style={styles.jobInstitution}>{item.job_listings.institution}</Text>
            <Text style={styles.jobLocation}>{item.job_listings.city}</Text>
            <Text style={styles.jobPoster}>
              İlan Veren: {item.job_listings.profiles.first_name} {item.job_listings.profiles.last_name}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <StatusIcon size={16} color="#FFFFFF" />
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.applicationFooter}>
          <Text style={styles.appliedDate}>
            Başvuru: {new Date(item.applied_at).toLocaleDateString('tr-TR')}
          </Text>
          {item.reviewed_at && (
            <Text style={styles.reviewedDate}>
              İnceleme: {new Date(item.reviewed_at).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notlar:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İş Başvurularım</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Applications Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {applications.length} başvuru
        </Text>
      </View>

      {/* Applications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Başvurular yükleniyor...</Text>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyState}>
          <Briefcase size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Henüz Başvuru Yok</Text>
          <Text style={styles.emptyStateText}>
            İş ilanları sayfasından başvuru yapabilirsiniz.
          </Text>
          <TouchableOpacity 
            style={styles.browseJobsButton}
            onPress={() => router.push('/jobs')}
          >
            <Text style={styles.browseJobsButtonText}>İş İlanlarına Göz At</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          style={styles.applicationsList}
          contentContainerStyle={styles.applicationsContent}
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
    backgroundColor: '#3B82F6',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseJobsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseJobsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applicationsList: {
    flex: 1,
  },
  applicationsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  applicationCard: {
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
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  jobInstitution: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  jobLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  jobPoster: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewedDate: {
    fontSize: 12,
    color: '#059669',
  },
  notesContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
});