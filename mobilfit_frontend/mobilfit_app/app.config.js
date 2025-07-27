import 'dotenv/config';

export default {
  expo: {
    name: 'Mobilfit',
    slug: 'mobilfit',
    scheme: 'mobilfit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          '정확한 경로 추천을 위해 사용자의 위치 정보가 필요합니다.',
      },
    },
    android: {
      versionCode: 1,
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    extra: {
      orsApiKey: process.env.ORS_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY,
    },
  },
};
