import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ScraperService } from "../services/scraperService";

interface RequestBody {
  serialNrs: string[]
}

const scraperService = new ScraperService()

export async function scraperTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  let serialNrs: string[] = []

  // Get post request
  if (request.method === "POST") {
    try {
      const requestBody = await request.json();
      console.log({ requestBody })
      serialNrs = (requestBody as RequestBody).serialNrs || []
    } catch (err) {
      let errMsg = '';
      if (err instanceof Error) {
        errMsg = err.message
      } else {
        errMsg = "Unknown error"
      }
      return {
        status: 500,
        body: JSON.stringify({ error: `Internal server error: ${err}` })
      }
    }
  } else {
    return {
      status: 405,
      body: JSON.stringify({ error: "Method not allowed. Please use POST" })
    }
  }

  console.log({ serialNrs })

  if (!serialNrs || serialNrs.length === 0) {
    return {
      status: 400,
      body: JSON.stringify({ error: "No serial numbers provided" })
    }
  }

  try {
    const devices = await scraperService.getDetails(serialNrs)

    return {
      status: 200,
      body: JSON.stringify({
        status: true,
        devices
      })
    }
  } catch (err) {
    let errMsg = '';
    if (err instanceof Error) {
      errMsg = err.message
    } else {
      errMsg = 'Unknown error'
    }
    return {
      status: 500,
      body: JSON.stringify({ error: `Internal server error: ${errMsg}` })
    }
  }
};

app.http('scraperTrigger', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: scraperTrigger
});
