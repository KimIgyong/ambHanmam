import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, path.resolve(__dirname, '../../env/portal-frontend'), '');
    var webPort = Number(env.VITE_WEB_PORT) || 5190;
    var apiPort = Number(env.VITE_API_PORT) || 3020;
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: webPort,
            proxy: {
                '/api': {
                    target: "http://localhost:".concat(apiPort),
                    changeOrigin: true,
                },
            },
        },
        envDir: '../../env/portal-frontend',
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['lucide-react'],
                        i18n: ['i18next', 'react-i18next'],
                    },
                },
            },
        },
    };
});
