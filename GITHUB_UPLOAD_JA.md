# GitHubへのアップロード手順

1. GitHubで `niconico69firan-source/suisangyo-learning-app` を開きます。
2. `uploading an existing file` または `Add file` → `Upload files` を選びます。
3. このZIPを展開します。
4. 展開したフォルダ自体ではなく、**中にある全ファイル・全フォルダ**をアップロード欄へドラッグします。
5. 画面下部のコミットメッセージを `Add water industry learning app` にします。
6. `Commit changes` を押します。

## 注意

- ZIPファイルそのものをGitHubへ置くだけではアプリのソースとして使えません。必ず展開した中身をアップロードしてください。
- `OPENAI_API_KEY`、クラス用合言葉、Cloudflareの秘密情報はGitHubへ書かないでください。
- GitHubはソースの保管場所です。GPT-5.4 nanoを動かす公開URLにはCloudflare WorkersとD1の設定が別途必要です。
