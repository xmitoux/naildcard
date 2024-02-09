## 1.4.0 (2024/02/09)

### ✨追加

-   Dynamic Prompt
    -   フォーマット機能
    -   エクスポート・インポート機能
-   Wildcard Manager
    -   名前のフィルタ機能
    -   エクスポート・インポート機能
-   Danbooru Tag Helper
    -   Generalタグのみを検索する設定
    -   検索欄にフォーカスするショートカットキー
    -   Enterキーによるタグ挿入
-   NAI PNG Info
-   ダークモード

### 💥破壊的な変更

-   Wildcard Simple Editor の削除
    -   元々プロトタイプ的に開発していた機能の名残りであり、作りが雑で不具合が多かったことが理由です。
    -   🚨これに伴い、以前のバージョンのWildcardデータが移行できなくなります。  
        https://github.com/xmitoux/naildcard-json-converter にあるツールからデータのコンバートを実施し、Wildcard Managerからインポートを行ってください。
-   Danbooru Tag Helper に使用するタグデータの組み込みを廃止
    -   [手順](/README.md#タグデータの準備)にしたがってデータを用意してください。

### 🔄変更

-   全体的な画面レイアウトの調整
-   `<>`を含むタグをエスケープできるよう変更

### 🐛修正

-   Wildcard Manager
    -   `:`を含む文字列を候補に入力したときに不自然な挙動をする不具合
    -   リネーム時、リネーム前のワイルドカードが空で残る不具合

## 1.3.0 (2024/01/07)

### ✨追加

-   Dynamic Prompt構文 [Variantsの複数選択](https://github.com/xmitoux/naildcard#複数選択) 、[ワイルドカードの複数選択](https://github.com/xmitoux/naildcard#%E8%A4%87%E6%95%B0%E9%81%B8%E6%8A%9E-1)を追加
-   [ショートカットキー](https://github.com/xmitoux/naildcard?tab=readme-ov-file#%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%AB%E3%83%83%E3%83%88%E3%82%AD%E3%83%BC) の種類追加
-   Wildcardのコピーボタンを追加

### 🔄変更

-   Wildcard Managerの動作の軽微な変更

## 1.2.1 (2024/01/05)

### 修正

-   インペイント画面を開くとサイコロボタンが消える不具合の修正
-   ショートカットキーによる括弧の挿入が文頭で正常に動作しない不具合の修正

## 1.2.0 (2024/01/04)

### 追加

-   [Danbooru Tag Helper](https://github.com/xmitoux/naildcard#danbooru-tag-helper)を実装

### 変更

-   全体的なデザインの改善
-   不具合修正に伴い、Wildcard内の改行を候補として扱うよう変更

### 修正

-   Wildcardが一定の長さを超えるとデータが失われる不具合の修正
-   Wildcard内に改行文字が含まれるときデータが自動で変更される不具合を修正

# 1.1.0 (2023/12/30)

### 追加

#### [その他の機能](https://github.com/xmitoux/naildcard#その他の機能)

-   部分コメント
-   ショートカットキー
-   `()`のエスケープ
