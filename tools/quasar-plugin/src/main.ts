import { createApp } from 'vue';
import { Quasar, Dark, Notify, Dialog } from 'quasar';
import 'quasar/src/css/index.sass';
import '@quasar/extras/material-icons/material-icons.css';
import App from './App.vue';
import router from './router';
import './styles/app.scss';

const app = createApp(App);

app.use(Quasar, {
  plugins: {
    Dark,
    Notify,
    Dialog,
  },
});

app.use(router);
app.mount('#app');
