import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Đọc PORT từ server/.env để proxy trùng cổng Nest (mặc định 3173 trong main.ts).
  // Nếu cố định 3173 trong khi Nest chạy PORT khác (vd. 3000) → ECONNREFUSED.
  const serverEnv = loadEnv(mode, resolve(__dirname, '../server'), '');
  const apiPort = serverEnv.PORT || '3173';

  return {
    plugins: [react()],
    server: {
      // Cho phép truy cập từ điện thoại / máy khác cùng WiFi (mặc định chỉ localhost)
      host: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
