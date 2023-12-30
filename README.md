# 🎲🃏Naildcard🤖🎨

NAI用Chrome拡張機能です。dynamic promptsっぽいことができます。

## 📲インストール

⚠️NAIは閉じておいてください。

1. Releasesから`Naildcard.zip`をダウンロードし、解凍します。
2. Google ChromeのURL欄に`chrome://extensions/`と入力し、拡張機能の管理画面に移動します。
3. 右上隅で「デベロッパーモード」をONにします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、手順1.で解凍された"dist"フォルダを選択すると拡張機能がインストールされます。
    - 再インストール時は前のバージョンを削除しておいてください。

## 🚀Quick Start

1. Chromeのメニューバーの拡張機能ボタン🧩を押し、"Naildcard"を選択します。
2. 設定ページが開くので、"Enabled"をONにし、"Prompt Template"に`Hello, (world|NAI)!`を入力します。
3. NAIを開くと、生成ボタンの横に🎲ボタンが表示されます。
4. ボタンを何度か押すと、`Hello, world!`、または`Hello, NAI!`のいずれかがプロンプト欄に入力されます。何度か押してみましょう。

-   ※手順3, 4がうまくいかない場合はNAIを再読み込みしてください。

## ⚙️設定

各設定値はChromeの拡張機能用ストレージに格納され、Chromeを閉じても保存されます。

-   Enabled
    -   🎲ボタンの表示/非表示を切り替えます。
    -   設定の反映にはNAIの再読み込みが必要です。
-   Prompt Template
    -   ランダムプロンプトの入力欄です。
    -   先頭に`#`をつけた行はコメント行になり、NAIのプロンプト欄には入力されません。
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

            wildcard2:
            value3
            value4
            ...
            ```

## 📜構文

### Variants

候補の中から1つが選ばれる構文です。

#### 書き方

`(summer|autumn|winter|spring) is coming`

-   `()`内を`|`で区切って候補を指定します。
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

-   `<>`で候補を指定します。
-   ` 1girl wearing shirts and skirt`, `1girl wearing shirts `のいずれかが生成されます。
-   `1girl wearing shirts (and skirt| )`の糖衣構文です。
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
-   先頭に`#`をつけた行はコメント行になり、候補対象外になります。

### Variants

Variantsの使用が可能です。

#### 書き方

##### ワイルドカード

```
person:
(I|We) have
(He|2::She) has <a>
```

##### プロンプト

`__person__ car.`

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
3::(yellow|2::pink) and white
```

### ネスト

ワイルドカード内でワイルドカードの使用が可能です。

#### 書き方

##### ワイルドカード

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

person_has_something:
__person__ __car__
__person__ __clothes__
```

##### プロンプト

`__person__ (__car__|__clothes__) <and __person_has_something__>.`

-   以下のようなプロンプトが生成されます。
    -   `I have bus.`
    -   `I have bike and She has a bus.`
    -   `We have hat.`
    -   `We have shirt and We have shirt.`
    -   `He has shirt.`
    -   `He has a hat and I have bike.`
    -   `She has a bike.`

## 💡その他の機能

### 部分コメント

-   Prompt Template内で`#`で囲んだ文字列は無視されます。
-   例: `This is #comment# example`  
    生成プロンプト: `This is  example`

### 括弧操作ショートカット

Prompt Template内では以下のショートカットキーが使用可能です。

#### ctrl + /

-   現在行の先頭に`#`を付けてコメント行にできます。もう一度押すと元に戻ります。

#### ctrl / alt キー + ↑ / ↓ キー

-   ctrlキー、またはaltキーを押しながら↑↓で括弧を増減します。
-   ctrlは`{}`、altは`[]`を操作します。
-   文字列の選択状態によって、操作の対象となる文字列が変わります。
    -   選択中の場合
        -   選択中の文字列
    -   未選択の場合
        -   キャレットが括弧内にあるときは括弧内の文字列
        -   それ以外は`,`区切りの文字列

#### `{`, `[`, `(`, `<`キー

-   各開き括弧キーを押すと自動で括弧を閉じます。
-   文字列の選択状態によって動作が変わります。
    -   選択中の場合
        -   選択中の文字列を括弧で閉じる
    -   未選択の場合
        -   キャレットの後ろに文字がない場合のみ括弧を閉じる

### `()`のエスケープ

-   Prompt Template内で`()`を使用するとVariants扱いになるため、`()`そのものが含まれるプロンプトを生成するためには、`\`を`(`と`)`の前に付ける必要があります。
-   例: `pom pom \((cheerleading|clothes)\)`  
    生成プロンプト: `pom pom (cheerleeding)`, または`pom pom (clothes)`
-   ⚠️内部的に`^`と`$`を用いてエスケープ処理を実装しているため、これらの文字はPrompt Template内で使用しないでください。

## 🗑アンインストール

拡張機能の管理画面から削除します。

## ⚠️注意事項

-   実装がNAI側のHTML構成に大きく依存しているため、ページの仕様変更によって突然動作しなくなることがあります。
-   拡張機能を再インストール、または削除すると設定画面のプロンプト、およびワイルドカードのデータは失われます。  
    残しておきたい場合は設定画面でテキストデータを保存しておいてください。
