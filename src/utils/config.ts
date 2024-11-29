import * as dotenv from "dotenv";
import path = require("path");
dotenv.config();

export const config = {
  username: process.env.APP_USERNAME || "",
  password: process.env.APP_PASSWORD || "",
  statePath: path.resolve("./src/utils/state.json"),
  basicPage: "https://support.hpe.com/connect/s/?card=wc",
  scrapeTimeout: 30,
  isLocal: process.env.ISLOCAL || ""
};
