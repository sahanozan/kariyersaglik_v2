import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, Pill, TriangleAlert as AlertTriangle, Info, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdvertisementBanner from '@/components/AdvertisementBanner';

interface Drug {
  id: string;
  name: string;
  active_ingredient: string;
  category: string;
  company: string;
  content: Record<string, unknown>;
  created_at: string;
}

export default function DrugProspectusPage() {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDrugs();
    }
  }, [user]);

  const fetchDrugs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching drugs:', error);
        setDrugs([]);
      } else {
        setDrugs((data || []) as Drug[]);
      }
    } catch (error) {
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.active_ingredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDrugItem = ({ item }: { item: Drug }) => (
    <TouchableOpacity
      style={styles.drugCard}
      onPress={() => router.push(`/drug-detail/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Pill size={24} color="#EF4444" />
        </View>
        <View style={styles.drugInfo}>
          <Text style={styles.drugName}>{item.name}</Text>
          <Text style={styles.activeIngredient}>{item.active_ingredient}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {String(item.content?.description || 'İlaç bilgisi')}
          </Text>
          
          <View style={styles.drugMeta}>
            <Text style={styles.company}>{item.company}</Text>
            {(item.content?.warnings as any[])?.length > 0 && (
              <View style={styles.warningIndicator}>
                <AlertTriangle size={12} color="#DC2626" />
                <Text style={styles.warningCount}>{(item.content.warnings as any[]).length} uyarı</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlaç Prospektüsleri</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Offline Indicator */}
      <View style={styles.offlineIndicator}>
        <View style={styles.offlineDot} />
        <Text style={styles.offlineText}>Çevrimdışı erişilebilir</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="İlaç adı, etken madde ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredDrugs.length} ilaç bulundu
        </Text>
        <View style={styles.infoButton}>
          <Info size={16} color="#6B7280" />
          <Text style={styles.infoText}>Sadece referans amaçlıdır</Text>
        </View>
      </View>

      {/* Drugs List - Only show if warning is dismissed */}
      {!showWarning && (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EF4444" />
              <Text style={styles.loadingText}>İlaçlar yükleniyor...</Text>
            </View>
          ) : filteredDrugs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>İlaç Bulunamadı</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? 'Arama kriterlerinize uygun ilaç bulunamadı.' 
                  : 'Henüz ilaç prospektüsü eklenmemiş. Admin panelinden ilaç ekleyebilirsiniz.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDrugs}
              renderItem={renderDrugItem}
              keyExtractor={(item) => item.id}
              style={styles.drugsList}
              contentContainerStyle={styles.drugsContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* Reklam Banner - Alt navigasyonun üstünde */}
      <View style={styles.bannerContainer}>
        <AdvertisementBanner 
          onPress={() => {
            // Reklam tıklama işlemi
            console.log('Reklam banner\'ına tıklandı');
          }}
        />
      </View>

      {/* Warning Modal - Full Screen */}
      <Modal
        visible={showWarning}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {}} // Prevent closing with back button
      >
        <SafeAreaView style={styles.warningModalContainer}>
          <View style={styles.warningModalContent}>
            <View style={styles.warningIconContainer}>
              <AlertTriangle size={80} color="#DC2626" />
            </View>
            
            <Text style={styles.warningModalTitle}>ÖNEMLİ UYARI</Text>
            
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningModalText}>
                Bu sayfadaki <Text style={styles.boldText}>ilaç prospektüsleri</Text> genel bilgilendirme amaçlıdır.
              </Text>
              
              <Text style={styles.warningModalText}>
                Doz, endikasyon ve kontrendikasyon gibi <Text style={styles.boldText}>kritik bilgileri</Text> reçete eden hekime veya eczacınıza danışmadan uygulamayınız.
              </Text>
              
              <Text style={styles.warningModalText}>
                İlaçların yanlış ve bilinçsiz kullanımı <Text style={styles.boldText}>ciddi sağlık sorunlarına</Text> yol açabilir.
              </Text>
              
              <Text style={styles.warningModalTextFinal}>
                Son karar için <Text style={styles.boldText}>hekiminize başvurunuz.</Text>
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.warningModalButton}
              onPress={() => setShowWarning(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.warningModalButtonText}>Okudum ve Anladım</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  offlineIndicator: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  warningBalloon: {
    position: 'relative',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  warningTriangle: {
    position: 'absolute',
    top: -8,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FEF2F2',
  },
  warningContent: {
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  warningText: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  understoodButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  understoodButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  drugsList: {
    flex: 1,
  },
  drugsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  drugCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  drugInfo: {
    flex: 1,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activeIngredient: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
  },
  drugMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  company: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  warningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningCount: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 4,
    fontWeight: '500',
  },
  warningModalContainer: {
    flex: 1,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  warningModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  warningIconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 50,
  },
  warningModalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  warningTextContainer: {
    marginBottom: 32,
  },
  warningModalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningModalTextFinal: {
    fontSize: 18,
    color: '#DC2626',
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '700',
    color: '#DC2626',
  },
  warningModalButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
  },
  warningModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
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
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 75, // Tab bar yüksekliği
    left: 0,
    right: 0,
    zIndex: 5,
    elevation: 5,
    paddingHorizontal: 16,
  },
});