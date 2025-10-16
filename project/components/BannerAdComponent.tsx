import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { adService } from '@/lib/adService';

interface BannerAdComponentProps {
  size?: any;
  style?: any;
}

export default function BannerAdComponent({
  size,
  style
}: BannerAdComponentProps) {
  // Production AdMob banner
  if (Platform.OS === 'web') {
    return null;
  }

  let BannerAd: any = null;
  let BannerAdSize: any = null;

  try {
    const { BannerAd: BA, BannerAdSize: BAS } = require('react-native-google-mobile-ads');
    BannerAd = BA;
    BannerAdSize = BAS;
  } catch (error) {
    console.log('AdMob not available');
    return null;
  }

  if (!BannerAd) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adService.getBannerAdUnitId()}
        size={size || BannerAdSize.BANNER}
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
    marginVertical: 8,
  },
  testBanner: {
    height: 60,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#FF0000',
    borderStyle: 'solid',
  },
  testBannerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  testBannerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testBannerSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
});