import express from "express"

/**
 * アクセスログを出力するミドルウェア
 * デバッグ用なのでいろいろと雑
 */
export const createLoggingMiddleware = (): express.RequestHandler => {
  let lastId = 0

  return (req, res, next) => {
    lastId++
    const reqId = lastId.toString(16)

    const { method, path: pathname } = req
    const startDate = new Date()
    const timestamp = startDate.toISOString().substr(5, 14).replace("T", " ")
    const startTime = startDate.valueOf()
    console.log(`[TRACE] #${reqId} ${method} ${pathname} - BEGIN ${timestamp}`)

    next()

    const ellapsedMillis = Date.now() - startTime
    const statusCode = res.statusCode
    console.log(`[TRACE] #${reqId} ${method} ${pathname} - END ${statusCode} in ${ellapsedMillis}ms`)
  }
}
