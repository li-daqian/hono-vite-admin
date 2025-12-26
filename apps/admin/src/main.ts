import { client } from '@admin/client/client.gen'
import { createApp } from 'vue'
import App from './App.vue'
import { getEnv } from './lib/env'
import './style.css'

const apiBaseURL = getEnv().apiBaseUrl
client.setConfig({ baseURL: apiBaseURL })

createApp(App).mount('#app')
