// CLI メイン

import { performBulkCommand } from "./command_bulk"
import { printGlobalHelp, printVersion, handleHelpError } from "./command_help"
import { performSendCommand } from "./command_send"

/**
 * プログラムを指定する部分を除いて、コマンドライン引数を取得する。
 */
const getCliArgs = () => {
  const args = process.argv

  let i = 1
  const arg = args[i] ?? ""
  if (arg.endsWith("cli") || arg.endsWith("cli.js") || arg.endsWith("cli.ts")) {
    i++
  }

  return args.slice(i)
}

const printError = (err: unknown) => {
  if (typeof err === "object" && err instanceof Error) {
    console.error(`[ERROR] ${err.message}`)
  } else {
    console.error("[ERROR] ", err)
  }
}

const parseGlobalArgs = (args: string[]): [string, string[]] => {
  let subcommand = "help"
  const flags: string[] = []

  for (; ;) {
    const arg = args.shift()
    if (arg == null) {
      break
    }

    switch (arg) {
      case "-V":
      case "--version":
      case "version":
        return ["version", []]

      default:
        if (arg.startsWith("-")) {
          flags.push(arg)
          continue
        }
        break
    }

    subcommand = arg
    break
  }

  return [subcommand, flags.concat(args)]
}

export const main = async () => {
  try {
    const [subcommand, args] = parseGlobalArgs(getCliArgs())
    switch (subcommand) {
      case "bulk":
        await performBulkCommand(args)
        return

      case "send":
        await performSendCommand(args)
        return

      case "help":
        printGlobalHelp()
        return

      case "version":
        printVersion()
        return

      default:
        throw new Error(`サブコマンドが不明です: ${subcommand}`)
    }
  } catch (err) {
    if (handleHelpError(err)) {
      return
    }

    printError(err)
    process.exit(1)
  }
}
