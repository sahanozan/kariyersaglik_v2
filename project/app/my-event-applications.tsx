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
import { ArrowLeft, Calendar, Clock, CircleCheck as CheckCircle, Circle as XCircle, Eye } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventApplication {
  id: string;
  status: string;
  message: string;
  created_at: string;
  updated_at: string;
  events: {
    id: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    user_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function MyEventApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<EventApplication[]>([]);
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
        .from('event_registrations')
        .select(`
          *,
          events!event_registrations_event_id_fkey(
            id,
            title,
            description,
            event_date,
            location,
            user_id,
            profiles!events_user_id_fkey(first_name, last_name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching event applications:', error);
      Alert.alert('Hata', 'Etkinlik başvuruları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const renderApplicationItem = ({ item }: { item: EventApplication }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <TouchableOpacity
        style={styles.applicationCard}
        onPress={() => router.push(`/event-detail/${item.events.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.applicationHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.events.title}</Text>
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.events.description}
            </Text>
            <Text style={styles.eventLocation}>📍 {item.events.location}</Text>
            <Text style={styles.eventDate}>
              📅 {new Date(item.events.event_date).toLocaleDateString('tr-TR')}
            </Text>
            <Text style={styles.eventOrganizer}>
              Etkinlik Sahibi: {item.events.profiles.first_name} {item.events.profiles.last_name}
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
            Başvuru: {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
          {item.updated_at !== item.created_at && (
            <Text style={styles.updatedDate}>
              Güncelleme: {new Date(item.updated_at).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
        
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Mesajınız:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
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
        <Text style={styles.headerTitle}>Etkinlik Başvurularım</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {applications.length} etkinlik başvurusu
        </Text>
        <Text style={styles.summarySubtext}>
          Onaylanan: {applications.filter(a => a.status === 'approved').length} | 
          Beklemede: {applications.filter(a => a.status === 'pending').length} | 
          Reddedilen: {applications.filter(a => a.status === 'rejected').length}
        </Text>
      </View>

      {/* Applications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Başvurular yükleniyor...</Text>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Henüz Başvuru Yok</Text>
          <Text style={styles.emptyStateText}>
            Etkinlikler sayfasından etkinliklere başvuru yapabilirsiniz.
          </Text>
          <TouchableOpacity 
            style={styles.browseEventsButton}
            onPress={() => router.push('/events')}
          >
            <Text style={styles.browseEventsButtonText}>Etkinliklere Göz At</Text>
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
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#64748B',
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
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseEventsButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  browseEventsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applicationsList: {
    flex: 1,
  },
  applicationsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  applicationCard: {
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
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 8,
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  appliedDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  updatedDate: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  messageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
});


