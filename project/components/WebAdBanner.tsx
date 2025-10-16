import React, { useEffect } from 'react';
import { Platform } from 'react-native';

interface WebAdBannerProps {
  adSlot: string;
  style?: any;
  className?: string;
}

const WebAdBanner: React.FC<WebAdBannerProps> = ({ adSlot, style, className }) => {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Google AdSense script yükle
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);

      // AdSense reklamını başlat
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (error) {
        console.log('AdSense not available:', error);
      }
    }
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <ins
      className={`adsbygoogle ${className || ''}`}
      style={{
        display: 'block',
        width: '100%',
        height: '250px',
        ...style
      }}
      data-ad-client="ca-pub-5038479081154492"
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default WebAdBanner;
