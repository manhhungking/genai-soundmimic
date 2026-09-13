/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        // Scan lazy route modules up front so opening a new view cannot invalidate
        // the active MUI/React dependency bundle midway through a browser session.
        entries: [
            'index.html',
            'src/**/*.{ts,tsx}',
            '!src/**/*.test.{ts,tsx}',
            '!src/test/**',
        ],
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
        ],
    },
    resolve: {
        // MUI and @genai-fi both consume React/Emotion. Always resolve their
        // hooks from the app's root copy to prevent an invalid hook dispatcher.
        dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
    },
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        server: {
            deps: {
                inline: ['@genai-fi/base'],
            },
        },
    },
});
