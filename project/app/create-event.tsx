import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Users, Clock, FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isValidDDMMYYYYDate, isDateInFutureDDMMYYYY, isValidTimeString } from '@/lib/utils';

export default function CreateEventPage() {
  const { user } = useAuth();
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    maxParticipants: '50',
    registrationDeadline: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!eventData.title || !eventData.description || !eventData.eventDate || 
        !eventData.location || !eventData.registrationDeadline) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Validate event date format
    if (!isValidDDMMYYYYDate(eventData.eventDate)) {
      Alert.alert('Geçersiz Tarih', 'Etkinlik tarihi GG/AA/YYYY formatında olmalıdır (örn: 15/03/2025)');
      return;
    }

    // Validate event time if provided
    if (eventData.eventTime && !isValidTimeString(eventData.eventTime)) {
      Alert.alert('Geçersiz Saat', 'Etkinlik saati HH:MM formatında olmalıdır (örn: 14:30)');
      return;
    }

    // Validate registration deadline format
    if (!isValidDDMMYYYYDate(eventData.registrationDeadline)) {
      Alert.alert('Geçersiz Tarih', 'Kayıt son tarihi GG/AA/YYYY formatında olmalıdır (örn: 10/03/2025)');
      return;
    }

    // Check if dates are in the future
    if (!isDateInFutureDDMMYYYY(eventData.eventDate, eventData.eventTime)) {
      Alert.alert('Geçersiz Tarih', 'Etkinlik tarihi bugün veya gelecekte olmalıdır');
      return;
    }

    if (!isDateInFutureDDMMYYYY(eventData.registrationDeadline)) {
      Alert.alert('Geçersiz Tarih', 'Kayıt son tarihi bugün veya gelecekte olmalıdır');
      return;
    }

    // Check if registration deadline is before event date
    const regDate = new Date(eventData.registrationDeadline.split('/').reverse().join('-'));
    const evtDate = new Date(eventData.eventDate.split('/').reverse().join('-'));
    if (regDate >= evtDate) {
      Alert.alert('Geçersiz Tarih', 'Kayıt son tarihi etkinlik tarihinden önce olmalıdır');
      return;
    }

    setLoading(true);
    
    try {
      // Combine date and time
      const eventDateTime = eventData.eventTime ? 
        `${eventData.eventDate}T${eventData.eventTime}:00` : 
        `${eventData.eventDate}T09:00:00`;
      
      const registrationDateTime = `${eventData.registrationDeadline}T23:59:59`;

      // Create event as a post with type 'etkinlik'
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          title: eventData.title,
          content: eventData.description,
          post_type: 'etkinlik',
          event_date: eventData.eventDate,
          event_time: eventData.eventTime,
          event_location: eventData.location,
          max_participants: parseInt(eventData.maxParticipants) || 50,
          registration_deadline: eventData.registrationDeadline,
          media_urls: []
        });

      if (error) throw error;

      Alert.alert('Başarılı', 'Etkinliğiniz oluşturuldu!', [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Hata', 'Etkinlik oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Etkinlik Oluştur</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Etkinlik Başlığı *</Text>
            <View style={styles.inputWrapper}>
              <FileText size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Acil Tıp Kongresi 2025"
                value={eventData.title}
                onChangeText={(text) => setEventData({...eventData, title: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Açıklama *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Etkinlik hakkında detaylı bilgi verin..."
              value={eventData.description}
              onChangeText={(text) => setEventData({...eventData, description: text})}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Event Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Etkinlik Tarihi *</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="GG/AA/YYYY (örn: 15/03/2025)"
                value={eventData.eventDate}
                onChangeText={(text) => setEventData({...eventData, eventDate: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Event Time */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Etkinlik Saati</Text>
            <View style={styles.inputWrapper}>
              <Clock size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="HH:MM (örn: 14:30)"
                value={eventData.eventTime}
                onChangeText={(text) => setEventData({...eventData, eventTime: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Konum *</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Örn: İstanbul Kongre Merkezi"
                value={eventData.location}
                onChangeText={(text) => setEventData({...eventData, location: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Max Participants */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Maksimum Katılımcı</Text>
            <View style={styles.inputWrapper}>
              <Users size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="50"
                value={eventData.maxParticipants}
                onChangeText={(text) => setEventData({...eventData, maxParticipants: text})}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Registration Deadline */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Kayıt Son Tarihi *</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="GG/AA/YYYY (örn: 10/03/2025)"
                value={eventData.registrationDeadline}
                onChangeText={(text) => setEventData({...eventData, registrationDeadline: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Etkinlik Oluşturuluyor...' : 'Etkinlik Oluştur'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  createButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});