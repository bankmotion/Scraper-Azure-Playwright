import { Browser, chromium, BrowserContext, Page } from "playwright";
import { downloadBrowserFromAzure } from "./azureStorage";
import * as fs from "fs";
import path = require("path");
import { config } from "../utils/config";

// Download the browser file if not already present
export const runPlaywright = async () => {
  // await downloadBrowserFromAzure()

  const chromiumExecutablePath =
    "/home/runner/.cache/ms-playwright/chromium-1148";
  console.log({ chromiumExecutablePath });
  const browser = await chromium.launch({
    // executablePath: chromiumExecutablePath,
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  return { browser, page };
};

// Save Browser State After login
export const saveBrowserState = async (browserContext: BrowserContext) => {
  await browserContext.storageState({ path: config.statePath });
  console.log("Saved the browser statue successfully");
};

// load the State from state.json
export const loadBrowserState = async (browser: Browser): Promise<Page> => {
  try {
    const state = JSON.parse(fs.readFileSync(config.statePath, "utf8"));

    const context = await browser.newContext({ storageState: state });
    const page: Page = await context.newPage();
    return page;
  } catch (err) {
    console.error(`Error loading browser state: ${err}`);
    return null;
  }
};
