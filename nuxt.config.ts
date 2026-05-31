// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/icon"],
  css: ["@/assets/css/main.css"],
  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 256,
    },
  },
  app: {
    head: {
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }],
      link: [{ rel: "icon", type: "image/png", href: "assets/xxtsoft.png" }],
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith("m3e-"),
    },
  },
  // Build & runtime optimizations for low-end devices
  nitro: {
    compressPublicAssets: { brotli: true, gzip: true },
    minify: true,
  },
  vite: {
    build: {
      target: "es2020",
      cssMinify: "lightningcss",
      minify: "esbuild",
      // Inline small assets to reduce HTTP requests
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules/@m3e")) return "m3e";
            if (id.includes("node_modules/js-yaml")) return "yaml";
            if (id.includes("node_modules/vue") || id.includes("node_modules/@vue")) return "vue";
            if (id.includes("node_modules")) return "vendor";
          },
        },
      },
    },
  },
});
