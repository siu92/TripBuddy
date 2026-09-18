import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "TripBuddy",
        short_name: "TripBuddy",
        description: "여행의 모든 순간을 함께하는 AI 여행 플래너",
        theme_color: "#075e63",
        background_color: "#fcfcf9",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.cdn\.visitjeju\.net\/photomng\/imgpath\//,
            handler: "CacheFirst",
            options: {
              cacheName: "visit-jeju-attraction-images-v1",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        "team-development-guide": "team-development-guide.html",
        "logo-recommendations-preview": "logo-recommendations-preview.html",
        "tripbuddy-brand-theme-preview": "tripbuddy-brand-theme-preview.html",
      },
    },
  },
});
