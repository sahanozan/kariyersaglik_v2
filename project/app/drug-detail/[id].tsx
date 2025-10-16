import { useState, useEffect } from 'react';
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
import { ArrowLeft, Pill, TriangleAlert as AlertTriangle, Info, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Drug {
  id: string;
  name: string;
  active_ingredient: string;
  category: string;
  company: string;
  content: any;
}

export default function DrugDetailPage() {
  const { id } = useLocalSearchParams();
  const drugId = Array.isArray(id) ? id[0] : id || '';
  const { user } = useAuth();
  const [drug, setDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrug();
  }, [id]);

  const fetchDrug = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        setDrug(null);
        setLoading(false);
        return;
      }
      
      // Supabase'den ilaç verilerini çek
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('id', drugId)
        .single();

      if (error) {
        console.error('Error fetching drug:', error);
        setDrug(null);
      } else {
        setDrug(data);
      }
    } catch (error) {
      console.error('Error fetching drug:', error);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.loadingText}>İlaç bilgileri yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!drug) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İlaç Bulunamadı</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Bu ilaç bulunamadı.</Text>
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
        <Text style={styles.headerTitle} numberOfLines={2}>{drug.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Drug Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.drugHeader}>
            <View style={styles.iconContainer}>
              <Pill size={32} color="#EF4444" />
            </View>
            <View style={styles.drugInfo}>
              <Text style={styles.drugName}>{drug.name}</Text>
              <Text style={styles.activeIngredient}>{drug.active_ingredient}</Text>
              <Text style={styles.category}>{drug.category}</Text>
              <Text style={styles.company}>Üretici: {drug.company}</Text>
            </View>
          </View>
          <Text style={styles.description}>{drug.content?.description}</Text>
        </View>

        {/* Indications */}
        {drug.content?.indications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endikasyonlar</Text>
            {drug.content.indications.map((indication: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{indication}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Dosage */}
        {drug.content?.dosage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doz ve Kullanım</Text>
            {typeof drug.content.dosage === 'string' ? (
              <Text style={styles.dosageText}>{drug.content.dosage}</Text>
            ) : (
              <>
                {drug.content.dosage.adult && (
                  <View style={styles.dosageItem}>
                    <Text style={styles.dosageLabel}>Yetişkin:</Text>
                    <Text style={styles.dosageText}>{drug.content.dosage.adult}</Text>
                  </View>
                )}
                {drug.content.dosage.pediatric && (
                  <View style={styles.dosageItem}>
                    <Text style={styles.dosageLabel}>Pediatrik:</Text>
                    <Text style={styles.dosageText}>{drug.content.dosage.pediatric}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Contraindications */}
        {drug.content?.contraindications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kontrendikasyonlar</Text>
            {drug.content.contraindications.map((contraindication: string, index: number) => (
              <View key={index} style={styles.warningItem}>
                <AlertTriangle size={16} color="#DC2626" />
                <Text style={styles.warningItemText}>{contraindication}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {drug.content?.warnings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uyarılar ve Önlemler</Text>
            {drug.content.warnings.map((warning: string, index: number) => (
              <View key={index} style={styles.warningItem}>
                <AlertTriangle size={16} color="#D97706" />
                <Text style={styles.warningItemText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Side Effects */}
        {drug.content?.side_effects && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yan Etkiler</Text>
            {drug.content.side_effects.map((effect: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{effect}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Drug Interactions */}
        {drug.content?.interactions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İlaç Etkileşimleri</Text>
            {drug.content.interactions.map((interaction: string, index: number) => (
              <View key={index} style={styles.interactionItem}>
                <Info size={16} color="#2563EB" />
                <Text style={styles.interactionText}>{interaction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <AlertTriangle size={20} color="#D97706" />
          <Text style={styles.disclaimerText}>
            Bu bilgiler sadece referans amaçlıdır. İlaç kullanımı öncesi mutlaka doktorunuza danışın.
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
    shadowRadius: 3.84,
    elevation: 5,
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drugInfo: {
    flex: 1,
  },
  drugName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  activeIngredient: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  section: {
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
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
    marginRight: 12,
  },
  listText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  dosageItem: {
    marginBottom: 16,
  },
  dosageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  warningItemText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
  },
  interactionText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 8,
    flex: 1,
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
});