# 🎲Naildcard

NAI用Chrome拡張機能です。dynamic promptsっぽいことができます。

## 📲インストール

0. NAIは閉じておいてください。
1. Releasesから"Naildcard.zip"をダウンロードし、解凍します。
2. Google ChromeのURL欄に"chrome://extensions/"と入力し、拡張機能の管理画面に移動します。
3. 右上隅で「デベロッパーモード」をONにします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、手順1.で解凍された"dist"フォルダを選択すると拡張機能が追加されます。
5. Chromeのメニューバーの拡張機能ボタン🧩を押し、"Naildcard"を選択します。
6. 設定ページが開くので、"Enabled"をONにし、"Prompt Template"に適当な文字列を入力します。
7. NAIを開くと、生成ボタンの横に🎲ボタンが表示されます。
8. ボタンを押して、"Prompt Template"に入力した文字列がプロンプト欄に入力されればインストールは完了です。

-   ※手順7, 8がうまく行かない場合はNAIを再読み込みしてください。

## 📖使い方

1. 設定ページでプロンプトを設定します。ランダムプロンプトを作るための構文(後述)が使用できます。
2. NAIのページで🎲ボタンを押すと、設定に従ったランダムなプロンプトが生成されプロンプト欄に入力されます。
3. 生成ボタンを押すとそのプロンプトでイラスト生成が実行されます。

## ⚙️設定

各設定値はChromeの拡張機能用ストレージに格納され、Chromeを閉じても保存されます。

-   Enabled
    -   🎲ボタンの表示/非表示を切り替えます。
    -   設定の反映にはNAIの再読み込みが必要です。
-   Prompt Template
    -   ランダムプロンプトの入力欄です。
    -   先頭に"#"をつけた行はコメント行になり、NAIのプロンプト欄には入力されません。
-   Wildcard Editor

    -   ワイルドカード(後述)の編集用UIです。
    -   Wildcard Manager, Simple Editor の2通りのUIで編集が可能です。
    -   Wildcard Manager
        -   左ペインではワイルドカードの新規登録・選択・リネーム・削除を行います。
        -   右ペインでは左ペインで選択したワイルドカードの候補の編集を行います。
    -   Simple Editor

        -   ワイルドカードのテキストデータを直接編集します。
        -   以下の形式になっています。

            ```
            wildcard1:
            value1
            value2

            wildcard2
            value3
            value4
            ...
            ```

## 📜構文

### Variants

候補の中から1つが選ばれる構文です。

#### 書き方

`(summer|autumn|winter|spring) is coming`

-   `summer is coming`, `spring is coming` などが生成されます。
-   各候補は2単語以上やスペース込みでもOKです。
-   本家の `{ }` です。
    -   NAIで予約されているため`( )`にしています。

#### 重み付け

`(5::summer|1::autumn|3::winter|spring)`

-   `n::`(n >= 0)を各候補の先頭につけることで、それが選択される確率に重み付けができます。
-   本家とは違い小数ではなく正の整数を使用します。
-   省略可能で、省略した場合は内部的に`1::`扱いとなります。

#### ネスト

`(1girl|(2|3|4|5|6+)girls)`

-   `( )`を重ねて使用できます。
-   `1girl`, `2girls`, `6+girls` などが生成されます。

### ON/OFF Variants

1つの候補、または空白が選ばれる構文です。

#### 書き方

`1girl wearing shirts <and skirt>`

-   `1girl wearing shirts (and skirt| )`の糖衣構文です。
-   ` 1girl wearing shirts and skirt`, `1girl wearing shirts `のどちらかが生成されます。
-   本家にはありません。

#### 重み付け

-   `n::`を候補の先頭につけることで、選択される確率に重み付けができます。
    -   正数: 候補が選択されやすくなります。
    -   負数: 空白が選択されやすくなります。

### 複合構文

各Variantsは複合できます。

#### 書き方

`(I like NAI <and SD>|She likes Bing)`

-   `I like NAI`, `I like NAI and SD`, `She likes Bing`が生成されます。

## 🃏ワイルドカード

候補が多いパターンや、使い回すパターンを登録できます。

### 登録方法

-   設定画面の Wildcard Editor で登録を行います。
-   1つの行が1候補になります。空白行は無視されます。
-   先頭に`#`をつけた行はコメント行になり、選択対象外になります。

### Variants

Variantsの使用が可能です。

#### 書き方

`__person__ car.`

```
person:
(I|We) have
(He|2::She) has <a>
```

-   登録済みのワイルドカード名を`__`で囲んで使用します。
-   以下のプロンプトが生成されます。
    -   `I have car.`
    -   `We have car.`
    -   `He has car.`
    -   `He has a car.`
    -   `She has car.`
    -   `She has a car.`

### 重み付け

-   `n::`を各行の先頭につけることで、それが選択される確率に重み付けができます。
-   省略可能で、省略した場合は内部的に`1::`扱いとなります。

#### 書き方

```
color:
2::red
5::green
blue
```

### ネスト

ワイルドカード内でワイルドカードの使用が可能です。

#### 書き方

`__person__ (__car__|__clothes__) <and __random__>.`

```
person:
3::(I|We) have
(He|2::She) has <a>
#You have

car:
bus
bike

clothes:
shirt
hat

random:
__person__ __car__
__person__ __clothes__
```

-   以下のようなプロンプトが生成されます。
    -   `I have bus.`
    -   `I have bike and She has a bus.`
    -   `We have hat.`
    -   `We have shirt and We have shirt.`
    -   `He has shirt.`
    -   `He has a hat and I have bike.`
    -   `She has a bike.`

## 🗑アンインストール

拡張機能の管理画面から削除します。

## ⚠️注意事項

-   🎲ボタンの表示処理がNAI側のHTML構成に大きく依存しているため、ページの仕様変更によって突然動作しなくなることがあります。ご了承ください。
-   拡張機能を再インストール、または削除するとワイルドカードのデータは失われます。  
    残しておきたい場合は、必ず設定画面の Simple Editor でテキストデータを保存しておいてください。
