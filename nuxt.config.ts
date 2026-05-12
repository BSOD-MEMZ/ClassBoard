// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/icon"],
  css: ["@/assets/css/main.css"],
  icon: {
    clientBundle: {
      scan: true,
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
});
