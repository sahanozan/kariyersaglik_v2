import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Clock, TriangleAlert as AlertTriangle, Info } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Algorithm {
  id: string;
  title: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  content: any;
  last_updated: string;
}

export default function AlgorithmDetailPage() {
  const { id } = useLocalSearchParams();
  const algorithmId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlgorithm();
  }, [id]);

  const fetchAlgorithm = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setAlgorithm(null);
        setLoading(false);
        return;
      }
      
      // Supabase'den algoritma verilerini çek
      const { data, error } = await supabase
        .from('algorithms')
        .select('*')
        .eq('id', algorithmId)
        .single();

      if (error) {
        console.error('Error fetching algorithm:', error);
        setAlgorithm(null);
      } else {
        setAlgorithm(data as Algorithm);
      }
    } catch (error) {
      console.error('Error fetching algorithm:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#DC2626';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Kritik';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return '';
    }
  };

  const renderTreatmentList = (treatments: string[]) => (
    <View style={styles.treatmentList}>
      {treatments.map((treatment, index) => (
        <View key={index} style={styles.treatmentItem}>
          <View style={styles.bullet} />
          <Text style={styles.treatmentText}>{treatment}</Text>
        </View>
      ))}
    </View>
  );

  const renderSection = (title: string, content: any) => {
    if (Array.isArray(content)) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {renderTreatmentList(content)}
        </View>
      );
    }

    if (typeof content === 'object' && content !== null) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {Object.entries(content).map(([key, value]: [string, any]) => (
            <View key={key} style={styles.subsection}>
              {value.title && <Text style={styles.subsectionTitle}>{value.title}</Text>}
              {value.treatment && renderTreatmentList(value.treatment)}
              {value.criteria && <Text style={styles.criteriaText}>{value.criteria}</Text>}
              {Array.isArray(value) && renderTreatmentList(value)}
              {typeof value === 'string' && <Text style={styles.contentText}>{value}</Text>}
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.contentText}>{content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yükleniyor...</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Algoritma yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!algorithm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Algoritma Bulunamadı</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Bu algoritma bulunamadı.</Text>
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
        <Text style={styles.headerTitle} numberOfLines={2}>{algorithm.title}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Algorithm Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.algorithmHeader}>
            <View style={styles.iconContainer}>
              <FileText size={32} color="#EF4444" />
            </View>
            <View style={styles.algorithmInfo}>
              <Text style={styles.algorithmTitle}>{algorithm.title}</Text>
              <Text style={styles.category}>{algorithm.category}</Text>
              <View style={styles.urgencyBadge}>
                <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(algorithm.urgency) }]} />
                <Text style={[styles.urgencyText, { color: getUrgencyColor(algorithm.urgency) }]}>
                  {getUrgencyText(algorithm.urgency)}
                </Text>
              </View>
              <View style={styles.updateInfo}>
                <Clock size={16} color="#9CA3AF" />
                <Text style={styles.lastUpdated}>
                  Son güncelleme: {new Date(algorithm.last_updated).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
          {algorithm.content.description && (
            <Text style={styles.description}>{algorithm.content.description}</Text>
          )}
        </View>

        {/* Algorithm Content */}
        {algorithm.content.symptoms && renderSection('Semptomlar', algorithm.content.symptoms)}
        {algorithm.content.immediate_actions && renderSection('Acil Müdahaleler', algorithm.content.immediate_actions)}
        {algorithm.content.treatment && renderSection('Tedavi', algorithm.content.treatment)}
        {algorithm.content.medications && renderSection('İlaçlar', algorithm.content.medications)}
        {algorithm.content.types && renderSection('Tipler', algorithm.content.types)}
        {algorithm.content.steps && renderSection('Uygulama Adımları', algorithm.content.steps)}
        {algorithm.content.criteria && renderSection('Tanı Kriterleri', algorithm.content.criteria)}
        {algorithm.content.classification && renderSection('Sınıflandırma', algorithm.content.classification)}
        {algorithm.content.primary_survey && renderSection('Birincil Değerlendirme', algorithm.content.primary_survey)}
        {algorithm.content.pain_management && renderSection('Ağrı Yönetimi', algorithm.content.pain_management)}
        {algorithm.content.supportive_care && renderSection('Destekleyici Bakım', algorithm.content.supportive_care)}
        {algorithm.content.monitoring && renderSection('Takip', algorithm.content.monitoring)}
        {algorithm.content.hospitalization_criteria && renderSection('Yatış Kriterleri', algorithm.content.hospitalization_criteria)}
        {algorithm.content.contraindications && renderSection('Kontrendikasyonlar', algorithm.content.contraindications)}
        {algorithm.content.warning_signs && renderSection('Uyarı İşaretleri', algorithm.content.warning_signs)}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <AlertTriangle size={20} color="#D97706" />
          <Text style={styles.disclaimerText}>
            Bu algoritma genel rehber niteliğindedir. Her hasta için bireysel değerlendirme yapılmalıdır. 
            Acil durumlarda en yakın sağlık kuruluşuna başvurunuz.
          </Text>
        </View>
      </ScrollView>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerRight: {
    width: 40,
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
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  algorithmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  algorithmInfo: {
    flex: 1,
  },
  algorithmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  treatmentList: {
    marginLeft: 8,
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
    marginRight: 12,
  },
  treatmentText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 18,
  },
  criteriaText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
});