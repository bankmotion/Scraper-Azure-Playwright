import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  InvocationContext,
} from "@azure/functions";
import * as df from "durable-functions";
import {
  ActivityHandler,
  OrchestrationContext,
  OrchestrationHandler,
} from "durable-functions";
import { ScraperService } from "../services/scraperService";

const activityName = "durableScraper";

const scraperService = new ScraperService();

const durableScraperOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
) {
  // Track start time
  const startTime = new Date().toISOString();
  const outputs = [];
  const serialNrs: string[] = context.df.getInput();

  // Initialize the scraper service(call activity only once at the start)
  yield context.df.callActivity("initScraperService", null);

  // Loop through each serialNrs and call the activity for each
  for (const serialNr of serialNrs) {
    outputs.push(yield context.df.callActivity(activityName, serialNr));
  }

  yield context.df.callActivity("closeScraperService", null);

  const endTime = new Date().toISOString();
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    status: "Completed",
    startTime,
    endTime,
    duration: duration / 1000,
    results: outputs,
  };
};
df.app.orchestration("durableScraperOrchestrator", durableScraperOrchestrator);

const durableScraper: ActivityHandler = async (serialNr: string) => {
  try {
    const device = await scraperService.getDetail(serialNr);
    return device;
  } catch (err) {
    throw new Error(`Error during scrapin: ${err.message}`);
  }
};
df.app.activity(activityName, { handler: durableScraper });

const initScraperService: df.ActivityHandler = async () => {
  console.log(`Initializing ScraperSerivce...`);
  await scraperService.init();
};
df.app.activity("initScraperService", { handler: initScraperService });

const closeBrowserService: df.ActivityHandler = async () => {
  await scraperService.closeBrowser();
};
df.app.activity("closeScraperService", { handler: closeBrowserService });

const durableScraperHttpStart: HttpHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponse> => {
  const client = df.getClient(context);
  const body: string = await request.text();
  const serialNrs: string[] = JSON.parse(body).serialNrs || [];

  const instanceId: string = await client.startNew(
    request.params.orchestratorName,
    { input: serialNrs }
  );

  context.log(`Started orchestration with ID = '${instanceId}'.`);

  return client.createCheckStatusResponse(request, instanceId);
};

app.http("durableScraperHttpStart", {
  route: "orchestrators/{orchestratorName}",
  extraInputs: [df.input.durableClient()],
  handler: durableScraperHttpStart,
});
