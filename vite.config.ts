import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx, defineManifest } from '@crxjs/vite-plugin';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';

const manifest = defineManifest({
    manifest_version: 3,
    name: 'Naildcard',
    version: '1.2.1',
    permissions: ['tabs', 'storage', 'unlimitedStorage', 'activeTab', 'scripting'],
    options_page: 'index.html',
    background: {
        service_worker: './src/background.ts',
    },
    icons: {
        '128': 'icon.png',
    },
    action: {
        default_icon: {
            '128': 'icon.png',
        },
    },
    content_scripts: [
        {
            run_at: 'document_end',
            matches: ['https://novelai.net/image'],
            js: ['./src/content/content.ts'],
        },
    ],
});

const pathSrc = path.resolve(__dirname, 'src');

export default defineConfig({
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

    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },
});
