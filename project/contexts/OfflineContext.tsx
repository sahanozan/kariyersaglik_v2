import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import NetInfo from '@react-native-community/netinfo';

interface Algorithm {
  id: string;
  title: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  content: Record<string, unknown>;
  last_updated: string;
}

interface Drug {
  id: string;
  name: string;
  active_ingredient: string;
  category: string;
  company: string;
  content: Record<string, unknown>;
}

interface OfflineContextType {
  isOnline: boolean;
  algorithms: Algorithm[];
  drugs: Drug[];
  syncData: () => Promise<void>;
  lastSyncTime: string | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Load cached data on startup
    loadCachedData();

    // Sync data if online
    syncData();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadCachedData = async () => {
    try {
      const [cachedAlgorithms, cachedDrugs, cachedSyncTime] = await Promise.all([
        AsyncStorage.getItem('offline_algorithms'),
        AsyncStorage.getItem('offline_drugs'),
        AsyncStorage.getItem('last_sync_time')
      ]);

      if (cachedAlgorithms) {
        setAlgorithms(JSON.parse(cachedAlgorithms));
      }

      if (cachedDrugs) {
        setDrugs(JSON.parse(cachedDrugs));
      }

      if (cachedSyncTime) {
        setLastSyncTime(cachedSyncTime);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const syncData = async () => {
    if (!isOnline) return;

    try {
      console.log('🔄 Syncing offline data...');

      // Fetch algorithms
      const { data: algorithmsData, error: algorithmsError } = await supabase
        .from('algorithms')
        .select('*')
        .order('urgency', { ascending: false });

      if (!algorithmsError && algorithmsData) {
        setAlgorithms(algorithmsData as Algorithm[]);
        await AsyncStorage.setItem('offline_algorithms', JSON.stringify(algorithmsData));
        console.log('✅ Algorithms synced:', algorithmsData.length);
      }

      // Fetch drugs
      const { data: drugsData, error: drugsError } = await supabase
        .from('drugs')
        .select('*')
        .order('name');

      if (!drugsError && drugsData) {
        setDrugs(drugsData as Drug[]);
        await AsyncStorage.setItem('offline_drugs', JSON.stringify(drugsData));
        console.log('✅ Drugs synced:', drugsData.length);
      }

      // Update sync time
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);
      await AsyncStorage.setItem('last_sync_time', syncTime);

      console.log('✅ Offline sync completed');
    } catch (error) {
      console.error('❌ Error syncing offline data:', error);
    }
  };

  const value = {
    isOnline,
    algorithms,
    drugs,
    syncData,
    lastSyncTime,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}