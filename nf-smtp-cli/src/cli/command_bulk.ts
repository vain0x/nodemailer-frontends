// bulk コマンド

import { createTestAccount, createTransport } from "nodemailer"
import { readFile } from "./util"
import Mail from "nodemailer/lib/mailer"
import readline from "readline"
import SMTPPool from "nodemailer/lib/smtp-pool"
import { PrintHelpError } from "./command_help"

const bulkCommandHelp = (appName: string) => `
${appName} bulk: 単一のアカウントから、複数のメールを送信します。

使用例:
    ${appName} bulk --account account.json
    ${appName} bulk --test
    ${appName} bulk --help

引数:
        --account   SMTP アカウントの設定が書かれた JSON ファイルを指定します
                    (https://nodemailer.com/smtp/ を参照)

        --test      テスト用の送信アカウントを使います
                    (--account は無視されます)

標準入力:
    1行につき1つの JSON データを入力してください。

        { id: number, message: Mail.Options }

    id プロパティには、各メッセージを区別するための識別子を指定してください。

    message プロパティには、メールの宛先や内容などを表す、
    Mail.Options 型のオブジェクトを指定してください。
    (https://nodemailer.com/message/ を参照)

標準出力:
    メッセージを1通送信するたびに、標準出力に JSON データが1行出力されます。
    形式は次の2通りです。

        { id: number, success: true, info: unknown }
        { id: number, success: false, err: unknown }

    id プロパティは、標準入力で与えられた id が設定されます。
    ただし、入力された行を JSON テキストとして解釈できなかった場合、
    id は null になります。

    success プロパティは、メールの送信処理が成功した否かを表します。

    info プロパティは、success=true のときだけ存在し、
    メール送信時の情報が入ります。

    err プロパティは、success=false のときだけ存在し、
    メール送信中に発生した例外の情報が入ります。

ステータスコード:
    コマンドライン引数や SMTP アカウントの認証に不備がある場合は、
    エラーが発生して 0 でないコードで終了します。

    メールの送信の失敗は、コマンドのエラーとはみなされません。
    一部または全部の送信に失敗した場合でも、コード 0 を返すことがあります。
`

interface BulkCommandArgs {
  accountSource: string
  test: boolean
}

const parseBulkCommandArgs = (args: string[]): BulkCommandArgs => {
  const output: BulkCommandArgs = {
    accountSource: "",
    test: false,
  }

  let i = 0
  while (i < args.length) {
    switch (args[i]) {
      case "--account":
        output.accountSource = args[i + 1]
        output.test = false
        i += 2
        continue

      case "--test":
        output.accountSource = ""
        output.test = true
        i++
        continue

      case "-h":
      case "--help":
        throw new PrintHelpError(bulkCommandHelp)

      default:
        throw new Error(`不明な引数です: ${args[i]}`)
    }
  }

  if (!output.test && !output.accountSource) {
    throw new Error("コマンドライン引数が不正です: 送信元となる SMTP アカウントが設定されていません。--account または --test が必要です。")
  }

  return output
}

const getAccount = async (args: BulkCommandArgs): Promise<SMTPPool.Options> => {
  if (args.test) {
    const { user, pass, smtp: { host, port, secure } } = await createTestAccount()
    return {
      pool: true,
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      debug: true,
      logger: true,
    }
  }

  const accountJson: Buffer = await readFile(args.accountSource)
  const options = JSON.parse(accountJson.toString()) as Omit<SMTPPool.Options, "pool">
  return { ...options, pool: true }
}

interface InputRecord {
  id: number | string
  message: Mail.Options
}

type OutputRecord =
  {
    id: number | string
    success: true
    info: unknown
  }
  | {
    id: unknown
    success: false
    err: unknown
  }

const doSendMail = async (transport: Mail, inputJson: string) => {
  let id: number | string | null = null
  let output: OutputRecord | null = null

  try {
    const { id: theId, message } = JSON.parse(inputJson) as InputRecord
    id = theId

    const info = await transport.sendMail(message)
    output = { id, success: true, info }
  } catch (err) {
    if (typeof err === "object" && err instanceof Error) {
      output = { id, success: false, err: { ...err, message: err.message, stack: err.stack } }
    } else {
      output = { id, success: false, err }
    }
  }

  console.log(JSON.stringify(output))
}

export const performBulkCommand = async (execArgs: string[]) => {
  const args = parseBulkCommandArgs(execArgs)

  const account = await getAccount(args)
  const transport = createTransport(account)
  await transport.verify()

  try {
    const promiseArray: Promise<void>[] = []

    await new Promise<void>((resolve, reject) => {
      const rl = readline.createInterface(process.stdin)

      rl.on("line", line => {
        promiseArray.push(doSendMail(transport, line))
      })

      rl.on("close", () => {
        resolve()
      })

      rl.on("error", err => {
        console.error("[ERROR] STDIN", err)
        reject(err)
      })
    })

    // すべての送信処理が終わるのを待つ。
    await Promise.all(promiseArray)
  } finally {
    transport.close()
  }
}
