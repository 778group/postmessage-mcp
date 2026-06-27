import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'calculator-client': resolve(__dirname, 'calculator-client.html'),
        'palette-server': resolve(__dirname, 'palette-server.html'),
        'crm-server': resolve(__dirname, 'crm-server.html'),
      },
    },
  },
})
