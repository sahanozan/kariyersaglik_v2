import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import AdvertisementBanner from './AdvertisementBanner';

interface TabLayoutWrapperProps {
  children: ReactNode;
}

export default function TabLayoutWrapper({ children }: TabLayoutWrapperProps) {
  return (
    <View style={styles.container}>
      {children}
      <View style={styles.bannerContainer}>
        <AdvertisementBanner 
          onPress={() => {
            // Reklam tıklama işlemi
            console.log('Reklam banner\'ına tıklandı');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 75, // Tab bar yüksekliği
    left: 0,
    right: 0,
    zIndex: 5, // Admin paneli ile çakışmayacak şekilde ayarlandı
    elevation: 5, // Android için
    paddingHorizontal: 16,
  },
});
