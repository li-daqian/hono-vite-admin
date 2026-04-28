import App from '@admin/App.vue'
import { setupAxios } from '@admin/lib/axios'
import router from '@admin/router'
import { loadDynamicRoutes } from '@admin/router/dynamic-routes'
import { useAppConfigStore } from '@admin/stores/app-config'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import './style.css'

async function bootstrap() {
  setupAxios()

  const app = createApp(App)

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)

  await useAppConfigStore().fetchConfig()

  loadDynamicRoutes(router)
  app.use(router)

  app.mount('#app')
}

void bootstrap()
