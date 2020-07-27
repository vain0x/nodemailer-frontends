# Nodemailer SMTP CLI

SMTP でメールを送信するためのコマンドラインアプリです。

内部的には処理を [nodemailer](https://github.com/nodemailer/nodemailer) ライブラリに丸投げしています。
詳細は [nodemailer のドキュメント](https://nodemailer.com/about/) を参照してください。

## 前提条件

以下のツールのインストールが必要です。

- Node.js (>= 12)

はじめにビルドを行ってください。

```sh
./prod-build
```

## 使用例

### 使用例: テスト

`--test` 引数を渡した場合、ダミーの SMTP アカウントを使って、メールの送信をシミュレーションします。実際には、メールは送信されません。

```sh
# 1通のメールの送信のテスト
node target/cli.js send --test --message examples/send_message.json

# メールの一斉送信のテスト
cat examples/bulk_stdin.json | node target/cli.js bulk --test 
```

### 使用例: 1通の送信 (send)

```sh
node target/cli.js send --account account.json --message message.json
```

### 使用例: 複数件の送信 (bulk)

標準入力に渡された行ごとに、指定したアカウントからメールを送信します。

```sh
cat <<'END' | node target/cli.js bulk --account account.json
{"id": 1, "message": {...}}
{"id": 2, "message": {...}}
END
```

各行は send の --messege 引数のパラメータと同じ形式の JSON データです。[examples/bulk_stdin.json](./examples/bulk_stdin.json) も参照。

## TODO

- [ ] アカウントや宛先をコマンドライン引数で指定して、標準入力を本文として送信する機能

## 関連リンク

類似ツール:

- [fardog/nodemailer-cli](https://github.com/fardog/nodemailer-cli)
- [LilithTundrus/nodemailer-cli-latest](https://github.com/LilithTundrus/nodemailer-cli-latest)
