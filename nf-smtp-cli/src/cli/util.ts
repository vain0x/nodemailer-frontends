import { readFile as fsReadFile } from "fs"
import { promisify } from "util"

export const readFile = async (filename: string): Promise<Buffer> =>
  await promisify(fsReadFile)(filename)
