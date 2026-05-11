import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Vercel serve ที่ root domain — ไม่ต้องตั้ง base path
// (ถ้ากลับไป deploy GitHub Pages อีกครั้ง ให้เปลี่ยนเป็น base: '/sut-air-quality/')
export default defineConfig({
  plugins: [react()],
  base: '/',
});
