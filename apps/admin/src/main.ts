import App from '@admin/App.vue'
import { setupAxios } from '@admin/lib/axios'
import router from '@admin/router'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import './style.css'

setupAxios()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
