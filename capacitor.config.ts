import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "us.citizenshipai.app",
  appName: "Immigra",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#020815",
  },
  plugins: { NativePurchases: { autoFinishTransactions: false } },
};

export default config;
