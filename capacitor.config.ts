import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.migralert.app",
  appName: "MigrAlert",
  webDir: "out",

  // For development, comment out the server block and use local files
  // For production, use your live Vercel URL
  server: {
    // Replace with your production URL when deploying
    url: process.env.CAPACITOR_SERVER_URL || "http://localhost:3000",
    cleartext: true, // Allow HTTP for development
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0D0D0F",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0D0D0F",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },

  android: {
    backgroundColor: "#0D0D0F",
    allowMixedContent: true,
  },

  ios: {
    backgroundColor: "#0D0D0F",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "MigrAlert",
  },
};

export default config;
