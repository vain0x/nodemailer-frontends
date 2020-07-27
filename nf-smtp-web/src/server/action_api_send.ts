// POST /api/send
// CLI の send コマンドとだいたい同じ。

import { createTestAccount, createTransport } from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import { WebActionResult, BadRequestError } from "./api_web"

interface SendActionArgs {
  account: SMTPTransport.Options
  message: Mail.Options
  test?: boolean
}

const decodeBody = (body: unknown): SendActionArgs => {
  if (typeof body !== "object" || body == null) {
    throw new BadRequestError("non-object body")
  }

  const args = body as SendActionArgs
  if (args.message == null) {
    throw new BadRequestError("id/message is required")
  }
  if (args.account == null && args.test !== true) {
    throw new BadRequestError("account or test is required")
  }
  return args
}

const getAccount = async (args: SendActionArgs): Promise<SMTPTransport.Options> => {
  if (args.test === true) {
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

  return args.account
}

export const processSendAction = async (body: unknown): Promise<WebActionResult> => {
  const args = decodeBody(body)

  const account = await getAccount(args)
  const transport = createTransport(account)
  await transport.verify()

  const { message } = args
  const info = await transport.sendMail(message)

  return {
    kind: "WAR_JSON",
    data: {
      info,
    },
  }
}
