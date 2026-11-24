// Builds the offline Scout Kit that is bundled inside the iOS app binary
// (Capacitor webDir: native-app/dist). It never loads a remote URL to start,
// so it opens in airplane mode (App Review Guidelines 4.2 and 2.1).
import path from 'node:path'
import { defineConfig } from 'vite'

const root = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig({
  root,
  base: './',
  resolve: { alias: { '@': path.resolve(root, '..') } },
  build: {
    outDir: path.resolve(root, 'dist'),
    emptyOutDir: true,
    target: 'safari15',
    assetsInlineLimit: 0,
  },
  publicDir: path.resolve(root, 'public'),
})
