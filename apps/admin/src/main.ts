import App from '@admin/App.vue'
import { client } from '@admin/client/client.gen'
import { getEnv } from '@admin/lib/env'
import router from '@admin/router'
import { createApp } from 'vue'
import './style.css'

const apiBaseURL = getEnv().apiBaseUrl
client.setConfig({ baseURL: apiBaseURL })

const app = createApp(App)

app.use(router)

app.mount('#app')
