import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 🚨🚨🚨 ffmpeg() 플러그인과 import ffmpeg from '...' 줄을 모두 제거합니다.
  ],
  server: {
    port: 8081,
    // 이 헤더는 Cross-Origin 문제 해결에 도움이 되므로 유지합니다.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'] 
  },

});