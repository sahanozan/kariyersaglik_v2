import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { adService } from '@/lib/adService';

// Web için AdMob import'u devre dışı
let BannerAd: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const { BannerAd: BA, BannerAdSize: BAS } = require('react-native-google-mobile-ads');
    BannerAd = BA;
    BannerAdSize = BAS;
  } catch (error) {
    console.log('AdMob not available');
  }
}

export default function RedBorderedBanner() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 RedBorderedBanner: Component mounted');
    console.log('🔍 Platform.OS:', Platform.OS);
    console.log('🔍 BannerAd available:', !!BannerAd);
    console.log('🔍 BannerAdSize available:', !!BannerAdSize);
    console.log('🔍 Banner Ad Unit ID:', adService.getBannerAdUnitId());
  }, []);

  // Web'de reklam gösterme
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform - showing production banner info');
    return (
      <View style={styles.container}>
        <View style={styles.productionBanner}>
          <Text style={styles.productionBannerText}>🎯 PRODUCTION BANNER</Text>
          <Text style={styles.productionBannerSubtext}>AdMob ID: {adService.getBannerAdUnitId()}</Text>
        </View>
      </View>
    );
  }

  // Production AdMob banner with red border
  if (!BannerAd) {
    console.log('❌ BannerAd not available - showing production banner info');
    return (
      <View style={styles.container}>
        <View style={styles.productionBanner}>
          <Text style={styles.productionBannerText}>🎯 PRODUCTION BANNER</Text>
          <Text style={styles.productionBannerSubtext}>AdMob ID: {adService.getBannerAdUnitId()}</Text>
        </View>
      </View>
    );
  }

  console.log('✅ Showing real AdMob banner with production ID');
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adService.getBannerAdUnitId()}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('✅ Red bordered banner ad loaded with ID:', adService.getBannerAdUnitId());
          setAdLoaded(true);
          setAdError(null);
        }}
        onAdFailedToLoad={(error) => {
          console.log('❌ Red bordered banner ad failed to load:', error);
          console.log('🔍 Using AdMob ID:', adService.getBannerAdUnitId());
          setAdError(error.message || 'Ad failed to load');
          setAdLoaded(false);
        }}
      />
      {!adLoaded && !adError && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Reklam yükleniyor...</Text>
        </View>
      )}
      {adError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Reklam yüklenemedi</Text>
          <Text style={styles.errorSubtext}>ID: {adService.getBannerAdUnitId()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderWidth: 3,
    borderColor: '#EF4444',
    borderRadius: 8,
    marginVertical: 4,
  },
  productionBanner: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'solid',
  },
  productionBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productionBannerSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  loadingText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
