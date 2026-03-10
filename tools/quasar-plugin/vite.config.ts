import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: fileURLToPath(new URL('./src/styles/quasar-variables.scss', import.meta.url)) }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
