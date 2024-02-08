import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import ElementPlus from 'unplugin-element-plus/vite';
import path from 'path';
import { manifest } from './manifest.config';

const pathSrc = path.resolve(__dirname, 'src');

export default ({ mode }) => {
    const isProd = mode === 'production';

    return defineConfig({
        resolve: {
            alias: {
                '@': pathSrc,
            },
        },

        plugins: [vue(), crx({ manifest }), ElementPlus({})],

        build: {
            // 開発時はminifyしない
            minify: isProd,
            chunkSizeWarningLimit: 1000,
        },

        publicDir: false,

        server: {
            port: 5173,
            strictPort: true,
            hmr: {
                port: 5173,
            },
        },
    });
};
