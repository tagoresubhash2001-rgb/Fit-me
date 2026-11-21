import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sindulis.fitmeai',
  appName: 'FitMe',
  webDir: 'dist',
  backgroundColor: '#F7F5EF',
  plugins: {
    FirebaseAuthentication: {
      // Native sign-in returns credentials; the Firebase JS SDK signs in with them (single session source).
      skipNativeAuth: true,
      providers: ['google.com', 'apple.com', 'phone'],
    },
  },
};

export default config;
