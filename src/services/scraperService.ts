import { Scraper } from "../scraper/Scraper";
import { Device, Result } from "../types/Result";
import { config } from "../utils/config";

export class ScraperService {
  private scraper: Scraper;

  constructor() {
    this.scraper = new Scraper()
  }

  async getDetails(serialNrs: string[]): Promise<Device[]> {
    console.log("start getDeatils")
    await this.scraper.init()

    const devices: Device[] = [];
    for (const serialNr of serialNrs) {
      console.log({serialNr})
      const device = await this.scraper.getDetail(serialNr)
      devices.push(device)
    }
    console.log({ devices })

    return devices
  }
}