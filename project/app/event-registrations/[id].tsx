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
  Image,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, X, Phone, Mail, User, MapPin, Building, Calendar, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventRegistration {
  id: string;
  user_id: string;
  status: string;
  message: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    branch: string;
    institution: string;
    city: string;
    phone: string;
    email: string;
    avatar_url: string | null;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_participants: number;
  registration_deadline: string;
  user_id: string;
}

export default function EventRegistrationsPage() {
  const { id } = useLocalSearchParams();
  const eventId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchEventData();
      fetchRegistrations();
    }
  }, [id, user]);

  const fetchEventData = async () => {
    try {
      if (!id) return;
      
      // First try to get from posts table (since events are posts with type 'etkinlik')
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', eventId)
        .eq('post_type', 'etkinlik')
        .maybeSingle();

      if (postError && postError.code !== 'PGRST116') {
        console.error('❌ Error fetching post data:', postError);
        throw postError;
      }

      if (postData) {
        // Convert post data to event format
        const eventData = {
          id: postData.id,
          title: postData.title || 'Etkinlik',
          description: postData.content || '',
          event_date: postData.event_date || '01/01/2025',
          location: postData.event_location || 'Belirtilmemiş',
          max_participants: parseInt(String(postData.max_participants)) || 50,
          registration_deadline: postData.registration_deadline || '01/01/2025',
          user_id: postData.user_id
        };
        setEvent(eventData as Event);
        return;
      }

      // Fallback to events table
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data as Event);
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          profiles!event_registrations_user_id_fkey(
            first_name,
            last_name,
            branch,
            institution,
            city,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations((data || []) as unknown as EventRegistration[]);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (registrationId: string, status: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status })
        .eq('id', registrationId);

      if (error) throw error;

      const statusText = status === 'approved' ? 'onaylandı' : 'reddedildi';
      Alert.alert('Başarılı', `${userName} kullanıcısının kaydı ${statusText}`);
      
      // Refresh registrations list
      await fetchRegistrations();
    } catch (error) {
      console.error('Error updating registration status:', error);
      Alert.alert('Hata', 'Kayıt durumu güncellenirken hata oluştu');
    }
  };

  const handleCall = async (phone: string, name: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert('Hata', 'Telefon uygulaması açılamadı');
    }
  };

  const handleEmail = async (email: string, name: string) => {
    try {
      await Linking.openURL(`mailto:${email}?subject=Etkinlik Hakkında`);
    } catch (error) {
      Alert.alert('Hata', 'E-posta uygulaması açılamadı');
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

  const renderRegistrationItem = ({ item }: { item: EventRegistration }) => (
    <View style={styles.registrationCard}>
      <View style={styles.registrationHeader}>
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => router.push(`/user-profile/${item.user_id}`)}
          activeOpacity={0.7}
        >
          <Image 
            source={{ 
              uri: item.profiles.avatar_url || 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
            }} 
            style={styles.userAvatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {getFormattedName(item.profiles.first_name, item.profiles.last_name, item.profiles.branch)}
            </Text>
            <Text style={styles.userBranch}>{item.profiles.branch}</Text>
            <View style={styles.userMeta}>
              <Building size={12} color="#64748B" />
              <Text style={styles.userMetaText}>{item.profiles.institution}</Text>
            </View>
            <View style={styles.userMeta}>
              <MapPin size={12} color="#64748B" />
              <Text style={styles.userMetaText}>{item.profiles.city}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactSectionTitle}>İletişim Bilgileri</Text>
        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => {
              const fullName = `${item.profiles.first_name} ${item.profiles.last_name}`;
              handleCall(item.profiles.phone, fullName);
            }}
            activeOpacity={0.8}
          >
            <Phone size={16} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>{item.profiles.phone}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => {
              const fullName = `${item.profiles.first_name} ${item.profiles.last_name}`;
              handleEmail(item.profiles.email, fullName);
            }}
            activeOpacity={0.8}
          >
            <Mail size={16} color="#FFFFFF" />
            <Text style={styles.emailButtonText}>{item.profiles.email}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.message && (
        <View style={styles.messageSection}>
          <Text style={styles.messageSectionTitle}>Mesaj:</Text>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      )}

      <View style={styles.registrationFooter}>
        <Text style={styles.registrationDate}>
          Kayıt: {new Date(item.created_at).toLocaleDateString('tr-TR', {
            timeZone: 'Europe/Istanbul'
          })}
        </Text>
        
        {item.status === 'pending' && event?.user_id === user?.id && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => {
                const fullName = `${item.profiles.first_name} ${item.profiles.last_name}`;
                updateRegistrationStatus(item.id, 'approved', fullName);
              }}
              activeOpacity={0.8}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.approveButtonText}>Onayla</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => {
                const fullName = `${item.profiles.first_name} ${item.profiles.last_name}`;
                updateRegistrationStatus(item.id, 'rejected', fullName);
              }}
              activeOpacity={0.8}
            >
              <X size={16} color="#FFFFFF" />
              <Text style={styles.rejectButtonText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // Check if current user is the event owner
  if (event && event.user_id !== user?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Erişim Reddedildi</Text>
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Bu sayfaya sadece etkinlik sahibi erişebilir.</Text>
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
        <Text style={styles.headerTitle}>Etkinlik Kayıtları</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Event Info */}
      {event && (
        <View style={styles.eventInfoCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <Calendar size={16} color="#7C3AED" />
            <Text style={styles.eventMetaText}>
              {new Date(event.event_date).toLocaleDateString('tr-TR', {
                timeZone: 'Europe/Istanbul'
              })}
            </Text>
          </View>
          <View style={styles.eventMeta}>
            <MapPin size={16} color="#7C3AED" />
            <Text style={styles.eventMetaText}>{event.location}</Text>
          </View>
        </View>
      )}

      {/* Registrations Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {registrations.length} kayıt talebi
        </Text>
        <Text style={styles.countSubtext}>
          Onaylanan: {registrations.filter(r => r.status === 'approved').length}
        </Text>
      </View>

      {/* Registrations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Kayıtlar yükleniyor...</Text>
        </View>
      ) : registrations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Henüz Kayıt Yok</Text>
          <Text style={styles.emptyStateText}>
            Etkinliğinize henüz kimse kayıt olmamış.
          </Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderRegistrationItem}
          keyExtractor={(item) => item.id}
          style={styles.registrationsList}
          contentContainerStyle={styles.registrationsContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  eventInfoCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '500',
  },
  countContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
  },
  countSubtext: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
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
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
  },
  registrationsList: {
    flex: 1,
  },
  registrationsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  registrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  registrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userBranch: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contactSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  emailButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  messageSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 18,
  },
  registrationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  registrationDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});