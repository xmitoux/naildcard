import { getStorage } from '@/utils/chrome-api';
import { addDiceButton } from '@/content/addDiceButton';
import { setupContents } from '@/content/setupContents';

// ページ読み込み時に設定を取得する
getStorage((settings) => {
    setupContents();
    addDiceButton(settings);
});
