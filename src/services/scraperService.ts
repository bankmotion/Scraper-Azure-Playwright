import { Scraper } from "../scraper/Scraper";
import { Result } from "../types/Result";
import { config } from "../utils/config";

export class ScraperService {
  private scraper: Scraper;

  constructor() {
    this.scraper = new Scraper()
  }

  async getDetails(serialNrs: string[]): Promise<Result[]> {
    console.log("start getDeatils")
    await this.scraper.init()

    const results: Result[] = [];
    for (const serialNr of serialNrs) {
      const result = await this.scraper.getDetail(serialNr)
      results.push(result)
    }
    console.log({results})

    return results
  }
}