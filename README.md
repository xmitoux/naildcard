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

1. Chromeのメニューバーの拡張機能ボタン🧩を押し、`Naildcard`を選択します。
2. 設定ページが開くので、"Enabled"をONにし、画面下部の`Dynamic Prompt`に`Hello, (world|NAI)!`を入力します。
3. NAIを開くと、生成ボタンの横に🎲ボタンが表示されます。
4. ボタンを何度か押すと、`Hello, world!`、または`Hello, NAI!`のいずれかがプロンプト欄に入力されます。何度か押してみて上記のプロンプト2種類が入力されればOKです。

-   ※手順3, 4がうまくいかない場合はNAIを再読み込みしてください。

## ⚙️設定

-   `Enabled`
    -   🎲ボタンの表示/非表示を切り替えます。
    -   設定の反映にはNAIの再読み込みが必要です。

## 📝Dynacmic Prompt

ランダムプロンプトの入力欄です。
以下の構文を用いてランダムなプロンプトを作成します。

### Variants

候補の中から1つが選ばれる構文です。

#### 書き方

`(summer|autumn|winter|spring) is coming`

-   `()`内を`|`で区切って候補を指定します。
-   `summer is coming`, `spring is coming` などが生成されます。
-   各候補は2単語以上やスペース込みでもOKです。

#### 重み付け

`(5::summer|1::autumn|3::winter|spring)`

-   `n::`(n >= 0)を各候補の先頭につけることで、それが選択される確率に重み付けができます。
-   省略可能で、省略した場合は内部的に`1::`扱いとなります。
-   `0::`の場合は選択対象外となります。

#### ネスト

`(1girl|(2|3|4|5|6+)girls)`

-   `( )`を重ねて使用できます。
-   `1girl`, `2girls`, `6+girls` などが生成されます。

#### `()`のエスケープ

-   `()`そのものが含まれるプロンプトを生成するためには、`\`を`(`と`)`の前に付ける必要があります。
-   例: `pom pom \((cheerleading|clothes)\)`  
    生成プロンプト: `pom pom (cheerleeding)`, または`pom pom (clothes)`
-   ⚠️内部的に`^`と`$`を用いてエスケープ処理を実装しているため、これらの文字はDynamic Prompt内で使用しないでください。

### ON/OFF Variants

1つの候補、または空白が選ばれる構文です。

#### 書き方

`1girl wearing shirts <and skirt>`

-   `<>`で候補を指定します。
-   ` 1girl wearing shirts and skirt`, `1girl wearing shirts `のいずれかが生成されます。
-   `1girl wearing shirts (and skirt| )`の糖衣構文です。

#### 重み付け

-   `n::`を候補の先頭につけることで、選択される確率に重み付けができます。
    -   正数: 候補が選択されやすくなります。
    -   負数: 空白が選択されやすくなります。

### 複合構文

各Variantsは複合できます。

#### 書き方

`(I like NAI <and SD>|She likes Bing)`

-   `I like NAI`, `I like NAI and SD`, `She likes Bing`が生成されます。

### コメント

#### 行コメント

-   先頭に`#`をつけた行はコメント行になり、NAIのプロンプト欄には入力されません。

#### 部分コメント

-   `#...#`で囲んだ文字列はコメント行になり、NAIのプロンプト欄には入力されません。
-   行コメントが優先されます。

## 🃏Wildcard Editor

ワイルドカードの編集用UIです。

-   `Manager`, `Simple`の2通りのUIで編集が可能です。
-   `Manager`
    -   左ペイン: ワイルドカードの新規登録・選択・リネーム・削除を行います。
    -   右ペイン: 選択したワイルドカードの候補の編集を行います。
-   `Simple`

    -   ワイルドカードのテキストデータを直接編集します。以下の形式になっています。

        ```
        wildcard1:
        value1
        value2
        wildcard2:
        value3
        value4
        value5
        ...
        ```

### ワイルドカード

候補が多いVariantsやよく使うパターンをワイルドカードとして登録し、`Dynamic Prompt`で使用します。

#### 使用方法

-   1つの行が1候補になります。
-   ⚠️空白行は空文字の候補として扱われます。不要な改行は入れないように注意してください。
-   `Dynamic Prompt`と同じ構文が使用可能です。
-   ワイルドカード名を`__`で囲んで`Dynamic Prompt`に記載します。

##### 書き方

```
person:
(I|We) have
(He|2::She) has <a>
```

##### Dynamic Prompt

`__person__ car.`

-   以下のプロンプトが生成されます。
    -   `I have car.`
    -   `We have car.`
    -   `He has car.`
    -   `He has a car.`
    -   `She has car.`
    -   `She has a car.`

#### 重み付け

-   `n::`(n >= 0)を各行の先頭につけることで、それが選択される確率に重み付けができます。
-   省略可能で、省略した場合は内部的に`1::`扱いとなります。
-   `0::`の場合は選択対象外となります。

##### 書き方

```
color:
2::red
5::green
blue
0::(yellow|2::pink) and white
```

#### ネスト

ワイルドカード内でワイルドカードの使用が可能です。

##### 書き方

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

##### Dynamic Prompt

`__person__ (__car__|__clothes__) <and __person_has_something__>.`

以下のようなプロンプトが生成されます。

-   `I have bus.`
-   `I have bike and She has a bus.`
-   `We have hat.`
-   `We have shirt and We have shirt.`
-   `He has shirt.`
-   `He has a hat and I have bike.`
-   `She has a bike.`

## 📦Danbooru Tag Helper

Danbooruタグの入力補助機能です。

### 使い方

1. 検索欄に文字を入力するとインクリメンタルサーチが行われ、タグ名のサジェストがポップアップします。
2. サジェストからタグ名を選択すると検索欄にタグ名が入力されます。
    - サジェストの選択は以下の操作で可能です。
        - マウスクリック
        - 上下キー + エンターキー / タブキー
3. この状態で`Insert Tag to Prompt`ボタンを押すと、`Dynamic Prompt`にタグが挿入されます。`Wildcard`を編集中の場合は`Insert Tag to Wildcard`で`Wildcard`に挿入されます。
    - 手入力だけではボタンが非活性となり操作できません。必ず手順2.の選択操作を行ってください。
    - `()`が含まれるタグは挿入後に自動でエスケープされます。

### 検索方法

#### Fuzzy Search (あいまい検索)

-   `Fuzzy Search`をONにするとあいまい検索が可能になります。
-   スペースの入力有無で検索方法が異なります。
    -   スペースなしの場合
        -   タグ名を部分一致で検索します。
        -   前方一致でないものもヒットします。
        -   例:
            -   入力: `rmbh`
            -   上位の結果:
                -   f`r`o`m` `b`e`h`ind
                -   xxx f`r`o`m` `b`e`h`ind
                -   `ar` ms `b`e`h`ind back
                -   `ar` ms `b`e`h`ind head
    -   スペースありの場合
        -   複数単語のタグ名を、各単語の前方一致(順不同)でAND検索します。
        -   例:
            -   入力: `lo ha`
            -   上位の結果:
                -   `lo`ng `ha`ir
                -   very `lo`ng `ha`ir
                -   short `ha`ir with `lo`ng locks

#### 通常検索

-   `Fuzzy Search`をOFFにすると前方一致で検索します。
-   複数単語の場合はスペースが必要です。

### 設定

#### Focus After Tag Insertion (タグ挿入後のフォーカス位置 )

-   Input: 検索欄
-   Prompt: 挿入したプロンプト欄

#### Insert Comma At (タグ挿入時のカンマ位置)

-   Auto: 周りの文字列から推論した位置(基本的にはタグの周りにカンマを付ける)
-   Before Tag: タグの前
-   After Tag: タグの後
-   Both Sides of Tag: タグの両端
-   None: 付けない

### その他の機能

#### Wiki参照

検索欄にタグ名が入力された状態で`Refer to Wiki`ボタンを押すと、そのタグのDanbooru Wikiをブラウザの新規タブで開きます。

#### タグのコピー

検索欄にタグ名が入力された状態で入力欄右のボタンを押すと、選択されたタグをクリップボードにコピーします。

#### 検索履歴

-   サジェストから選択したタグは入力履歴として保持されます。
-   検索欄に何も入力していない状態でフォーカスすると入力履歴がポップアップします。
-   入力履歴のサジェストを上下キーでハイライトした状態で`ctrl + Deleteキー`を押すと履歴を削除できます。

### アンダースコア`_`について

検索およびタグ挿入どちらの操作でも`_`は完全に無視されます。`_`はDanbooruサイト上でのタグ名検索のみに必要な記号であり、実際のタグ名には含まれないことが理由です。

## ⌨ショートカットキー

`Dynacmic Prompt`, および`Wildcard Editor`内では以下のショートカットキーが使用可能です。

#### ctrl + /

-   現在行の先頭に`#`を付けてコメント行にできます。もう一度押すと元に戻ります。

#### ctrl / alt + ↑ / ↓

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

## 🗑アンインストール

拡張機能の管理画面から削除します。

## ⚠️注意事項

-   実装がNAI側のHTML構成に大きく依存しているため、ページの仕様変更によって突然動作しなくなることがあります。
-   拡張機能を再インストール、または削除すると設定画面のプロンプト、およびワイルドカードのデータは消去されます。  
    残しておきたい場合は設定画面でテキストデータを保存しておいてください。
