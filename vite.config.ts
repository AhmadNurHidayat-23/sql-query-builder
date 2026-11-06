import { defineConfig } from 'vitest/config';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [laravel({ input: ['resources/js/main.tsx'], refresh: true }), react()], test: { include: ['resources/js/**/*.test.{ts,mjs}'] } });
