import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

const extensionName = 'Naildcard';

export const manifest = defineManifest((env) => ({
    manifest_version: 3,
    name: env.mode === 'production' ? extensionName : `[DEV] ${extensionName}`,
    description: 'Dynamic Prompts for NAI',
    version: pkg.version,
    icons: {
        '128': 'icon.png',
    },
    permissions: ['activeTab', 'storage', 'unlimitedStorage'],
    options_page: 'index.html',
    background: {
        service_worker: './src/background.ts',
    },
    action: {
        default_icon: {
            '128': 'icon.png',
        },
    },
    content_scripts: [
        {
            matches: ['https://novelai.net/image'],
            js: ['./src/content/content.ts'],
        },
    ],
}));
