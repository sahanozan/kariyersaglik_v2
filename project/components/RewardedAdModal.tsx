import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { adService } from '@/lib/adService';
import { X, Gift, Star, Clock } from 'lucide-react-native';

interface RewardedAdModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  onCancel?: () => void; // Yeni prop: reklam iptal edildiğinde
  title?: string;
  description?: string;
  rewardText?: string;
  adType?: 'jobs' | 'createJob';
}

export default function RewardedAdModal({
  visible,
  onClose,
  onRewardEarned,
  onCancel,
  title = "Ödüllü Reklam",
  description = "Kısa bir reklam izleyerek iş ilanlarına erişim kazanın!",
  rewardText = "İş ilanlarına erişim",
  adType = 'jobs'
}: RewardedAdModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchAd = async () => {
    console.log('🎬 RewardedAdModal: Watch ad button pressed');
    setIsLoading(true);
    
    try {
      // AdService'deki hazır reklamı kullan
      let adSuccess = false;
      
      if (adType === 'jobs') {
        console.log('🎬 Showing jobs rewarded ad...');
        console.log('🎬 Jobs ad ready status:', adService.isAdReadyJobs());
        
        // Reklam hazır değilse önce yükle
        if (!adService.isAdReadyJobs()) {
          console.log('🎬 Jobs ad not ready, preloading...');
          adService.preloadAdJobs();
          // 2 saniye bekle
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        adSuccess = await adService.showRewardedAdJobs();
      } else if (adType === 'createJob') {
        console.log('🎬 Showing create job rewarded ad...');
        console.log('🎬 Create job ad ready status:', adService.isAdReadyCreateJob());
        
        // Reklam hazır değilse önce yükle
        if (!adService.isAdReadyCreateJob()) {
          console.log('🎬 Create job ad not ready, preloading...');
          adService.preloadAdCreateJob();
          // 2 saniye bekle
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        adSuccess = await adService.showRewardedAdCreateJob();
      }
      
      if (adSuccess) {
        console.log('✅ Ad completed successfully');
        onRewardEarned();
        onClose();
        Alert.alert('Tebrikler!', `${rewardText} kazandınız!`);
      } else {
        console.log('❌ Ad failed or was not available');
        // Reklam başarısız olsa bile erişim ver
        onRewardEarned();
        onClose();
        Alert.alert('Tebrikler!', `${rewardText} kazandınız! (Reklam şu anda mevcut değil)`);
      }
      
    } catch (error) {
      console.error('Error showing ad:', error);
      // Hata durumunda da erişim ver
      onRewardEarned();
      onClose();
      Alert.alert('Tebrikler!', `${rewardText} kazandınız! (Reklam atlandı)`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reklam iptal edildi - onCancel çağır
      if (onCancel) {
        onCancel();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Gift size={24} color="#7C3AED" />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Star size={48} color="#F59E0B" />
            </View>
            
            <Text style={styles.description}>{description}</Text>
            
            <View style={styles.rewardContainer}>
              <Clock size={16} color="#10B981" />
              <Text style={styles.rewardText}>{rewardText}</Text>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Kazanacaklarınız:</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• Tüm iş ilanlarını görüntüleme</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• Detaylı iş açıklamaları</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>• Başvuru yapma imkanı</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.watchButton,
                isLoading && styles.watchButtonDisabled
              ]}
              onPress={handleWatchAd}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Gift size={20} color="#FFFFFF" />
                  <Text style={styles.watchButtonText}>
                    Reklamı İzle (Mock)
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>Şimdi Değil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  benefitItem: {
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  watchButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  watchButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});