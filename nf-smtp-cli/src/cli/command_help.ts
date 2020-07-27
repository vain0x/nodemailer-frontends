// ヘルプとバージョン情報

const APP_NAME = "node target/cli.js"
const VERSION = "0.1.0"

const GLOBAL_HELP = `
サブコマンド:
    ${APP_NAME} send    1通のメールを送信します

使用例:
    ${APP_NAME} send --account account.json --message mesasge.json
    ${APP_NAME} send --help
`

const FOOTER = `
その他:
    -h, --help      ヘルプを表示します
    -V, --version   バージョン情報を表示します
`

const doPrintHelp = (details: string) => {
  console.log(`${APP_NAME} v${VERSION}\n\n${details.trim()}\n\n${FOOTER.trim()}`)
}

export const printGlobalHelp = () => {
  doPrintHelp(GLOBAL_HELP)
}

export const printVersion = () => {
  console.log(`${APP_NAME} v${VERSION}`)
}

/**
 * ヘルプを表示して終了するための例外
 */
export class PrintHelpError extends Error {
  constructor(
    public readonly messageFn: (appName: string) => string,
  ) {
    super()
  }
}

export const handleHelpError = (err: unknown): boolean => {
  if (typeof err === "object" && err != null && err instanceof PrintHelpError) {
    doPrintHelp(err.messageFn(APP_NAME))
    return true
  } else {
    return false
  }
}
