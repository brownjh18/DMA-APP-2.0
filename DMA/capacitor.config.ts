import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.dove.ministries.africa',
  appName: 'Dove Church',
  webDir: 'dist',
  server: {
    // Live reload server URL for development
    url: 'http://192.168.1.4:8101',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
