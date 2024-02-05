import { ref } from 'vue';
import { UploadUserFile } from 'element-plus';
import { getStorage, saveStorage } from '@/utils/chrome-api';

export const useFileImportExport = () => {
    const exportSetting = (textData: string, fileName: string, extension: string = 'txt') => {
        // テキストデータをBlobとしてダウンロード用に準備
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${extension}`;
        a.click();

        // URLをクリーンアップ
        URL.revokeObjectURL(url);
    };

    const importSettings = (
        file: File,
        loadSetting: (settingText: string, settings: Settings) => Settings,
    ) => {
        return new Promise<Settings>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const settingText = event.target?.result as string;
                getStorage((settings) => {
                    const loadedSettings = loadSetting(settingText, { ...settings });
                    saveStorage(loadedSettings);

                    resolve(loadedSettings);
                });
            };

            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };

    const fileList = ref<UploadUserFile[]>([]);

    return {
        exportSetting,
        fileList,
        importSettings,
    };
};
