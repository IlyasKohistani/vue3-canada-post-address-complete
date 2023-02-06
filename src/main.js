import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import 'vue-select/dist/vue-select.css';
import vSelect from 'vue-select'
import { BootstrapIconsPlugin } from 'bootstrap-icons-vue';


import 'bootstrap/dist/css/bootstrap.css'

const app = createApp(App).use(i18n)
app.component('v-select', vSelect)
app.use(i18n)
app.use(BootstrapIconsPlugin)
app.mount('#app')
