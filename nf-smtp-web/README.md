# Nodemailer SMTP Web

SMTP でメールを送信するためのウェブサーバーです。

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

```sh
./prod-start
```

### 使用例 (curl)

```sh
./prod-start &
sleep 3s        # サーバーが起動するのを待つ。

curl \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -X POST \
    -T examples/send_request.json \
    http://localhost:8080/api/send
```

## API 仕様

### POST /api/send

メールを1通送信します。

リクエスト:

```ts
// Content-Type = application/json
interface SendRequestBody {
    id: unknown
    account: SMTPTransport.Options
    message: Mail.Options
    test?: boolean
}
```

レスポンス:

```ts
// Content-Type = application/json
interface SendResponseBody {
    info: unknwon
}
```

メールの送信に失敗した際はエラーが発生します。

### POST /api/bulk

複数件のメールを送信します。

リクエスト:

```ts
// Content-Type = application/json
interface BulkRequestBody {
    account: SMTPTransport.Options
    test?: boolean
    messages: {
        id: unknown
        message: Mail.Options
    }
}
```

レスポンス:

```ts
interface BulkResponseBody {
    outputs: Array<{
        id: unknown
        success: true
        info: unknown
    } | {
        id: unknown
        success: false
        err: unknown
    }>
}
```

メールの一部または全部の送信に失敗したときは、success = false を含むデータが OK ステータスで返ります。
