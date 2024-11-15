import * as dotenv from "dotenv"
import path = require("path")
dotenv.config()

export const config = {
  username: process.env.APP_USERNAME || "",
  password: process.env.APP_PASSWORD || "",
  azureStoConnectionStr: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  blobContainerName: process.env.BLOB_CONTAINER_NAME || "",
  localBrowserPath: path.resolve("./playwright-browsers"),
  browserPath: path.resolve(process.env.HOME || "", ".cache", "ms-playwright"),
  statePath: path.resolve("./src/utils/state.json"),
  basicPage: "https://support.hpe.com/connect/s/?card=wc"
}