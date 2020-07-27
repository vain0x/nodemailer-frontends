// send コマンド

import { readFile } from "./util"
import { createTestAccount, createTransport } from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import { PrintHelpError } from "./command_help"

const sendCommandHelp = (appName: string) => `
${appName} send: 1通のメールを送信します。

使用例:
    ${appName} send --account account.json --message message.json
    ${appName} send --test --message message.json
    ${appName} send --help

引数:
        --account   SMTP サーバーやアカウントの設定が書かれた JSON ファイルを指定します
                    (https://nodemailer.com/smtp/ を参照)

        --message   メールのデータが書かれた JSON ファイルを指定します
                    (https://nodemailer.com/message/ を参照)

        --test      テスト用の送信アカウントを使います
                    (--account は無視されます)

標準出力:
    送信後、メッセージIDなどの情報が標準出力に JSON 形式で出力されます。
`

interface SendCommandArgs {
  accountSource: string
  messageSource: string
  test: boolean
}

const parseSendCommandArgs = (args: string[]): SendCommandArgs => {
  const output: SendCommandArgs = {
    accountSource: "",
    messageSource: "",
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

      case "--message":
        output.messageSource = args[i + 1]
        i += 2
        continue

      case "--test":
        output.accountSource = ""
        output.test = true
        i++
        continue

      case "-h":
      case "--help":
        throw new PrintHelpError(sendCommandHelp)

      default:
        throw new Error(`不明な引数です: ${args[i]}`)
    }
  }

  const errors: string[] = []
  if (!output.test && !output.accountSource) {
    errors.push("送信元となる SMTP アカウントが設定されていません。--account または --test が必要です。")
  }
  if (!output.messageSource) {
    errors.push("送信するメッセージが設定されていません。--message が必要です。")
  }
  if (errors.length !== 0) {
    throw new Error(`コマンドライン引数が不正です:\n\n${errors.join("\n\n")}`)
  }

  return output
}

const getAccount = async (args: SendCommandArgs): Promise<SMTPTransport.Options> => {
  if (args.test) {
    const { user, pass, smtp: { host, port, secure } } = await createTestAccount()
    return {
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
  return JSON.parse(accountJson.toString()) as SMTPTransport.Options
}

export const performSendCommand = async (execArgs: string[]) => {
  const args = parseSendCommandArgs(execArgs)

  const messageJson: Buffer = await readFile(args.messageSource)
  const message = JSON.parse(messageJson.toString()) as Mail.Options

  const account = await getAccount(args)
  const transport = createTransport(account)
  await transport.verify()

  const info = await transport.sendMail(message)
  console.log(JSON.stringify(info))
}
