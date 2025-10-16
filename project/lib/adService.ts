import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're on web or if AdMob is available
const isWeb = Platform.OS === 'web';
const isAdMobAvailable = !isWeb && typeof require !== 'undefined';

// Production AdMob Unit IDs - Tek reklam birimi kullanıyoruz
const REWARDED_AD_UNIT_ID_JOBS = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_JOBS || Constants.expoConfig?.extra?.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID_JOBS || 'ca-app-pub-5038479081154492/8059489507'; // İş İlanları için tek reklam birimi
const BANNER_AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID || Constants.expoConfig?.extra?.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID || 'ca-app-pub-5038479081154492/3002711749'; // Banner reklam

// Test AdMob Unit IDs (fallback)
const TEST_REWARDED_AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

let mobileAds: any = null;
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;

// AdMob import'u sadece native platformlarda
if (!isWeb && isAdMobAvailable) {
  try {
    const admobModule = require('react-native-google-mobile-ads');
    mobileAds = admobModule.default;
    RewardedAd = admobModule.RewardedAd;
    RewardedAdEventType = admobModule.RewardedAdEventType;
    TestIds = admobModule.TestIds;
    BannerAd = admobModule.BannerAd;
    BannerAdSize = admobModule.BannerAdSize;
  } catch (error) {
    console.log('❌ AdMob not available:', error);
  }
}

// Web için mock AdMob objesi
if (isWeb) {
  mobileAds = {
    initialize: () => Promise.resolve({}),
  };
  RewardedAd = {
    createForAdRequest: () => ({
      addAdEventListener: () => {},
      load: () => {},
      show: () => {},
    }),
  };
  RewardedAdEventType = {
    LOADED: 'loaded',
    ERROR: 'error',
    DISMISSED: 'dismissed',
    EARNED_REWARD: 'earned_reward',
  };
  BannerAd = () => null;
  BannerAdSize = {
    BANNER: 'banner',
  };
}

interface AdEventError {
  code: string;
  message: string;
  cause?: any;
}

interface AdReward {
  amount: number;
  type: string;
}

class AdService {
  private rewardedAdJobs: any = null;
  private isAdLoadedJobs = false;
  private isAdLoadingJobs = false;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    if (isWeb) {
      console.log('🌐 Web AdService: Using web version');
      this.initializeWeb();
    } else if (isAdMobAvailable) {
      this.initializeAdMob();
    } else {
      console.log('AdMob not available, using mock ads');
    }
  }

  // Web için basit başlatma
  async initializeWeb() {
    if (this.isInitialized) return;
    
    console.log('🌐 Web AdService: Initializing for web...');
    this.isInitialized = true;
    console.log('✅ Web AdService: Web version initialized');
  }

  // Initialize AdMob
  async initializeAdMob() {
    if (this.isInitialized) return;
    
    try {
      console.log('🎬 AdService: Initializing AdMob...');
      if (mobileAds && typeof mobileAds.initialize === 'function') {
        await mobileAds.initialize();
        this.isInitialized = true;
        console.log('✅ AdService: AdMob initialized successfully');
        
        // Reklamları hemen yükle
        setTimeout(() => {
          console.log('🎬 AdService: Loading ads...');
          this.loadRewardedAdJobs();
        }, 1000);
      } else {
        console.log('❌ AdService: mobileAds.initialize is not available');
      }
    } catch (error) {
      console.error('❌ AdService: Failed to initialize AdMob:', error);
    }
  }

  // Load rewarded ad for jobs viewing
  private loadRewardedAdJobs() {
    if (!isAdMobAvailable || !RewardedAd || this.isAdLoadingJobs || this.isAdLoadedJobs || !this.isInitialized) return;

    console.log('🎬 AdService: Loading rewarded ad for jobs...');
    this.isAdLoadingJobs = true;
    
    // Önce production reklamı dene, başarısız olursa test reklamı kullan
    this.rewardedAdJobs = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID_JOBS, {
      requestNonPersonalizedAdsOnly: false,
    });

    this.rewardedAdJobs.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ AdService: Jobs rewarded ad loaded successfully');
      this.isAdLoadedJobs = true;
      this.isAdLoadingJobs = false;
    });

    this.rewardedAdJobs.addAdEventListener(RewardedAdEventType.ERROR, (error: AdEventError) => {
      console.error('❌ AdService: Jobs rewarded ad failed to load:', error);
      this.isAdLoadedJobs = false;
      this.isAdLoadingJobs = false;
    });

    this.rewardedAdJobs.addAdEventListener(RewardedAdEventType.DISMISSED, () => {
      console.log('Jobs rewarded ad dismissed');
      this.isAdLoadedJobs = false;
      this.loadRewardedAdJobs(); // Load next ad
    });

    this.rewardedAdJobs.load();
  }


  // Show rewarded ad for jobs viewing
  async showRewardedAdJobs(): Promise<boolean> {
    console.log('🎬 AdService: showRewardedAdJobs called');
    return new Promise((resolve) => {
      if (isWeb) {
        console.log('🌐 Web: Simulating jobs ad success');
        setTimeout(() => {
          console.log('🌐 Web: Simulated jobs ad completed successfully');
          resolve(true);
        }, 2000);
        return;
      }

      if (!isAdMobAvailable) {
        console.log('🎬 AdMob not available, simulating ad success');
        setTimeout(() => {
          console.log('🎬 Simulated jobs ad completed successfully');
          resolve(true);
        }, 2000);
        return;
      }

      if (!this.isAdLoadedJobs || !this.rewardedAdJobs) {
        console.log('Jobs rewarded ad not loaded, trying to load...');
        this.loadRewardedAdJobs();
        // 2 saniye bekle ve tekrar dene
        setTimeout(() => {
          if (this.isAdLoadedJobs && this.rewardedAdJobs) {
            console.log('Jobs rewarded ad loaded after retry, showing...');
            this.rewardedAdJobs.show();
          } else {
            console.log('Jobs rewarded ad still not loaded after retry');
            resolve(false);
          }
        }, 2000);
        return;
      }

      let adRewarded = false;

      this.rewardedAdJobs!.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: AdReward) => {
        console.log('User earned reward for jobs:', reward);
        adRewarded = true;
      });

      this.rewardedAdJobs!.addAdEventListener(RewardedAdEventType.DISMISSED, () => {
        console.log('Jobs rewarded ad dismissed');
        this.isAdLoadedJobs = false;
        this.loadRewardedAdJobs(); // Load next ad
        resolve(adRewarded);
      });

      this.rewardedAdJobs!.addAdEventListener(RewardedAdEventType.ERROR, (error: AdEventError) => {
        console.log('Jobs rewarded ad failed to show:', error);
        this.isAdLoadedJobs = false;
        this.loadRewardedAdJobs(); // Load next ad
        resolve(false);
      });

      this.rewardedAdJobs!.show();
    });
  }

  // Show rewarded ad for job creation (aynı reklam birimini kullanır)
  async showRewardedAdCreateJob(): Promise<boolean> {
    console.log('🎬 AdService: showRewardedAdCreateJob called (using same ad unit as jobs)');
    return this.showRewardedAdJobs();
  }

  // Check if jobs ad is ready
  isAdReadyJobs(): boolean {
    return this.isAdLoadedJobs;
  }

  // Check if create job ad is ready (aynı reklam birimini kullanır)
  isAdReadyCreateJob(): boolean {
    return this.isAdLoadedJobs;
  }

  // Get banner ad unit ID
  getBannerAdUnitId(): string {
    return BANNER_AD_UNIT_ID;
  }

  // Get rewarded ad unit ID for jobs (tek reklam birimi kullanıyoruz)
  getRewardedAdUnitId(type: 'jobs' | 'createJob'): string {
    return REWARDED_AD_UNIT_ID_JOBS;
  }

  // Legacy compatibility - old function names
  isAdReady(): boolean {
    return this.isAdReadyJobs();
  }

  isAdReadyCreate(): boolean {
    return this.isAdReadyCreateJob();
  }

  // Preload jobs ad
  preloadAdJobs() {
    if (isWeb) {
      console.log('🌐 Web: Preload jobs ad (no-op)');
      return;
    }
    if (!this.isAdLoadedJobs && !this.isAdLoadingJobs) {
      this.loadRewardedAdJobs();
    }
  }

  // Preload create job ad (aynı reklam birimini kullanır)
  preloadAdCreateJob() {
    if (isWeb) {
      console.log('🌐 Web: Preload create job ad (no-op)');
      return;
    }
    if (!this.isAdLoadedJobs && !this.isAdLoadingJobs) {
      this.loadRewardedAdJobs();
    }
  }
}

// Export singleton instance
export const adService = new AdService();
export default adService;