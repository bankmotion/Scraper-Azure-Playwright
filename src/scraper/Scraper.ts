import { Browser, Page } from "playwright-core";
import { BlobServiceClient } from "@azure/storage-blob";
import { config } from "../utils/config";
import { Device, Entitlement, Result, SupportLevel } from "../types/Result";
import { delay, randomPause, withTimeout } from "../utils/utils";
import { Messages, ObjectId, TableIndex } from "../utils/constant";
import {
  loadBrowserState,
  runPlaywright,
  saveBrowserState,
} from "../services/playwright";

export class Scraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private readonly scrapeTimeout = config.scrapeTimeout * 1000;

  /**
   * initialize the scraper by launching a browser instance
   */
  async init(): Promise<void> {
    const runPlaywrightData = await runPlaywright();
    this.browser = runPlaywrightData.browser;
    this.page = runPlaywrightData.page;
    console.log(config);

    // Load saved borwser state if available
    // const loadedPage = await loadBrowserState(this.browser);
    // if (loadedPage) this.page = loadedPage;

    // Navigate to the main page or perform login
    await this.navigateToPage(config.basicPage);
    await this.handleLoginIfNeeded();
  }

  private async navigateToPage(url: string): Promise<void> {
    if (!this.page) throw new Error(Messages.PageNotInitialized);

    await this.page.goto(url, { timeout: this.scrapeTimeout });
    await this.page.waitForLoadState("domcontentloaded", {
      timeout: this.scrapeTimeout,
    });
    console.log(`${Messages.NavigatedToURL} ${this.page.url}`);
  }

  private async handleLoginIfNeeded(): Promise<void> {
    if (!this.page) throw new Error(Messages.PageNotInitialized);

    const currentUrl = this.page.url();
    if (currentUrl.includes(config.basicPage)) {
      console.log(Messages.StateIsValid);
      return;
    }

    console.log(Messages.RedirectedToLoginPage);
    await this.login(config.username, config.password);
  }

  /**
   * Perform login
   * @param username
   * @param password
   */
  async login(username: string, password: string): Promise<void> {
    if (!this.page) throw new Error(Messages.PageNotInitialized);

    try {
      await withTimeout(async () => {
        // Input the email field
        await this.page.waitForSelector(ObjectId.Username);
        await this.page.fill(ObjectId.Username, username);
        await randomPause(this.page);

        // Click the next button
        await this.page.waitForSelector(ObjectId.LoginButton);
        await this.page.click(ObjectId.LoginButton);
        await randomPause(this.page);

        // Input the password field
        await this.page.waitForSelector(ObjectId.Password);
        await this.page.fill(ObjectId.Password, password);
        await randomPause(this.page);

        // Click the login button
        await this.page.waitForSelector('button[type="submit"]');
        await this.page.click('button[type="submit"]');

        // Waiting for a while after login
        await this.page.waitForNavigation({ waitUntil: "networkidle" });

        await delay(10);
        // Save browser state
        await saveBrowserState(this.page.context());
      }, this.scrapeTimeout);
    } catch (err) {
      console.error(`${Messages.LoginFailed}${err}`);
      throw err;
    }
  }

  async getDetail(serialNr: string): Promise<Device> {
    if (!this.page) throw new Error(Messages.PageNotInitialized);

    let data: Device = {
      success: "false",
      serialNumber: serialNr,
    };

    console.log(`${Messages.StartingScrape} ${serialNr}`);

    try {
      await withTimeout(async () => {
        // Input serialNr and submit button
        await this.page.fill(ObjectId.InputSerialNr, serialNr);
        await randomPause(this.page);
        await this.page.click(ObjectId.ButtonSerialNr);

        // Wait for one of the possible outcomes
        const result = await Promise.race([
          this.page.waitForSelector(ObjectId.MultiProductModal, {
            timeout: this.scrapeTimeout,
          }),
          this.page.waitForSelector(ObjectId.NoDataFound, {
            state: "visible",
            timeout: this.scrapeTimeout,
          }),
          this.page.waitForSelector(ObjectId.SerialNrLabel, {
            state: "visible",
            timeout: this.scrapeTimeout,
          }),
        ]);

        // Handle different outcomes
        if (await this.page.isVisible(ObjectId.MultiProductModal)) {
          console.log(Messages.ModalAppeared);
          data.error = Messages.NeedModelNumber;
          data.success = "false";

          // find and click the cancel button in the modal
          const cancelBtn = this.page.locator(ObjectId.MultiModalCancelBtn);
          await cancelBtn.click();
        } else if (await this.page.isVisible(ObjectId.NoDataFound)) {
          console.log(Messages.NoDataFound);
          data.error = Messages.NotFound;
          data.success = "false";
        } else if (await this.page.isVisible(ObjectId.SerialNrLabel)) {
          console.log(Messages.SerialNumberFound);
          data = await this.extractDetails(serialNr);
          data.success = "true";

          // Click check another product button
          const checkAnotherBtn = this.page.locator(ObjectId.CheckAnotherBtn);
          await checkAnotherBtn.click();
        }

        await randomPause(this.page, 3, 5);
      }, this.scrapeTimeout);
    } catch (err) {
      console.error(`${Messages.ErrorDataScraping} ${err}`);
      data.error =
        err.name === "TimeoutError"
          ? Messages.ServerResTimeoutExceeded
          : Messages.ServerError;
    }

    console.log("Scraping data", data);
    return data;
  }

  /**
   * Extract detailed information about the product and entitlements
   * @param serialNr
   */
  private async extractDetails(serialNr: string): Promise<Device> {
    const data: Device = {
      success: "true",
      serialNumber: serialNr,
    };

    // Extract basic product information
    data.productNumber =
      (await this.page.locator(ObjectId.ProductNrValue).textContent()) ||
      undefined;
    data.productName =
      (await this.page.locator(ObjectId.ProductNameValue).textContent()) ||
      undefined;

    // Locate the table containing entitlement details
    const table = this.page.locator(ObjectId.TBodyValue);
    await table.waitFor();

    const rows = this.page.locator("tbody tr");
    const rowCount = await rows.count();

    // Retrieve table data
    const tableData: string[][] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator("th, td");
      const cellCount = await cells.count();
      const rowData: string[] = [];

      for (let j = 0; j < cellCount; j++) {
        const cellText = await cells.nth(j).textContent();
        rowData.push(cellText ? cellText.trim() : "");
      }

      tableData.push(rowData);
    }

    // Process the retrieved table data
    let previousEntitlement = "";
    for (const tbData of tableData) {
      if (!previousEntitlement) {
        previousEntitlement = tbData[TableIndex.Type];
      }

      // Add new entitlement if type exists
      if (tbData[TableIndex.Type]) {
        const newEntitlement: Entitlement = {
          type: tbData[TableIndex.Type],
          serviceType: tbData[TableIndex.ServiceType] || undefined,
          supportLevels: [],
        };
        if (!data.entitlements) {
          data.entitlements = [];
        }
        data.entitlements.push(newEntitlement);
      }

      // Add new supportLevel to the most recent entitlement
      const serviceLevel = tbData[TableIndex.ServiceLevel]
        ?.split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");
      const deliverables = tbData[TableIndex.deliverables]
        ?.split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== "");
      const newSupportLevel: SupportLevel = {
        startDate: tbData[TableIndex.StartDate]
          ? new Date(tbData[TableIndex.StartDate]).toISOString()
          : undefined,
        endDate: tbData[TableIndex.EndDate]
          ? new Date(tbData[TableIndex.EndDate]).toISOString()
          : undefined,
        serviceLevel: serviceLevel.length > 0 ? serviceLevel : undefined,
        deliverables: deliverables.length > 0 ? deliverables : undefined,
        status: tbData[TableIndex.Status] || undefined,
      };

      if (
        newSupportLevel.startDate ||
        newSupportLevel.endDate ||
        newSupportLevel.serviceLevel ||
        newSupportLevel.deliverables ||
        newSupportLevel.status
      ) {
        const entitlements = data.entitlements;
        if (entitlements && entitlements.length > 0) {
          entitlements[entitlements.length - 1].supportLevels.push(
            newSupportLevel
          );
        }
      }

      previousEntitlement = tbData[TableIndex.Type];
    }

    console.log(`Extracted details:`, data);
    return data;
  }

  /**
   * Parse a row of data to create an Entitlement data
   */
  private parseEntitlement(rowData: string[]): Entitlement | null {
    if (!rowData[TableIndex.Type]) return null;

    // Parse service levels and deliverables into structured data
    const serviceLevel = rowData[TableIndex.ServiceLevel]
      ?.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const deliverables = rowData[TableIndex.deliverables]
      ?.split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    return {
      type: rowData[TableIndex.Type],
      serviceType: rowData[TableIndex.ServiceType],
      supportLevels: [
        {
          startDate: rowData[TableIndex.StartDate]
            ? new Date(rowData[TableIndex.StartDate]).toISOString()
            : undefined,
          endDate: rowData[TableIndex.EndDate]
            ? new Date(rowData[TableIndex.EndDate]).toISOString()
            : undefined,
          serviceLevel,
          deliverables,
          status: rowData[TableIndex.Status],
        },
      ],
    };
  }

  // Close the browser instance
  async close(): Promise<void> {
    if (this.browser) await this.browser.close();
  }
}
