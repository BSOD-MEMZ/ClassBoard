// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: 'assets/xxtsoft.png' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Icons&family=Material+Icons+Outlined&family=Material+Icons+Round' }
      ]
    }
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag.startsWith('mdui-')
    }
  }
})
