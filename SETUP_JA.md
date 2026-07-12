# 初期設定（先生向け）

このZIPにはAPIキーなどの秘密情報は入っていません。公開前に、デプロイ先の「環境変数／Secrets」で設定してください。

## 1. OpenAI側

1. アプリ専用のOpenAI APIプロジェクトを作る
2. APIキーを発行する
3. プリペイドを利用する場合はAuto rechargeをOFFにする
4. OpenAI側でも月1ドルなどの予算通知を設定する
5. 利用モデルはOpenAI側のプロジェクト設定でも `gpt-5.4-nano` だけに絞る

## 2. アプリ側のSecrets

最低限：

```text
OPENAI_API_KEY=発行したAPIキー
```

公開URLで使う場合の推奨設定：

```text
APP_ACCESS_CODE=児童に伝えるクラス用合言葉
AI_RATE_LIMIT_SALT=長いランダム文字列
AI_MONTHLY_BUDGET_USD=1
AI_MONTHLY_REQUEST_LIMIT=2000
AI_PER_MINUTE_LIMIT=2
```

- `APP_ACCESS_CODE` はGitHubへ書かず、Secretsへ入れてください。
- APIキーもHTMLやJavaScriptへ直接書かないでください。
- 月1ドルまたは月2,000回の早い方でAI精査を停止します。
- 上限後も無料ルーブリック判定は使えます。

## 3. D1

`.openai/hosting.json` は `DB` というD1バインディングを使う設定です。デプロイ先でD1が作成・接続されることを確認してください。

必要テーブルはアプリが自動作成し、Drizzleのマイグレーションも `drizzle/0000_productive_jack_power.sql` に同梱しています。

## 4. 動作確認

```bash
npm ci
npm run lint
npm test
```

公開後に `/hyouka` を開き、次を確認します。

- 合言葉欄が表示される
- 正しい合言葉でAI利用状況が表示される
- 「GPT-5.4 nanoで精査する」をオンにできる
- 例文でAI判定できる
- OpenAI Platform側のUsageにも少額の利用が記録される

## 5. 児童への約束

- 氏名、出席番号、学校名を書かない
- まとめの本文だけを入力する
- ABCだけでなく「次の問い」を読んで書き直す
- 最終評価は先生が授業中の様子と合わせて判断する
