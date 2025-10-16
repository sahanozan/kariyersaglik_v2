import { Platform } from 'react-native';

// Web için basit AdService
const isWeb = Platform.OS === 'web';

interface AdEventError {
  code: string;
  message: string;
  cause?: any;
}

interface AdReward {
  amount: number;
  type: string;
}

class AdServiceWeb {
  private isInitialized = false;

  constructor() {
    if (isWeb) {
      console.log('🌐 Web AdService: Using web version');
      this.initializeWeb();
    }
  }

  // Web için basit başlatma
  async initializeWeb() {
    if (this.isInitialized) return;
    
    console.log('🌐 Web AdService: Initializing for web...');
    this.isInitialized = true;
    console.log('✅ Web AdService: Web version initialized');
  }

  // Mock rewarded ad for jobs viewing
  async showRewardedAdJobs(): Promise<boolean> {
    console.log('🌐 Web AdService: showRewardedAdJobs called (web mock)');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🌐 Web: Simulated jobs ad completed successfully');
        resolve(true);
      }, 2000);
    });
  }

  // Mock rewarded ad for job creation
  async showRewardedAdCreateJob(): Promise<boolean> {
    console.log('🌐 Web AdService: showRewardedAdCreateJob called (web mock)');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🌐 Web: Simulated create job ad completed successfully');
        resolve(true);
      }, 2000);
    });
  }

  // Check if jobs ad is ready
  isAdReadyJobs(): boolean {
    return true; // Always ready for web
  }

  // Check if create job ad is ready
  isAdReadyCreateJob(): boolean {
    return true; // Always ready for web
  }

  // Legacy compatibility
  isAdReady(): boolean {
    return this.isAdReadyJobs();
  }

  isAdReadyCreate(): boolean {
    return this.isAdReadyCreateJob();
  }

  // Preload methods (no-op for web)
  preloadAdJobs() {
    console.log('🌐 Web: Preload jobs ad (no-op)');
  }

  preloadAdCreateJob() {
    console.log('🌐 Web: Preload create job ad (no-op)');
  }
}

// Export singleton instance
export const adService = new AdServiceWeb();
export default adService;
