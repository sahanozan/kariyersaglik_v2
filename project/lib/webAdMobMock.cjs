// Web için AdMob mock'u
const mockAdMob = {
  initialize: () => Promise.resolve({}),
};

const mockRewardedAd = {
  createForAdRequest: () => ({
    addAdEventListener: () => {},
    load: () => {},
    show: () => {},
  }),
};

const mockRewardedAdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  DISMISSED: 'dismissed',
  EARNED_REWARD: 'earned_reward',
};

const mockBannerAd = () => null;

const mockBannerAdSize = {
  BANNER: 'banner',
};

const mockTestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

module.exports = {
  default: mockAdMob,
  RewardedAd: mockRewardedAd,
  RewardedAdEventType: mockRewardedAdEventType,
  BannerAd: mockBannerAd,
  BannerAdSize: mockBannerAdSize,
  TestIds: mockTestIds,
};
