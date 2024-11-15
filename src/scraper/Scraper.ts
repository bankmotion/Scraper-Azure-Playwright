import { Browser, chromium, Page } from "playwright"
import { BlobServiceClient } from "@azure/storage-blob"
import { config } from "../utils/config"
import { Result } from "../types/Result"
import { delay, randomPause } from "../utils/utils"
import { ObjectId } from "../utils/constant"
import { loadBrowserState, runPlaywright, saveBrowserState } from "../functions/playwright"

export class Scraper {
  private browser: Browser | null = null
  private page: Page | null = null

  async init(): Promise<void> {
    const runPlaywrightData = await runPlaywright()
    this.browser = runPlaywrightData.browser
    this.page = runPlaywrightData.page
    console.log(config)

    // Load the state
    const loadedPage = await loadBrowserState(this.browser);
    if (loadedPage) this.page = loadedPage

    // Navigate to the login page
    await this.page.goto(config.basicPage)
    await this.page.waitForLoadState("domcontentloaded")

    const currentUrl = this.page.url()
    console.log(`Current URL after loading state: ${currentUrl}`)

    if (currentUrl.includes(config.basicPage)) {
      console.log(`State is valid, proceeding with scraping...`)
    } else {
      console.log(`Redirected to login page, performing login...`)
      await this.login(config.username, config.password)
    }
  }

  async login(username: string, password: string): Promise<void> {
    if (!this.page) throw new Error("Page is not initialized")


    // Input the email field
    await this.page.waitForSelector(ObjectId.Username)
    await this.page.fill(ObjectId.Username, username)
    await randomPause(this.page)

    // Click the next button
    await this.page.waitForSelector(ObjectId.LoginButton)
    await this.page.click(ObjectId.LoginButton);
    await randomPause(this.page)

    // Input the password field
    await this.page.waitForSelector(ObjectId.Password)
    await this.page.fill(ObjectId.Password, password)
    await randomPause(this.page)

    // Click the login button
    await this.page.waitForSelector('button[type="submit"]')
    await this.page.click('button[type="submit"]');

    // Waiting for a while after login
    await this.page.waitForNavigation({ waitUntil: 'networkidle' });

    await delay(10)
    // Save browser state
    await saveBrowserState(this.page.context())
  }

  async getDetail(serialNr: string): Promise<Result> {
    if (!this.page) throw new Error("Page is not initialized")

    console.log(`Start data scraping :${serialNr}`)

    // Input the serial number
    await this.page.waitForSelector(ObjectId.InputSerialNr)
    await this.page.fill(ObjectId.InputSerialNr, serialNr)
    await randomPause(this.page)

    console.log("hi")

    // Click submit button
    await this.page.waitForSelector(ObjectId.ButtonSerialNr)
    await this.page.click(ObjectId.ButtonSerialNr)

    let result: Result = { result: "rest", serialNr };
    console.log({ result })
    
    await randomPause(this.page, 5, 10)

    return result
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close()
  }
}