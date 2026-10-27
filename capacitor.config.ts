import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "us.citizenshipai.app",
  appName: "Immigra.site",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#020815",
  },
};

export default config;
