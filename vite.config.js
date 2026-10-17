import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  // mkcert vytvori lokalne duveryhodny certifikat - bez https prohlizec
  // odmitne navigator.geolocation jako "nezabezpeceny kontext".
  plugins: [react(), mkcert()],
  base: './',
  server: { port: 5173, https: true },
  build: { outDir: 'dist', target: 'es2020' }
})
