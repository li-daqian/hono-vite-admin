import Antd from 'ant-design-vue'
import { createApp } from 'vue'
import App from './App.vue'
import { initTheme } from './theme/useTheme'
import './style.css'

const app = createApp(App)
app.use(Antd)

// initialize theme before mount
initTheme()

app.mount('#app')
