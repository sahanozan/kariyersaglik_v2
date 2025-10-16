import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Send, 
  Eye, 
  FileText, 
  User,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  ExternalLink
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface JobListing {
  id: string;
  title: string;
  description: string;
  requirements: string;
  branch: string;
  city: string;
  institution: string;
  contact_person: string;
  email: string;
  phone: string;
  posted_by: string;
  created_at: string;
  is_approved: boolean;
  is_active: boolean;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface CVExperience {
  id: string;
  position: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

interface CVEducation {
  id: string;
  degree: string;
  institution: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  gpa?: string;
  description?: string;
}

interface CVCertification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface CVSkill {
  id: string;
  name: string;
  level: string;
  category: string;
}

interface CV {
  id: string;
  title?: string;
  summary?: string;
  phone?: string;
  email?: string;
  address?: string;
  linkedin_url?: string;
  website_url?: string;
  cv_experiences?: CVExperience[];
  cv_educations?: CVEducation[];
  cv_certifications?: CVCertification[];
  cv_skills?: CVSkill[];
}

interface JobApplication {
  id: string;
  status: string;
  applied_at: string;
  cover_letter?: string;
  notes?: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    branch: string;
    experience_years?: number;
    cv_url?: string;
    education?: string;
    skills?: string[];
    certifications?: string[];
    cvs?: CV[];
  };
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  branch: string;
  experience_years?: number;
  cv_url?: string;
  education?: string;
  skills?: string[];
  certifications?: string[];
  role?: string;
}

export default function JobDetailPage() {
  const { id } = useLocalSearchParams();
  const jobId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [jobData, setJobData] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationCount, setApplicationCount] = useState(0);
  const [hasApplied, setHasApplied] = useState(false);
  const [isJobOwner, setIsJobOwner] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchApplicationCount();
      checkApplicationStatus();
      fetchCurrentUserProfile();
      testSupabaseConnection();
      testSecurityAccess();
    }
  }, [jobId, user]);

  const testSupabaseConnection = async () => {
    try {
      console.log('🔗 Testing Supabase connection...');
      console.log('📍 Supabase URL:', supabase.supabaseUrl);
      console.log('🔑 Supabase Key:', supabase.supabaseKey ? 'Present' : 'Missing');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('❌ Supabase connection failed:', error);
      } else {
        console.log('✅ Supabase connection successful');
      }
    } catch (error) {
      console.error('❌ Supabase test error:', error);
    }
  };

  const testSecurityAccess = () => {
    console.log('🔒 SECURITY TEST:');
    console.log('👤 Current User ID:', user?.id);
    console.log('👤 User Role:', currentUserProfile?.role);
    console.log('🏢 Is Job Owner:', isJobOwner);
    console.log('📊 Can View Application Count:', '✅ Everyone can see count');
    console.log('🔑 Can View Application Details:', (isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator'));
    console.log('🔑 Can Update Status:', (isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator'));
    console.log('🔑 Can Download CV:', (isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator'));
  };

  useEffect(() => {
    if ((isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator') && jobId) {
      fetchApplications();
    }
  }, [isJobOwner, currentUserProfile, jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          profiles!job_listings_posted_by_fkey(first_name, last_name, avatar_url)
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      setJobData(data as JobListing);
      setIsJobOwner((data as any).posted_by === user?.id);
    } catch (error) {
      console.error('Error fetching job details:', error);
      Alert.alert('Hata', 'İş ilanı bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      // 🔒 GÜVENLİK KONTROLÜ: Sadece admin, moderatör veya ilan sahibi başvuruları görebilir
      if (!user?.id) {
        console.log('❌ User not authenticated');
        return;
      }

      const isAdmin = currentUserProfile?.role === 'admin';
      const isModerator = currentUserProfile?.role === 'moderator';
      const isJobOwner = isJobOwner;

      if (!isAdmin && !isModerator && !isJobOwner) {
        console.log('❌ Access denied: User is not authorized to view applications');
        Alert.alert('Yetki Hatası', 'Bu bilgilere erişim yetkiniz bulunmuyor');
        return;
      }

      console.log('🔍 Fetching applications for job:', jobId);
      console.log('👤 User role:', currentUserProfile?.role);
      console.log('🏢 Is job owner:', isJobOwner);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles!job_applications_applicant_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            branch,
            experience_years,
            cv_url,
            education,
            skills,
            certifications,
            cvs(
              id,
              title,
              summary,
              phone,
              email,
              address,
              linkedin_url,
              website_url,
              cv_experiences(
                id,
                position,
                company,
                location,
                start_date,
                end_date,
                is_current,
                description
              ),
              cv_educations(
                id,
                degree,
                institution,
                field_of_study,
                start_date,
                end_date,
                is_current,
                gpa,
                description
              ),
              cv_certifications(
                id,
                name,
                issuing_organization,
                issue_date,
                expiration_date,
                credential_id,
                credential_url
              ),
              cv_skills(
                id,
                name,
                level,
                category
              )
            )
          )
        `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Applications fetched successfully:', data?.length || 0, 'applications');
      setApplications((data || []) as JobApplication[]);
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      Alert.alert('Hata', 'Başvurular yüklenirken hata oluştu');
    }
  };

  const fetchApplicationCount = async () => {
    try {
      // 📊 Başvuru sayısı tüm kullanıcılar görebilir
      console.log('📊 Fetching application count for job:', jobId);
      
      const { count, error } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      if (error) throw error;
      
      console.log('✅ Application count fetched:', count || 0);
      setApplicationCount(count || 0);
    } catch (error) {
      console.error('❌ Error fetching application count:', error);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Başvuru yapmak için giriş yapmalısınız');
      return;
    }

    if (hasApplied) {
      Alert.alert('Bilgi', 'Bu ilana zaten başvuru yaptınız');
      return;
    }

    if (!currentUserProfile?.cv_url) {
      Alert.alert(
        'CV Gerekli', 
        'Başvuru yapmak için önce CV\'nizi yüklemeniz gerekiyor. CV Builder sayfasına gidip CV\'nizi oluşturun.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'CV Builder\'a Git', onPress: () => router.push('/cv-builder') }
        ]
      );
      return;
    }

    setShowApplicationForm(true);
  };

  const submitApplication = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          status: 'pending',
          cover_letter: coverLetter,
          applied_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Başvurunuz alındı');
      setHasApplied(true);
      setShowApplicationForm(false);
      setCoverLetter('');
      fetchApplicationCount();
    } catch (error) {
      console.error('Error applying to job:', error);
      Alert.alert('Hata', 'Başvuru yapılırken hata oluştu');
    }
  };

  const handleViewApplication = (application: JobApplication) => {
    // 🔒 GÜVENLİK KONTROLÜ: Sadece admin, moderatör veya ilan sahibi başvuru detaylarını görebilir
    const isAdmin = currentUserProfile?.role === 'admin';
    const isModerator = currentUserProfile?.role === 'moderator';
    const isOwner = isJobOwner;

    if (!isAdmin && !isModerator && !isOwner) {
      console.log('❌ Access denied: User is not authorized to view application details');
      Alert.alert('Yetki Hatası', 'Bu bilgilere erişim yetkiniz bulunmuyor');
      return;
    }

    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleDownloadCV = async (cvUrl: string) => {
    // 🔒 GÜVENLİK KONTROLÜ: Sadece admin, moderatör veya ilan sahibi CV indirebilir
    const isAdmin = currentUserProfile?.role === 'admin';
    const isModerator = currentUserProfile?.role === 'moderator';
    const isOwner = isJobOwner;

    if (!isAdmin && !isModerator && !isOwner) {
      console.log('❌ Access denied: User is not authorized to download CV');
      Alert.alert('Yetki Hatası', 'CV indirme yetkiniz bulunmuyor');
      return;
    }

    try {
      await Linking.openURL(cvUrl);
    } catch (error) {
      console.error('Error opening CV:', error);
      Alert.alert('Hata', 'CV açılırken hata oluştu');
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
      case 'pending': return <Clock size={16} color="#D97706" />;
      case 'reviewed': return <Eye size={16} color="#3B82F6" />;
      case 'accepted': return <CheckCircle size={16} color="#10B981" />;
      case 'rejected': return <XCircle size={16} color="#DC2626" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    if (!user?.id) return;

    // 🔒 GÜVENLİK KONTROLÜ: Sadece admin, moderatör veya ilan sahibi durum güncelleyebilir
    const isAdmin = currentUserProfile?.role === 'admin';
    const isModerator = currentUserProfile?.role === 'moderator';
    const isOwner = isJobOwner;

    if (!isAdmin && !isModerator && !isOwner) {
      console.log('❌ Access denied: User is not authorized to update application status');
      Alert.alert('Yetki Hatası', 'Bu işlem için yetkiniz bulunmuyor');
      return;
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      Alert.alert('Başarılı', 'Başvuru durumu güncellendi');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      Alert.alert('Hata', 'Başvuru durumu güncellenirken hata oluştu');
    }
  };

  const showStatusUpdateOptions = (application: JobApplication) => {
    const isAdmin = currentUserProfile?.role === 'admin';
    const isModerator = currentUserProfile?.role === 'moderator';
    const isOwner = isJobOwner;
    
    if (!isAdmin && !isModerator && !isOwner) return;

    const options = [
      { text: 'İptal', style: 'cancel' as const },
    ];

    if (application.status === 'pending') {
      options.push({
        text: 'İncele',
        style: 'default' as const,
        onPress: () => updateApplicationStatus(application.id, 'reviewed')
      });
    }

    if (application.status !== 'accepted') {
      options.push({
        text: 'Kabul Et',
        style: 'default' as const,
        onPress: () => updateApplicationStatus(application.id, 'accepted')
      });
    }

    if (application.status !== 'rejected') {
      options.push({
        text: 'Reddet',
        style: 'destructive' as const,
        onPress: () => updateApplicationStatus(application.id, 'rejected')
      });
    }

    Alert.alert(
      'Başvuru Durumu',
      `${application.profiles.first_name} ${application.profiles.last_name} başvurusu`,
      options
    );
  };

  const getSkillLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Başlangıç';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'İleri';
      case 'expert': return 'Uzman';
      default: return level;
    }
  };

  const getSkillLevelStyle = (level: string) => {
    switch (level) {
      case 'beginner': return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' };
      case 'intermediate': return { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' };
      case 'advanced': return { backgroundColor: '#D1FAE5', borderColor: '#10B981' };
      case 'expert': return { backgroundColor: '#FEE2E2', borderColor: '#EF4444' };
      default: return { backgroundColor: '#F3F4F6', borderColor: '#6B7280' };
    }
  };

  const handleCall = () => {
    if (jobData?.phone) {
      Linking.openURL(`tel:${jobData.phone}`);
    }
  };

  const handleEmail = () => {
    if (jobData?.email) {
      Linking.openURL(`mailto:${jobData.email}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yükleniyor...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>İş ilanı yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!jobData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İş İlanı</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>İş ilanı bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>İş İlanı Detayı</Text>
          <Text style={styles.headerSubtitle}>{jobData?.institution}</Text>
        </View>
        {/* 📊 Başvuru sayısı herkes görebilir, detaylar sadece yetkili kullanıcılar */}
        <TouchableOpacity
          style={styles.applicationsButton}
          onPress={() => {
            // 🔒 GÜVENLİK: Sadece yetkili kullanıcılar başvuru detaylarını görebilir
            if (isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator') {
              setShowApplications(!showApplications);
            } else {
              Alert.alert('Yetki Hatası', 'Başvuru detaylarını görme yetkiniz bulunmuyor');
            }
          }}
        >
          <Users size={20} color="#FFFFFF" />
          <Text style={styles.applicationsButtonText}>{applicationCount}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Hero Section */}
        <View style={styles.jobHero}>
          <View style={styles.jobHeader}>
            <View style={styles.jobTitleContainer}>
              <Text style={styles.jobTitle}>{jobData?.title}</Text>
              <View style={styles.jobMeta}>
                <View style={styles.metaItem}>
                  <Building size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{jobData?.institution}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{jobData?.city}</Text>
                </View>
                {/* 📊 Başvuru sayısı tüm kullanıcılar görebilir */}
                <View style={styles.metaItem}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{applicationCount} başvuru</Text>
                </View>
              </View>
            </View>
            <View style={styles.branchBadge}>
              <Text style={styles.branchText}>{jobData?.branch}</Text>
            </View>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>İş Tanımı</Text>
            </View>
            <Text style={styles.sectionContent}>{jobData?.description}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Gereksinimler</Text>
            </View>
            <Text style={styles.sectionContent}>{jobData?.requirements}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
            </View>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>İletişim Kişisi:</Text>
                <Text style={styles.contactValue}>{jobData?.contact_person}</Text>
              </View>
              <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                <Phone size={16} color="#EF4444" />
                <Text style={styles.contactLink}>{jobData?.phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                <Mail size={16} color="#EF4444" />
                <Text style={styles.contactLink}>{jobData?.email}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Applications Section for Job Owner, Admin, and Moderator */}
        {(isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator') && showApplications && (
          <View style={styles.applicationsSection}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Başvurular ({applications.length})</Text>
            </View>
            {applications.length === 0 ? (
              <View style={styles.noApplications}>
                <Text style={styles.noApplicationsText}>Henüz başvuru yok</Text>
              </View>
            ) : (
              <View style={styles.applicationsList}>
                {applications.map((application) => (
                  <TouchableOpacity
                    key={application.id}
                    style={styles.applicationCard}
                    onPress={() => handleViewApplication(application)}
                  >
                    <View style={styles.applicationHeader}>
                      <View style={styles.applicantInfo}>
                        {application.profiles.avatar_url ? (
                          <Image
                            source={{ uri: application.profiles.avatar_url }}
                            style={styles.applicantAvatar}
                          />
                        ) : (
                          <View style={styles.applicantAvatarPlaceholder}>
                            <User size={20} color="#6B7280" />
                          </View>
                        )}
                        <View style={styles.applicantDetails}>
                          <Text style={styles.applicantName}>
                            {application.profiles.first_name} {application.profiles.last_name}
                          </Text>
                          <Text style={styles.applicantBranch}>{application.profiles.branch}</Text>
                          <Text style={styles.applicantExperience}>
                            {application.profiles.experience_years || 0} yıl deneyim
                          </Text>
                        </View>
                      </View>
                      <View style={styles.applicationStatus}>
                        {getStatusIcon(application.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                          {getStatusText(application.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.applicationFooter}>
                      <Text style={styles.applicationDate}>
                        {new Date(application.applied_at).toLocaleDateString('tr-TR', {
                          timeZone: 'Europe/Istanbul'
                        })}
                      </Text>
                      <View style={styles.applicationActions}>
                        {application.profiles.cv_url && (
                          <TouchableOpacity
                            style={styles.cvButton}
                            onPress={() => handleDownloadCV(application.profiles.cv_url!)}
                          >
                            <Download size={16} color="#EF4444" />
                            <Text style={styles.cvButtonText}>CV İndir</Text>
                          </TouchableOpacity>
                        )}
                        {/* 🔒 GÜVENLİK: Sadece yetkili kullanıcılar durum güncelleyebilir */}
                        {(isJobOwner || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'moderator') && (
                          <TouchableOpacity
                            style={styles.statusButton}
                            onPress={() => showStatusUpdateOptions(application)}
                          >
                            <Text style={styles.statusButtonText}>Durum Güncelle</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Application Form Modal */}
      <Modal
        visible={showApplicationForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowApplicationForm(false)}
            >
              <XCircle size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Başvuru Yap</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.applicationForm}>
              <Text style={styles.formLabel}>Ön Yazı (Opsiyonel)</Text>
              <TextInput
                style={styles.coverLetterInput}
                placeholder="Kendinizi tanıtın ve neden bu pozisyon için uygun olduğunuzu açıklayın..."
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
              
              <View style={styles.cvPreview}>
                <Text style={styles.cvPreviewTitle}>CV Önizleme</Text>
                {currentUserProfile?.cv_url ? (
                  <View style={styles.cvInfo}>
                    <FileText size={20} color="#10B981" />
                    <Text style={styles.cvInfoText}>CV'niz hazır</Text>
                    <TouchableOpacity
                      style={styles.viewCvButton}
                      onPress={() => handleDownloadCV(currentUserProfile.cv_url!)}
                    >
                      <ExternalLink size={16} color="#EF4444" />
                      <Text style={styles.viewCvButtonText}>CV'yi Görüntüle</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noCvInfo}>
                    <FileText size={20} color="#DC2626" />
                    <Text style={styles.noCvText}>CV bulunamadı</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowApplicationForm(false)}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !currentUserProfile?.cv_url && styles.submitButtonDisabled]}
              onPress={submitApplication}
              disabled={!currentUserProfile?.cv_url}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Başvuru Yap</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Application Detail Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowApplicationModal(false)}
            >
              <XCircle size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Başvuru Detayı</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          {selectedApplication && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.applicationDetail}>
                <View style={styles.applicantProfile}>
                  {selectedApplication.profiles.avatar_url ? (
                    <Image
                      source={{ uri: selectedApplication.profiles.avatar_url }}
                      style={styles.detailAvatar}
                    />
                  ) : (
                    <View style={styles.detailAvatarPlaceholder}>
                      <User size={30} color="#6B7280" />
                    </View>
                  )}
                  <View style={styles.applicantInfo}>
                    <Text style={styles.detailApplicantName}>
                      {selectedApplication.profiles.first_name} {selectedApplication.profiles.last_name}
                    </Text>
                    <Text style={styles.detailApplicantBranch}>{selectedApplication.profiles.branch}</Text>
                    <Text style={styles.detailApplicantExperience}>
                      {selectedApplication.profiles.experience_years || 0} yıl deneyim
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>İletişim Bilgileri</Text>
                  <View style={styles.contactDetail}>
                    <Mail size={16} color="#6B7280" />
                    <Text style={styles.contactDetailText}>{selectedApplication.profiles.email}</Text>
                  </View>
                  {selectedApplication.profiles.phone && (
                    <View style={styles.contactDetail}>
                      <Phone size={16} color="#6B7280" />
                      <Text style={styles.contactDetailText}>{selectedApplication.profiles.phone}</Text>
                    </View>
                  )}
                </View>

                {/* CV Detaylı Bilgileri */}
                {selectedApplication.profiles.cvs && selectedApplication.profiles.cvs.length > 0 && (
                  <>
                    {/* CV Özeti */}
                    {selectedApplication.profiles.cvs[0].summary && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Özet</Text>
                        <Text style={styles.detailContent}>{selectedApplication.profiles.cvs[0].summary}</Text>
                      </View>
                    )}

                    {/* İş Deneyimleri */}
                    {selectedApplication.profiles.cvs[0].cv_experiences && selectedApplication.profiles.cvs[0].cv_experiences.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>İş Deneyimleri</Text>
                        <View style={styles.experienceContainer}>
                          {selectedApplication.profiles.cvs[0].cv_experiences.map((exp, index) => (
                            <View key={index} style={styles.experienceItem}>
                              <View style={styles.experienceHeader}>
                                <Text style={styles.experiencePosition}>{exp.position}</Text>
                                <Text style={styles.experienceCompany}>{exp.company}</Text>
                              </View>
                              <View style={styles.experienceMeta}>
                                <Text style={styles.experienceDate}>
                                  {new Date(exp.start_date).toLocaleDateString('tr-TR')} - 
                                  {exp.is_current ? ' Devam Ediyor' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş')}
                                </Text>
                                {exp.location && (
                                  <Text style={styles.experienceLocation}>{exp.location}</Text>
                                )}
                              </View>
                              {exp.description && (
                                <Text style={styles.experienceDescription}>{exp.description}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Eğitim Bilgileri */}
                    {selectedApplication.profiles.cvs[0].cv_educations && selectedApplication.profiles.cvs[0].cv_educations.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Eğitim</Text>
                        <View style={styles.educationContainer}>
                          {selectedApplication.profiles.cvs[0].cv_educations.map((edu, index) => (
                            <View key={index} style={styles.educationItem}>
                              <View style={styles.educationHeader}>
                                <Text style={styles.educationDegree}>{edu.degree}</Text>
                                <Text style={styles.educationInstitution}>{edu.institution}</Text>
                              </View>
                              <View style={styles.educationMeta}>
                                <Text style={styles.educationDate}>
                                  {new Date(edu.start_date).toLocaleDateString('tr-TR')} - 
                                  {edu.is_current ? ' Devam Ediyor' : (edu.end_date ? new Date(edu.end_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş')}
                                </Text>
                                {edu.field_of_study && (
                                  <Text style={styles.educationField}>{edu.field_of_study}</Text>
                                )}
                                {edu.gpa && (
                                  <Text style={styles.educationGpa}>GPA: {edu.gpa}</Text>
                                )}
                              </View>
                              {edu.description && (
                                <Text style={styles.educationDescription}>{edu.description}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Sertifikalar */}
                    {selectedApplication.profiles.cvs[0].cv_certifications && selectedApplication.profiles.cvs[0].cv_certifications.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Sertifikalar</Text>
                        <View style={styles.certificationsContainer}>
                          {selectedApplication.profiles.cvs[0].cv_certifications.map((cert, index) => (
                            <View key={index} style={styles.certificationItem}>
                              <Award size={16} color="#10B981" />
                              <View style={styles.certificationInfo}>
                                <Text style={styles.certificationName}>{cert.name}</Text>
                                <Text style={styles.certificationOrg}>{cert.issuing_organization}</Text>
                                <Text style={styles.certificationDate}>
                                  {new Date(cert.issue_date).toLocaleDateString('tr-TR')}
                                  {cert.expiration_date && ` - ${new Date(cert.expiration_date).toLocaleDateString('tr-TR')}`}
                                </Text>
                                {cert.credential_id && (
                                  <Text style={styles.certificationId}>ID: {cert.credential_id}</Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Yetenekler */}
                    {selectedApplication.profiles.cvs[0].cv_skills && selectedApplication.profiles.cvs[0].cv_skills.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Yetenekler</Text>
                        <View style={styles.skillsContainer}>
                          {selectedApplication.profiles.cvs[0].cv_skills.map((skill, index) => (
                            <View key={index} style={[styles.skillTag, getSkillLevelStyle(skill.level)]}>
                              <Text style={styles.skillText}>{skill.name}</Text>
                              <Text style={styles.skillLevel}>{getSkillLevelText(skill.level)}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* İletişim Bilgileri */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>İletişim Bilgileri</Text>
                      <View style={styles.contactDetail}>
                        <Mail size={16} color="#6B7280" />
                        <Text style={styles.contactDetailText}>{selectedApplication.profiles.email}</Text>
                      </View>
                      {selectedApplication.profiles.phone && (
                        <View style={styles.contactDetail}>
                          <Phone size={16} color="#6B7280" />
                          <Text style={styles.contactDetailText}>{selectedApplication.profiles.phone}</Text>
                        </View>
                      )}
                      {selectedApplication.profiles.cvs[0].linkedin_url && (
                        <View style={styles.contactDetail}>
                          <ExternalLink size={16} color="#6B7280" />
                          <Text style={styles.contactDetailText}>LinkedIn: {selectedApplication.profiles.cvs[0].linkedin_url}</Text>
                        </View>
                      )}
                      {selectedApplication.profiles.cvs[0].website_url && (
                        <View style={styles.contactDetail}>
                          <ExternalLink size={16} color="#6B7280" />
                          <Text style={styles.contactDetailText}>Website: {selectedApplication.profiles.cvs[0].website_url}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* Fallback: Eski format bilgileri */}
                {(!selectedApplication.profiles.cvs || selectedApplication.profiles.cvs.length === 0) && (
                  <>
                    {selectedApplication.profiles.education && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Eğitim</Text>
                        <Text style={styles.detailContent}>{selectedApplication.profiles.education}</Text>
                      </View>
                    )}

                    {selectedApplication.profiles.skills && selectedApplication.profiles.skills.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Yetenekler</Text>
                        <View style={styles.skillsContainer}>
                          {selectedApplication.profiles.skills.map((skill, index) => (
                            <View key={index} style={styles.skillTag}>
                              <Text style={styles.skillText}>{skill}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedApplication.profiles.certifications && selectedApplication.profiles.certifications.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Sertifikalar</Text>
                        <View style={styles.certificationsContainer}>
                          {selectedApplication.profiles.certifications.map((cert, index) => (
                            <View key={index} style={styles.certificationItem}>
                              <Award size={16} color="#10B981" />
                              <Text style={styles.certificationText}>{cert}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}

                {selectedApplication.cover_letter && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ön Yazı</Text>
                    <Text style={styles.detailContent}>{selectedApplication.cover_letter}</Text>
                  </View>
                )}

                {selectedApplication.profiles.cv_url && (
                  <View style={styles.detailSection}>
                    <TouchableOpacity
                      style={styles.downloadCvButton}
                      onPress={() => handleDownloadCV(selectedApplication.profiles.cv_url!)}
                    >
                      <Download size={20} color="#FFFFFF" />
                      <Text style={styles.downloadCvButtonText}>CV İndir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Apply Button */}
      {!isJobOwner && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, hasApplied && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={hasApplied}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>
              {hasApplied ? 'Başvuru Yapıldı' : 'Başvuru Yap'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Modern Header
  modernHeader: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  applicationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  applicationsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  // Job Hero Section
  jobHero: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32,
  },
  jobMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  branchBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  branchText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  // Job Details
  jobDetails: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 120,
  },
  contactValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  contactLink: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  // Applications Section
  applicationsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  applicationsList: {
    gap: 12,
  },
  applicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  applicantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  applicantAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applicantDetails: {
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  applicantBranch: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  applicantExperience: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  applicationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  applicationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  cvButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  noApplications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noApplicationsText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  applicationForm: {
    gap: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  coverLetterInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
  cvPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cvPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  cvInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cvInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  viewCvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewCvButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  noCvInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noCvText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Application Detail Modal
  applicationDetail: {
    gap: 20,
  },
  applicantProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  detailAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  applicantInfo: {
    flex: 1,
  },
  detailApplicantName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  detailApplicantBranch: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailApplicantExperience: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactDetailText: {
    fontSize: 14,
    color: '#374151',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  certificationsContainer: {
    gap: 8,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certificationText: {
    fontSize: 14,
    color: '#374151',
  },
  downloadCvButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadCvButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // CV Detay Stilleri
  experienceContainer: {
    gap: 16,
  },
  experienceItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  experienceHeader: {
    marginBottom: 8,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  experienceCompany: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  experienceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  experienceDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  experienceLocation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  experienceDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  educationContainer: {
    gap: 16,
  },
  educationItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  educationHeader: {
    marginBottom: 8,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  educationInstitution: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  educationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  educationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  educationField: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  educationGpa: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  educationDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  certificationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  certificationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  certificationOrg: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  certificationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  certificationId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  skillLevel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  // Footer
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading and Empty States
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});
