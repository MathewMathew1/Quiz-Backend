import fs from "fs"

const text = fs.readFileSync("./common-passwords.new.txt", "utf-8");;
const commonPasswords = text.split("\n")
export {commonPasswords}