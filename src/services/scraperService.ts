import { Scraper } from "../scraper/Scraper";
import { Device, Result } from "../types/Result";
import { config } from "../utils/config";

export class ScraperService {
  private scraper: Scraper;

  constructor() {
    console.log("start getDeatils");
    this.scraper = new Scraper();
  }

  async init() {
    await this.scraper.init();
  }

  async getDetail(serialNr: string): Promise<Device> {
    const device = await this.scraper.getDetail(serialNr);

    return device;
  }
}
