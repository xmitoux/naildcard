import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
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

        plugins: [
            vue(),
            crx({ manifest }),
            // ライブラリの自動インポート設定
            AutoImport({
                imports: ['vue'],
                resolvers: [
                    ElementPlusResolver(),
                    IconsResolver({
                        prefix: 'Icon',
                    }),
                ],

                dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
                dirs: ['./src/**'], // とりあえず全ソース
                vueTemplate: true,
                eslintrc: {
                    enabled: true,
                    filepath: './.eslintrc-auto-import.json',
                    globalsPropValue: true,
                },
            }),
            // Vueコンポーネントの自動インポート設定
            Components({
                resolvers: [
                    IconsResolver({
                        enabledCollections: ['ep'],
                    }),
                    ElementPlusResolver(),
                ],

                dts: path.resolve(pathSrc, 'components.d.ts'),
            }),

            Icons({
                autoInstall: true,
            }),
        ],

        build: {
            // 開発時はminifyしない
            minify: isProd,
        },

        server: {
            port: 5173,
            strictPort: true,
            hmr: {
                port: 5173,
            },
        },
    });
};
