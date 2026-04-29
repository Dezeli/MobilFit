export default {
  expo: {
    name: 'Mobilfit',
    slug: 'mobilfit',
    scheme: 'mobilfit',
    version: '1.0.1',
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
      buildNumber: '4',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          '정확한 경로 추천을 위해 사용자의 위치 정보가 필요합니다.',
      },
    },
    android: {
      versionCode: 4,
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

    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            cmakeVersion: "3.22.1",
            ndkVersion: "23.1.7779620",
            buildToolsVersion: "34.0.0",
          },
        },
      ],
    ],
  },
};
