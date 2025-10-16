import React from 'react';
import { View, StyleSheet } from 'react-native';
import BannerAdComponent from './BannerAdComponent';

interface AdvertisementBannerProps {
  onClose?: () => void;
  onPress?: () => void;
}

export default function AdvertisementBanner({ onClose, onPress }: AdvertisementBannerProps) {
  return (
    <View style={styles.container}>
      {/* AdMob Banner Ad with red border */}
      <BannerAdComponent style={styles.admobBanner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  admobBanner: {
    width: '100%',
  },
});
