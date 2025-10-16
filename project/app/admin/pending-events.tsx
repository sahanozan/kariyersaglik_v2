import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Check, X, Eye, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PendingEvent {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: string;
  event_date: string;
  event_time: string;
  event_location: string;
  max_participants: number;
  registration_deadline: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    branch: string;
    institution: string;
    city: string;
  };
}

export default function PendingEventsPage() {
  const { user } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCurrentUserData();
    fetchPendingEvents();
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

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      
      // Check admin/moderator access
      if (currentUserData && 
          currentUserData.role !== 'admin' && 
          currentUserData.role !== 'moderator') {
        setPendingEvents([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          title,
          content,
          post_type,
          event_date,
          event_time,
          event_location,
          max_participants,
          registration_deadline,
          created_at,
          profiles!posts_user_id_fkey(first_name, last_name, branch, institution, city)
        `)
        .eq('post_type', 'etkinlik')
        .eq('is_approved', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingEvents(data as PendingEvent[] || []);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Etkinliği Onayla',
      `"${eventTitle}" etkinliğini onaylamak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('approve_post', {
                post_id: eventId
              });

              if (error) throw error;

              Alert.alert('Başarılı', 'Etkinlik onaylandı!');
              fetchPendingEvents();
            } catch (error) {
              console.error('Error approving event:', error);
              Alert.alert('Hata', 'Etkinlik onaylanırken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const rejectEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Etkinliği Reddet',
      `"${eventTitle}" etkinliğini reddetmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('reject_post', {
                post_id: eventId
              });

              if (error) throw error;

              Alert.alert('Başarılı', 'Etkinlik reddedildi!');
              fetchPendingEvents();
            } catch (error) {
              console.error('Error rejecting event:', error);
              Alert.alert('Hata', 'Etkinlik reddedilirken hata oluştu');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const renderEventCard = (event: PendingEvent) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventMeta}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventAuthor}>
            {event.profiles?.first_name} {event.profiles?.last_name}
            {event.profiles?.branch && ` • ${event.profiles.branch}`}
          </Text>
        </View>
        <Text style={styles.eventDate}>
          {formatDate(event.created_at)}
        </Text>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.eventDetailText}>
            {formatDate(event.event_date)} {event.event_time && `• ${formatTime(event.event_time)}`}
          </Text>
        </View>
        
        {event.event_location && (
          <View style={styles.eventDetailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.eventDetailText}>{event.event_location}</Text>
          </View>
        )}
        
        <View style={styles.eventDetailRow}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.eventDetailText}>
            Maksimum {event.max_participants} katılımcı
          </Text>
        </View>
        
        {event.registration_deadline && (
          <View style={styles.eventDetailRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.eventDetailText}>
              Kayıt son tarihi: {formatDate(event.registration_deadline)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.eventContent} numberOfLines={3}>
        {event.content}
      </Text>

      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            setSelectedEvent(event);
            setShowDetailModal(true);
          }}
        >
          <Eye size={16} color="#3B82F6" />
          <Text style={styles.viewButtonText}>Detay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => approveEvent(event.id, event.title)}
        >
          <Check size={16} color="#10B981" />
          <Text style={styles.approveButtonText}>Onayla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectEvent(event.id, event.title)}
        >
          <X size={16} color="#EF4444" />
          <Text style={styles.rejectButtonText}>Reddet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailModal(false)}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Etkinlik Detayları</Text>
        </View>

        {selectedEvent && (
          <ScrollView style={styles.modalContent}>
            <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Etkinlik Bilgileri</Text>
              
              <View style={styles.detailRow}>
                <Calendar size={20} color="#3B82F6" />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Tarih ve Saat</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedEvent.event_date)} {selectedEvent.event_time && `• ${formatTime(selectedEvent.event_time)}`}
                  </Text>
                </View>
              </View>
              
              {selectedEvent.event_location && (
                <View style={styles.detailRow}>
                  <MapPin size={20} color="#3B82F6" />
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailLabel}>Konum</Text>
                    <Text style={styles.detailValue}>{selectedEvent.event_location}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Users size={20} color="#3B82F6" />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Katılımcı Sayısı</Text>
                  <Text style={styles.detailValue}>Maksimum {selectedEvent.max_participants} kişi</Text>
                </View>
              </View>
              
              {selectedEvent.registration_deadline && (
                <View style={styles.detailRow}>
                  <Clock size={20} color="#3B82F6" />
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailLabel}>Kayıt Son Tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedEvent.registration_deadline)}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Etkinlik Açıklaması</Text>
              <Text style={styles.detailDescription}>{selectedEvent.content}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Oluşturan</Text>
              <View style={styles.detailRow}>
                <User size={20} color="#3B82F6" />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Ad Soyad</Text>
                  <Text style={styles.detailValue}>
                    {selectedEvent.profiles?.first_name} {selectedEvent.profiles?.last_name}
                  </Text>
                </View>
              </View>
              
              {selectedEvent.profiles?.branch && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Branş</Text>
                  <Text style={styles.detailValue}>{selectedEvent.profiles.branch}</Text>
                </View>
              )}
              
              {selectedEvent.profiles?.institution && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kurum</Text>
                  <Text style={styles.detailValue}>{selectedEvent.profiles.institution}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalRejectButton}
            onPress={() => {
              setShowDetailModal(false);
              if (selectedEvent) {
                rejectEvent(selectedEvent.id, selectedEvent.title);
              }
            }}
          >
            <X size={20} color="#EF4444" />
            <Text style={styles.modalRejectButtonText}>Reddet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalApproveButton}
            onPress={() => {
              setShowDetailModal(false);
              if (selectedEvent) {
                approveEvent(selectedEvent.id, selectedEvent.title);
              }
            }}
          >
            <Check size={20} color="#10B981" />
            <Text style={styles.modalApproveButtonText}>Onayla</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bekleyen Etkinlikler</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bekleyen Etkinlikler</Text>
      </View>

      <ScrollView style={styles.content}>
        {pendingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Bekleyen Etkinlik Yok</Text>
            <Text style={styles.emptyText}>
              Onay bekleyen etkinlik bulunmuyor.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {pendingEvents.length} etkinlik onay bekliyor
              </Text>
            </View>
            {pendingEvents.map(renderEventCard)}
          </>
        )}
      </ScrollView>

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventMeta: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventAuthor: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  eventContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  approveButtonText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailRowContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  detailDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginRight: 8,
  },
  modalRejectButtonText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalApproveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginLeft: 8,
  },
  modalApproveButtonText: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '600',
  },
});
