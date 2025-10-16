import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Building, 
  CheckCircle,
  XCircle,
  UserPlus,
  Eye,
  Share,
  Heart
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  title: string;
  content: string;
  event_date: string;
  event_time?: string;
  event_location: string;
  max_participants: number;
  registration_deadline: string;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    branch: string;
    avatar_url?: string;
  };
}

interface Registration {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    branch: string;
    title: string;
    institution: string;
    city: string;
    phone: string;
    email: string;
    avatar_url?: string;
  };
}

export default function EventDetailPage() {
  const { id: rawId } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);

  // Ensure id is a string
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  // Check permissions
  const isAdminOrModerator = profile?.role === 'admin' || profile?.role === 'moderator';
  const isEventCreator = event && user?.id && event.user_id === user.id;
  const canManageRegistrations = isAdminOrModerator || isEventCreator;
  
  // Allow event creator and admin/moderator to see participant details
  const canViewParticipantDetails = canManageRegistrations;

  useEffect(() => {
    if (id) {
      fetchEventData();
      fetchRegistrations();
      checkRegistrationStatus();
    }
  }, [id, user]);

  // Debug state changes
  useEffect(() => {
    console.log('🔍 State changes:', {
      showParticipantDetails,
      selectedParticipant: selectedParticipant?.profiles?.first_name,
      canViewParticipantDetails
    });
  }, [showParticipantDetails, selectedParticipant, canViewParticipantDetails]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      if (!id || id === 'undefined' || typeof id !== 'string') {
        console.error('❌ Invalid event ID:', id);
        setLoading(false);
        return;
      }
      
      console.log('🎪 Fetching event data for ID:', id);
      
      // Fetch event from posts table
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(first_name, last_name, branch, avatar_url)
        `)
        .eq('id', id)
        .eq('post_type', 'etkinlik')
        .maybeSingle();

      if (postError) {
        console.error('❌ Error fetching event data:', postError);
        throw postError;
      }

      if (!postData) {
        console.error('❌ Event not found');
        Alert.alert('Hata', 'Etkinlik bulunamadı');
        router.back();
        return;
      }

      // Convert post data to event format
      const eventData: Event = {
        id: postData.id,
        title: postData.title || 'Etkinlik',
        content: postData.content || '',
        event_date: postData.event_date || '',
        event_time: postData.event_time || '',
        event_location: postData.event_location || 'Belirtilmemiş',
        max_participants: parseInt(String(postData.max_participants)) || 50,
        registration_deadline: postData.registration_deadline || '',
        created_at: postData.created_at,
        user_id: postData.user_id,
        profiles: postData.profiles
      };

      setEvent(eventData);
      console.log('✅ Event data fetched successfully:', eventData);
      
    } catch (error) {
      console.error('❌ Error fetching event data:', error);
      Alert.alert('Hata', 'Etkinlik bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      if (!id) return;

      console.log('📋 Fetching registrations for event:', id);
      
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('event_registrations')
        .select(`
          id,
          user_id,
          status,
          created_at,
          profiles!event_registrations_user_id_fkey(
            first_name,
            last_name,
            branch,
            title,
            institution,
            city,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('❌ Error fetching registrations:', registrationsError);
        setRegistrations([]);
        return;
      }

      setRegistrations((registrationsData || []) as unknown as Registration[]);
      console.log('✅ Registrations fetched:', registrationsData?.length || 0);
      
    } catch (error) {
      console.error('❌ Error in fetchRegistrations:', error);
      setRegistrations([]);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      if (!user?.id || !id) return;
      
      console.log('🔍 Checking registration status for user:', user.id);
      
      const { data: existingRegistration, error: checkError } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking registration status:', checkError);
        setHasRegistered(false);
        setRegistrationStatus(null);
        return;
      }

      const hasRegistered = existingRegistration !== null;
      setHasRegistered(hasRegistered);
      setRegistrationStatus(existingRegistration?.status || null);
      
      console.log('✅ Registration status:', hasRegistered ? existingRegistration?.status : 'Not registered');
      
    } catch (error) {
      console.error('❌ Error checking registration status:', error);
      setHasRegistered(false);
      setRegistrationStatus(null);
    }
  };

  const fetchParticipants = async () => {
    try {
      if (!id) return;

      console.log('👥 Fetching participants for event:', id);
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_registrations')
        .select(`
          id,
          user_id,
          status,
          created_at,
          profiles!event_registrations_user_id_fkey(
            first_name,
            last_name,
            branch,
            title,
            institution,
            city,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('event_id', id)
        .in('status', ['approved', 'pending'])
        .order('created_at', { ascending: false });

      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError);
        setParticipants([]);
        return;
      }

      setParticipants((participantsData || []) as unknown as Registration[]);
      console.log('✅ Participants fetched:', participantsData?.length || 0);
      
    } catch (error) {
      console.error('❌ Error in fetchParticipants:', error);
      setParticipants([]);
    }
  };

  const handleRegister = async () => {
    if (hasRegistered) {
      Alert.alert('Bilgi', 'Bu etkinliğe zaten başvuru yaptınız');
      return;
    }

    if (!user?.id || !id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi veya etkinlik ID\'si bulunamadı');
      return;
    }

    // Check if registration deadline has passed
    if (event && event.registration_deadline) {
      try {
        // Convert DD/MM/YYYY to Date object
        const [day, month, year] = event.registration_deadline.split('/').map(Number);
        
        // Get current date (start of day for fair comparison)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Compare dates only (ignore time)
        const deadlineDateOnly = new Date(year, month - 1, day);
        
        console.log('🔍 Registration deadline check:', {
          deadline: event.registration_deadline,
          deadlineDateOnly: deadlineDateOnly.toISOString(),
          today: today.toISOString(),
          now: now.toISOString(),
          isExpired: today > deadlineDateOnly
        });
        
        // Only block if today is after the deadline date
        if (today > deadlineDateOnly) {
          Alert.alert('Hata', 'Başvuru süresi dolmuştur');
          return;
        }
      } catch (error) {
        console.error('Error parsing registration deadline:', error);
        Alert.alert('Hata', 'Tarih formatı hatalı');
        return;
      }
    }

    setRegistering(true);
    
    try {
      console.log('📝 Registering user for event:', { userId: user.id, eventId: id });

      const { data: registrationData, error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
          status: 'pending',
          message: 'Etkinlik başvurusu'
        })
        .select()
        .single();

      if (registrationError) {
        console.error('❌ Registration error:', registrationError);
        throw registrationError;
      }

      console.log('✅ Registration successful:', registrationData);
      
      Alert.alert('Başarılı', 'Etkinlik başvurunuz gönderildi! Onay bekliyor.');
      setHasRegistered(true);
      setRegistrationStatus('pending');
      
      // Refresh data
      await Promise.all([
        fetchRegistrations(),
        checkRegistrationStatus()
      ]);
      
    } catch (error) {
      console.error('❌ Error registering for event:', error);
      Alert.alert('Hata', 'Başvuru gönderilirken hata oluştu: ' + (error as any)?.message || 'Bilinmeyen hata');
    } finally {
      setRegistering(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      console.log('✅ Approving registration:', registrationId);
      
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'approved' })
        .eq('id', registrationId);

      if (error) {
        console.error('❌ Error approving registration:', error);
        Alert.alert('Hata', 'Başvuru onaylanırken hata oluştu');
        return;
      }

      Alert.alert('Başarılı', 'Başvuru onaylandı');
      
      // Refresh data
      await Promise.all([
        fetchRegistrations(),
        fetchParticipants()
      ]);
      
    } catch (error) {
      console.error('❌ Error approving registration:', error);
      Alert.alert('Hata', 'Başvuru onaylanırken hata oluştu');
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    try {
      console.log('❌ Rejecting registration:', registrationId);
      
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'rejected' })
        .eq('id', registrationId);

      if (error) {
        console.error('❌ Error rejecting registration:', error);
        Alert.alert('Hata', 'Başvuru reddedilirken hata oluştu');
        return;
      }

      Alert.alert('Başarılı', 'Başvuru reddedildi');
      
      // Refresh data
      await Promise.all([
        fetchRegistrations(),
        fetchParticipants()
      ]);
      
    } catch (error) {
      console.error('❌ Error rejecting registration:', error);
      Alert.alert('Hata', 'Başvuru reddedilirken hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        timeZone: 'Europe/Istanbul',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#D97706';
      case 'approved': return '#10B981';
      case 'rejected': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Etkinlik bilgileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Etkinlik bulunamadı</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const isRegistrationOpen = event.registration_deadline ? 
    (() => {
      try {
        // Convert DD/MM/YYYY to Date object
        const [day, month, year] = event.registration_deadline.split('/').map(Number);
        
        // Get current date (start of day for fair comparison)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Create deadline date (start of day for fair comparison)
        const deadlineDateOnly = new Date(year, month - 1, day);
        
        console.log('🔍 isRegistrationOpen check:', {
          deadline: event.registration_deadline,
          deadlineDateOnly: deadlineDateOnly.toISOString(),
          today: today.toISOString(),
          now: now.toISOString(),
          isOpen: today <= deadlineDateOnly
        });
        
        // Registration is open if today is on or before the deadline date
        return today <= deadlineDateOnly;
      } catch (error) {
        console.error('Error parsing registration deadline:', error);
        return true; // Default to open if parsing fails
      }
    })() : true;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Etkinlik Detayı</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.eventTypeBadge}>
            <Calendar size={16} color="#FFFFFF" />
            <Text style={styles.eventTypeText}>ETKİNLİK</Text>
          </View>
          
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.organizerInfo}>
            <Image 
              source={{ 
                uri: event.profiles?.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
              }} 
              style={styles.organizerAvatar} 
            />
            <View style={styles.organizerDetails}>
              <Text style={styles.organizerName}>
                {event.profiles?.first_name} {event.profiles?.last_name}
              </Text>
              <Text style={styles.organizerBranch}>{event.profiles?.branch}</Text>
            </View>
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>📅 Etkinlik Bilgileri</Text>
          
          <View style={styles.detailRow}>
            <Calendar size={20} color="#7C3AED" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Tarih</Text>
              <Text style={styles.detailValue}>
                {(() => {
                  try {
                    // Check if event_date is in DD/MM/YYYY format
                    if (event.event_date && event.event_date.includes('/')) {
                      return event.event_date; // Already in DD/MM/YYYY format
                    }
                    // If it's in YYYY-MM-DD format, convert it
                    if (event.event_date && event.event_date.includes('-')) {
                      const [year, month, day] = event.event_date.split('-');
                      return `${day}/${month}/${year}`;
                    }
                    return event.event_date || 'Belirtilmemiş';
                  } catch (error) {
                    console.error('Error formatting event date:', error);
                    return event.event_date || 'Belirtilmemiş';
                  }
                })()}
              </Text>
            </View>
          </View>

          {event.event_time && (
            <View style={styles.detailRow}>
              <Clock size={20} color="#7C3AED" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Saat</Text>
                <Text style={styles.detailValue}>{formatTime(event.event_time)}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <MapPin size={20} color="#7C3AED" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Konum</Text>
              <Text style={styles.detailValue}>{event.event_location}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Users size={20} color="#7C3AED" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Katılımcı Sayısı</Text>
              <Text style={styles.detailValue}>{approvedCount} / {event.max_participants}</Text>
            </View>
          </View>
        </View>

        {/* Event Description */}
        {event.content && (
          <View style={styles.descriptionCard}>
            <Text style={styles.cardTitle}>📝 Açıklama</Text>
            <Text style={styles.descriptionText}>{event.content}</Text>
          </View>
        )}

        {/* Registration Status */}
        <View style={styles.statusCard}>
          {!isRegistrationOpen ? (
            <View style={styles.statusContainer}>
              <View style={styles.expiredStatus}>
                <Clock size={20} color="#DC2626" />
                <Text style={styles.expiredStatusText}>Başvuru Süresi Doldu</Text>
              </View>
              <Text style={styles.expiredMessage}>
                Bu etkinlik için başvuru süresi dolmuştur.
              </Text>
            </View>
          ) : hasRegistered ? (
            <View style={styles.statusContainer}>
              {registrationStatus === 'approved' ? (
                <>
                  <View style={styles.approvedStatus}>
                    <CheckCircle size={20} color="#10B981" />
                    <Text style={styles.approvedStatusText}>Başvuru Onaylandı</Text>
                  </View>
                  <Text style={styles.approvedMessage}>
                    Bu etkinliğe başvurunuz onaylandı. Etkinlik tarihinde buluşmak üzere!
                  </Text>
                  <TouchableOpacity 
                    style={styles.viewParticipantsButton}
                    onPress={() => setShowParticipants(true)}
                    activeOpacity={0.8}
                  >
                    <Users size={16} color="#FFFFFF" />
                    <Text style={styles.viewParticipantsText}>
                      Diğer Katılımcıları Gör ({approvedCount})
                    </Text>
                  </TouchableOpacity>
                </>
              ) : registrationStatus === 'rejected' ? (
                <>
                  <View style={styles.rejectedStatus}>
                    <XCircle size={20} color="#DC2626" />
                    <Text style={styles.rejectedStatusText}>Başvuru Reddedildi</Text>
                  </View>
                  <Text style={styles.rejectedMessage}>
                    Bu etkinliğe başvurunuz reddedildi. Başka etkinliklere göz atabilirsiniz.
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.pendingStatus}>
                    <Clock size={20} color="#D97706" />
                    <Text style={styles.pendingStatusText}>Başvuru Beklemede</Text>
                  </View>
                  <Text style={styles.pendingMessage}>
                    Başvurunuz etkinlik sahibi tarafından inceleniyor. Sonucu yakında öğreneceksiniz.
                  </Text>
                </>
              )}
            </View>
          ) : approvedCount >= event.max_participants ? (
            <View style={styles.statusContainer}>
              <View style={styles.fullStatus}>
                <Users size={20} color="#F59E0B" />
                <Text style={styles.fullStatusText}>Kontenjan Dolu</Text>
              </View>
              <Text style={styles.fullMessage}>
                Bu etkinlik için maksimum katılımcı sayısına ulaşılmıştır.
              </Text>
            </View>
          ) : (
            <View style={styles.registerContainer}>
              <View style={styles.availableStatus}>
                <Calendar size={20} color="#7C3AED" />
                <Text style={styles.availableStatusText}>Başvuru Açık</Text>
              </View>
              <Text style={styles.registerMessage}>
                Bu etkinliğe başvurmak için aşağıdaki butona tıklayabilirsiniz.
              </Text>
              <TouchableOpacity
                style={[styles.registerButton, registering && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={registering}
                activeOpacity={0.8}
              >
                <UserPlus size={20} color="#FFFFFF" />
                <Text style={styles.registerButtonText}>
                  {registering ? 'Başvuru gönderiliyor...' : 'Etkinliğe Başvur'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Participants List */}
        {approvedCount > 0 && canManageRegistrations && (
          <View style={styles.participantsCard}>
            <Text style={styles.cardTitle}>
              👥 Katılımcılar ({approvedCount})
            </Text>
            {registrations
              .filter(r => r.status === 'approved')
              .slice(0, 5)
              .map((registration) => (
                <TouchableOpacity 
                  key={registration.id} 
                  style={styles.participantItem}
                  onPress={() => {
                    console.log('👤 Approved participant clicked:', registration.profiles.first_name);
                    setSelectedParticipant(registration);
                    setShowParticipantDetails(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ 
                      uri: registration.profiles.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                    }} 
                    style={styles.participantAvatar} 
                  />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {registration.profiles.first_name} {registration.profiles.last_name}
                    </Text>
                    <Text style={styles.participantBranch}>{registration.profiles.branch}</Text>
                  </View>
                  <View style={styles.approvedBadge}>
                    <Text style={styles.approvedBadgeText}>Onaylandı</Text>
                  </View>
                </TouchableOpacity>
              ))}
            {approvedCount > 5 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setShowParticipants(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllText}>
                  +{approvedCount - 5} kişi daha göster
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Pending Registrations for Admin */}
        {pendingCount > 0 && canManageRegistrations && (
          <View style={styles.pendingCard}>
            <Text style={styles.cardTitle}>
              ⏳ Bekleyen İstekler ({pendingCount})
            </Text>
            {registrations
              .filter(r => r.status === 'pending')
              .map((registration) => (
                <View key={registration.id} style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <TouchableOpacity 
                      onPress={() => {
                        console.log('👤 Profile clicked for applicant:', registration.profiles.first_name);
                        setSelectedParticipant(registration);
                        setShowParticipantDetails(true);
                      }}
                      activeOpacity={0.6}
                      style={styles.clickableProfileContainer}
                    >
                      <Image 
                        source={{ 
                          uri: registration.profiles.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                        }} 
                        style={styles.applicantAvatar} 
                      />
                      <View style={styles.clickIndicator}>
                        <Eye size={12} color="#3B82F6" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        console.log('👤 Info clicked for applicant:', registration.profiles.first_name);
                        setSelectedParticipant(registration);
                        setShowParticipantDetails(true);
                      }}
                      activeOpacity={0.7}
                      style={styles.applicationInfo}
                    >
                      <Text style={styles.applicantName}>
                        {registration.profiles.first_name} {registration.profiles.last_name}
                      </Text>
                      <Text style={styles.applicantBranch}>{registration.profiles.branch}</Text>
                      <Text style={styles.applicantInstitution}>{registration.profiles.institution}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.applicationActions}>
                    <TouchableOpacity 
                      style={styles.cvButton}
                      onPress={() => router.push(`/cv-view/${registration.user_id}`)}
                      activeOpacity={0.8}
                    >
                      <Eye size={16} color="#3B82F6" />
                      <Text style={styles.cvButtonText}>CV Görüntüle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.approveButton}
                      onPress={() => handleApproveRegistration(registration.id)}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => handleRejectRegistration(registration.id)}
                      activeOpacity={0.8}
                    >
                      <XCircle size={16} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Participants Modal */}
      {showParticipants && (
        <View style={styles.modalOverlay}>
          <View style={styles.participantsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Etkinlik Katılımcıları</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowParticipants(false)}
                activeOpacity={0.8}
              >
                <XCircle size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.participantsList}>
              {participants.length === 0 ? (
                <View style={styles.emptyParticipants}>
                  <Users size={48} color="#9CA3AF" />
                  <Text style={styles.emptyParticipantsText}>
                    Henüz onaylanmış katılımcı bulunmuyor
                  </Text>
                </View>
              ) : (
                participants.map((participant) => (
                  <TouchableOpacity 
                    key={participant.id} 
                    style={styles.participantCard}
                    onPress={() => {
                      console.log('👤 Participant card clicked:', participant.profiles.first_name);
                      console.log('👤 Selected participant:', participant);
                      console.log('👤 Can view details:', canViewParticipantDetails);
                      setSelectedParticipant(participant);
                      setShowParticipantDetails(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.participantCardContent}>
                      <Image 
                        source={{ 
                          uri: participant.profiles.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                        }} 
                        style={styles.participantAvatar} 
                      />
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>
                          {participant.profiles.first_name} {participant.profiles.last_name}
                        </Text>
                        <Text style={styles.participantBranch}>{participant.profiles.branch}</Text>
                        <Text style={styles.participantInstitution}>{participant.profiles.institution}</Text>
                      </View>
                      <View style={styles.participantActions}>
                        <TouchableOpacity 
                          style={styles.cvButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/cv-view/${participant.user_id}`);
                          }}
                          activeOpacity={0.8}
                        >
                          <Eye size={16} color="#3B82F6" />
                          <Text style={styles.cvButtonText}>CV</Text>
                        </TouchableOpacity>
                        <View style={[
                          styles.statusBadge,
                          participant.status === 'approved' ? styles.approvedBadge : styles.pendingBadge
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            participant.status === 'approved' ? styles.approvedBadgeText : styles.pendingBadgeText
                          ]}>
                            {participant.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Participant Details Modal */}
      {showParticipantDetails && selectedParticipant && (
        <View style={styles.modalOverlay}>
          {console.log('🎯 Rendering participant details modal for:', selectedParticipant.profiles.first_name)}
          <View style={styles.participantDetailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Katılımcı Detayları</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowParticipantDetails(false);
                  setSelectedParticipant(null);
                }}
                activeOpacity={0.8}
              >
                <XCircle size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.participantDetailsContent}>
              <View style={styles.participantDetailsCard}>
                <Image 
                  source={{ 
                    uri: selectedParticipant.profiles.avatar_url || 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
                  }} 
                  style={styles.participantDetailsAvatar} 
                />
                <View style={styles.participantDetailsInfo}>
                  <Text style={styles.participantDetailsName}>
                    {selectedParticipant.profiles.first_name} {selectedParticipant.profiles.last_name}
                  </Text>
                  <Text style={styles.participantDetailsBranch}>{selectedParticipant.profiles.branch}</Text>
                  <Text style={styles.participantDetailsInstitution}>{selectedParticipant.profiles.institution}</Text>
                  
                  {selectedParticipant.profiles.city && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>📍 Şehir:</Text>
                      <Text style={styles.detailValue}>{selectedParticipant.profiles.city}</Text>
                    </View>
                  )}
                  
                  {selectedParticipant.profiles.phone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>📞 Telefon:</Text>
                      <Text style={styles.detailValue}>{selectedParticipant.profiles.phone}</Text>
                    </View>
                  )}
                  
                  {selectedParticipant.profiles.email && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>✉️ E-posta:</Text>
                      <Text style={styles.detailValue}>{selectedParticipant.profiles.email}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Başvuru Tarihi:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedParticipant.created_at).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📊 Durum:</Text>
                    <View style={[
                      styles.statusBadge,
                      selectedParticipant.status === 'approved' ? styles.approvedBadge : styles.pendingBadge
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        selectedParticipant.status === 'approved' ? styles.approvedBadgeText : styles.pendingBadgeText
                      ]}>
                        {selectedParticipant.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.participantDetailsActions}>
                <TouchableOpacity 
                  style={styles.cvButtonLarge}
                  onPress={() => router.push(`/cv-view/${selectedParticipant.user_id}`)}
                  activeOpacity={0.8}
                >
                  <Eye size={20} color="#3B82F6" />
                  <Text style={styles.cvButtonLargeText}>CV Görüntüle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBackButton: {
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
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  eventTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    lineHeight: 32,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  organizerDetails: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  organizerBranch: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusContainer: {
    alignItems: 'center',
  },
  expiredStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  expiredStatusText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expiredMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  approvedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  approvedStatusText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  approvedMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewParticipantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewParticipantsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  rejectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  rejectedStatusText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rejectedMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  pendingStatusText: {
    color: '#D97706',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  fullStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  fullStatusText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  registerContainer: {
    alignItems: 'center',
  },
  availableStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  availableStatusText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  participantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
    borderRadius: 8,
    marginVertical: 2,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  participantBranch: {
    fontSize: 14,
    color: '#6B7280',
  },
  approvedBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  applicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  applicationInfo: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    marginLeft: 8,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  applicantBranch: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  applicantInstitution: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  participantsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  participantsList: {
    maxHeight: 400,
  },
  emptyParticipants: {
    alignItems: 'center',
    padding: 40,
  },
  emptyParticipantsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  participantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  participantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantInstitution: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cvButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginRight: 8,
  },
  cvButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  approvedBadgeText: {
    color: '#059669',
  },
  pendingBadgeText: {
    color: '#D97706',
  },
  applicantDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantDetailsModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  participantDetailsContent: {
    padding: 20,
  },
  participantDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  participantDetailsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  participantDetailsInfo: {
    alignItems: 'center',
    width: '100%',
  },
  participantDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  participantDetailsBranch: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  participantDetailsInstitution: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  participantDetailsActions: {
    alignItems: 'center',
  },
  cvButtonLarge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cvButtonLargeText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clickableProfileContainer: {
    position: 'relative',
    padding: 8,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  clickIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickableInfoContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    marginLeft: 8,
  },
});