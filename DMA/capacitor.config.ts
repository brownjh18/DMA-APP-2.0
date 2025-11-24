import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.dove.ministries.africa',
  appName: 'DMA',
  webDir: 'dist',
  server: {
    url: 'http://192.168.100.43:5000',
    cleartext: true
  }
};

export default config;
