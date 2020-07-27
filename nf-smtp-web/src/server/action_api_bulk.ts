// POST /api/bulk
// CLI の bulk コマンドとだいたい同じ。

import { createTestAccount, createTransport } from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import SMTPPool from "nodemailer/lib/smtp-pool"
import { WebActionResult, BadRequestError } from "./api_web"

interface BulkActionArgs {
  account: SMTPPool.Options
  messages: InputRecord[]
  test?: boolean
}

interface InputRecord {
  id: unknown
  message: Mail.Options
}

type OutputRecord =
  {
    id: unknown
    success: true
    info: unknown
  }
  | {
    id: unknown
    success: false
    err: unknown
  }

const decodeBody = (body: unknown): BulkActionArgs => {
  if (typeof body !== "object" || body == null) {
    throw new BadRequestError("non-object body")
  }

  const args = body as BulkActionArgs
  if (typeof args.messages !== "object" || !(args.messages instanceof Array)) {
    throw new BadRequestError("messages is required")
  }
  if (args.account == null && args.test !== true) {
    throw new BadRequestError("account or test is required")
  }
  return args
}

const getAccount = async (args: BulkActionArgs): Promise<SMTPPool.Options> => {
  if (args.test === true) {
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

  const account = args.account as Omit<SMTPPool.Options, "pool">
  return { ...account, pool: true }
}

const doSendMail = async (transport: Mail, input: InputRecord): Promise<OutputRecord> => {
  const { id, message } = input
  try {
    const info = await transport.sendMail(message)
    return { id, success: true, info }
  } catch (err) {
    if (typeof err === "object" && err instanceof Error) {
      return { id, success: false, err: { ...err, message: err.message, stack: err.stack } }
    } else {
      return { id, success: false, err }
    }
  }
}

export const processBulkAction = async (body: unknown): Promise<WebActionResult> => {
  const args = decodeBody(body)

  const account = await getAccount(args)
  const transport = createTransport(account)
  await transport.verify()

  try {
    const outputs = await Promise.all(
      args.messages.map(input =>
        doSendMail(transport, input)
      ))
    return {
      kind: "WAR_JSON",
      data: { outputs },
    }
  } finally {
    transport.close()
  }
}
