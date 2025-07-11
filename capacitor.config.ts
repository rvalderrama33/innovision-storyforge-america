import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c87a1b82b6a64aa2ad6aba5512d06ce3',
  appName: 'innovision-storyforge-america',
  webDir: 'dist',
  server: {
    url: 'https://c87a1b82-b6a6-4aa2-ad6a-ba5512d06ce3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;