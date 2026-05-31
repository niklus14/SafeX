import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: { port: 3001, host: '0.0.0.0' },
});
