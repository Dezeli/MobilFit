export default {
  expo: {
    name: 'Mobilfit',
    slug: 'mobilfit',
    scheme: 'mobilfit',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: false,
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          '정확한 경로 추천을 위해 사용자의 위치 정보가 필요합니다.',
      },
    },
    android: {
      versionCode: 1,
      package: 'kr.mobilfit.app',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      config: {
        usesCleartextTraffic: false,
      },
      allowBackup: true,
      intentFilters: [
        {
          action: 'VIEW',
          data: {
            scheme: 'https',
            host: 'mobilfit.kr',
            pathPrefix: '/',
          },
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    assetBundlePatterns: ['**/*'],

    extra: {
      eas: {
        projectId: 'a321c62c-10cd-4c46-b758-d85c143e3944',
      },
    },
  },
};
