// Web サーバー (Express.js) に関連するコード。

import compression from "compression"
import express from "express"
import { WebActionResult, BadRequestError } from "./api_web"
import { processBulkAction } from "./action_api_bulk"
import { processSendAction } from "./action_api_send"
import { createLoggingMiddleware } from "./web_server_logging"

const WEB_PORT = 8080
const WEB_ORIGIN = "http://localhost:8080"

const exhaust = (never: never): never => never

/**
 * アクションの処理中のエラーを express のレスポンスオブジェクトに反映する。
 */
const handleError = (err: unknown, res: express.Response): void => {
  if (err instanceof BadRequestError) {
    // Bad Request
    res.status(400).send(err.message)
    return
  }

  if (err instanceof Error) {
    console.error("[ERROR] message = ", err.message, ", stacktrace = ", err.stack)
    res.sendStatus(500)
    return
  }

  console.error("[ERROR] ", err)
  res.sendStatus(500)
}

/**
 * アクションの処理結果を express のレスポンスオブジェクトに反映する。
 */
const performResult = (result: WebActionResult, _req: express.Request, res: express.Response): void => {
  switch (result.kind) {
    case "WAR_JSON":
      res.json(result.data)
      return

    case "WAR_ERROR":
      handleError(result.err, res)
      return

    default:
      return exhaust(result)
  }
}

/**
 * 非同期操作の結果を express のレスポンスオブジェクトに反映する。
 */
const handleAsync = (req: express.Request, res: express.Response, _next: express.NextFunction, promise: Promise<WebActionResult>): void => {
  promise
    .catch(err => ({ kind: "WAR_ERROR", err: err as unknown }) as WebActionResult)
    .then(result => performResult(result, req, res))
}

const createExpressRouter = (): express.Router => {
  const router = express.Router()

  // カオスを避けるため、実装そのものは他のファイルに書いて、ここでは関数を呼ぶだけにとどめる。

  router.post("/api/bulk", (req, res, next) =>
    handleAsync(req, res, next,
      processBulkAction(req.body)
    ))

  router.post("/api/send", (req, res, next) =>
    handleAsync(req, res, next,
      processSendAction(req.body)
    ))

  router.all("*", (_req, res) => {
    res.sendStatus(404)
  })

  return router
}

export const startWebServer = () => {
  const app = express()

  app.use(createLoggingMiddleware())
  app.use(compression())

  // Content-Type が application/json であるリクエストのボディをパースして、
  // JSON から作られたオブジェクトを req.body に設定する。
  app.use(express.json())

  app.use(createExpressRouter())

  app.listen(WEB_PORT, () => {
    console.log("[INFO] Server is ready", WEB_ORIGIN)
  })
}
