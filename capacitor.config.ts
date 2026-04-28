import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pacepro.app',
  appName: 'PacePro',
  webDir: 'out',
  server: {
    url: 'https://pacepro-virid.vercel.app',
    cleartext: true
  },
  ios: {
    scheme: 'pacepro'
  }
};

export default config;