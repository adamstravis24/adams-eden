const IS_DEV = process.env.APP_VARIANT === 'development' || process.env.EAS_BUILD_PROFILE === 'development';

const EXPO_PUBLIC_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
  'NEXT_PUBLIC_SHOPIFY_STOREFRONT_ID',
  'NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN',
];

const PRIVATE_KEYS = [
  'PLANT_ID_API_KEY',
  'NOAA_TOKEN',
];

const expoPublic = EXPO_PUBLIC_KEYS.reduce((acc, key) => {
  if (process.env[key]) {
    acc[key] = process.env[key];
  }
  return acc;
}, {});

const secure = PRIVATE_KEYS.reduce((acc, key) => {
  if (process.env[key]) {
    acc[key] = process.env[key];
  }
  return acc;
}, {});

module.exports = {
  expo: {
    name: "adams-eden-app",
    slug: "adams-eden-app",
    owner: "adamst2020",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "adamseden",
    updates: {
      enabled: false,
      fallbackToCacheTimeout: 0
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.adamseden.gardenapp",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.adamseden.gardenapp",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.VIBRATE",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
        "android.permission.SYSTEM_ALERT_WINDOW"
      ]
    },
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#059669"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            kotlinVersion: "2.0.21",
            // Temporarily disable minification to test if that's causing the crash
            // Once confirmed working, re-enable for smaller app size
            enableProguardInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false
          }
        }
      ],
      // Only include expo-dev-client plugin in development builds
      ...(IS_DEV ? [
        [
          "expo-dev-client",
          {
            silentLaunch: false
          }
        ]
      ] : [])
    ],
    extra: {
      eas: {
        projectId: "453fdd2d-4bc9-4477-add5-1168831a37d1"
      },
      expoPublic,
      secure
    }
  }
};

