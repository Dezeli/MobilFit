import 'dotenv/config';

export default {
  expo: {
    name: 'Mobilfit',
    slug: 'mobilfit',
    scheme: 'mobilfit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png', // 아이콘 이미지 경로
    splash: {
      image: './assets/images/splash.png', // 스플래시 이미지 경로 (없으면 기본값 사용)
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          '정확한 경로 추천을 위해 사용자의 위치 정보가 필요합니다.',
      },
    },
    android: {
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    extra: {
      orsApiKey: process.env.ORS_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY,
    },
  },
};
