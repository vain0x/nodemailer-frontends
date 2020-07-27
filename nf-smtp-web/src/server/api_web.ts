/**
 * ウェブ API のリクエストに対する応答
 */
export type WebActionResult =
  {
    kind: "WAR_JSON"
    data: unknown
  }
  | {
    kind: "WAR_ERROR"
    err: unknown
  }

export class BadRequestError extends Error {
}
