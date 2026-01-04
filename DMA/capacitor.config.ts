import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.dove.ministries.africa',
  appName: 'DMA',
  webDir: 'dist',
  server: {
    // Enable Android live reload for emulator development
    url: 'http://10.0.2.2:5173', // Android emulator localhost
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
