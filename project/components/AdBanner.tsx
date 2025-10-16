import React from 'react';
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

export default function AdBanner() {
  // Web'de reklam gösterme
  if (Platform.OS === 'web') {
    return null;
  }

  // Production AdMob banner
  if (!BannerAd) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adService.getBannerAdUnitId()}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
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
  },
  testBanner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    borderWidth: 2,
    borderColor: '#FFD93D',
    borderStyle: 'dashed',
  },
  testBannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testBannerSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});