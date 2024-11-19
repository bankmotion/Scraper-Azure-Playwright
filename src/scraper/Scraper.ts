import { Browser, chromium, Page } from "playwright"
import { BlobServiceClient } from "@azure/storage-blob"
import { config } from "../utils/config"
import { Device, Entitlement, Result, SupportLevel } from "../types/Result"
import { delay, randomPause } from "../utils/utils"
import { ObjectId, TableIndex } from "../utils/constant"
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

  async getDetail(serialNr: string): Promise<Device> {
    if (!this.page) throw new Error("Page is not initialized")
    let data: Device = {
      success: "false",
      serialNumber: serialNr,
    };

    console.log(`Start data scraping :${serialNr}`)

    // Input the serial number
    await randomPause(this.page, 7, 10)
    await this.page.waitForSelector(ObjectId.InputSerialNr)
    await this.page.fill(ObjectId.InputSerialNr, serialNr)
    await randomPause(this.page)

    // Click submit button
    await this.page.waitForSelector(ObjectId.ButtonSerialNr)
    await this.page.click(ObjectId.ButtonSerialNr)

    try {
      // Wait for product modal or subtitle change
      const modalPromise = this.page.waitForSelector(ObjectId.MultiProductModal, { timeout: 20000 })
      const notFoundPromise = this.page.waitForSelector(ObjectId.NoDataFound, { state: "visible", timeout: 20000 });
      const subtitlePromise = this.page.waitForSelector(ObjectId.SerialNrLabel, { state: "visible", timeout: 20000 })

      const result = await Promise.race([modalPromise, notFoundPromise, subtitlePromise])

      if (result) {
        await randomPause(this.page)

        if (await this.page.isVisible(ObjectId.MultiProductModal)) {
          console.log("Modal appeared")

          // find and click the cancel button in the modal
          const cancelBtn = this.page.locator(ObjectId.MultiModalCancelBtn)
          await cancelBtn.click()
          console.log("clicked cancel")
          data.success = "false"
          data.error = "NeedModelNumber"
        } else if (await this.page.isVisible(ObjectId.NoDataFound)) {
          console.log("Not found data")
          data.success = "false"
          data.error = "NotFound"
        } else if (await this.page.isVisible(ObjectId.SerialNrLabel)) {
          // Subtitle changed
          console.log("Subtitle chanaged without modal")

          // Get device data
          data.success = "true";
          data.productNumber = await this.page.locator(ObjectId.ProductNrValue).textContent() || undefined
          data.productName = await this.page.locator(ObjectId.ProductNameValue).textContent() || undefined

          const table = this.page.locator(ObjectId.TBodyValue)
          await table.waitFor()
          const rows = this.page.locator(`tbody tr`)
          const rowCount = await rows.count()

          // Retrieved table data
          const tableData: string[][] = [];
          for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i)
            let cells = row.locator("th, td")
            let cellCount = await cells.count();
            const rowData: string[] = []
            for (let j = 0; j < cellCount; j++) {
              rowData.push(await cells.nth(j).textContent())
            }
            tableData.push(rowData)
          }

          let previousEntitlement = "";
          for (const tbData of tableData) {
            if (!previousEntitlement) {
              previousEntitlement = tbData[TableIndex.Type]
            }
            if (tbData[TableIndex.Type]) {
              const newEntitlement: Entitlement = {
                type: tbData[TableIndex.Type],
                serviceType: tbData[TableIndex.ServiceType],
                supportLevels: []
              }
              if (!data.entitlements) {
                data.entitlements = []
              }
              data.entitlements.push(newEntitlement)
            }

            // add new supportLevel
            const serviceLevel = tbData[TableIndex.ServiceLevel].split('\n').map(item => item.trim()).filter(item => item !== "")
            const deliverables = tbData[TableIndex.deliverables].split('\n').map(item => item.trim()).filter(item => item !== "")
            const newSupportLevel: SupportLevel = {
              startDate: tbData[TableIndex.StartDate] ? (new Date(tbData[TableIndex.StartDate])).toISOString() : undefined,
              endDate: tbData[TableIndex.EndDate] ? (new Date(tbData[TableIndex.EndDate])).toISOString() : undefined,
              serviceLevel: serviceLevel.length > 0 ? serviceLevel : undefined,
              deliverables: deliverables.length > 0 ? deliverables : undefined,
              status: tbData[TableIndex.Status] || undefined
            }

            if (newSupportLevel.startDate || newSupportLevel.endDate || newSupportLevel.serviceLevel || newSupportLevel.deliverables || newSupportLevel.status) {
              data.entitlements[data.entitlements.length - 1].supportLevels.push(newSupportLevel)
            }

            previousEntitlement = tbData[TableIndex.Type]
          }

          await randomPause(this.page)
          // Click check another product button
          const checkAnotherBtn = this.page.locator(ObjectId.CheckAnotherBtn)
          await checkAnotherBtn.click()
        }
      }


    } catch (err) {
      data.success = "false";
      data.error = "HPE Server Error, try again later"
      if (err.name === "TimeoutError") {
        data.error = "Server reponse timeout exceeds"
      } else {
        console.error(`Scraper.ts=>getDetail()=>An unexpected error occured: ${err}`)
      }
    }
    console.log({ data })

    await randomPause(this.page)

    return data
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close()
  }
}