import { Page } from "playwright-core";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Utility fuciton for adding random pauses
export const randomPause = async (
  page: Page,
  min: number = 1.5,
  max: number = 2.5
): Promise<void> => {
  const delay =
    Math.floor(Math.random() * (max * 1000 - min * 1000 + 1)) + min * 1000;
  await page.waitForTimeout(delay);
  return;
};

// function to convert stream to bufffer
export const streamToBuffer = async (
  readableStream: NodeJS.ReadableStream | null
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  if (!readableStream) return Buffer.from([]);
  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const withTimeout = async <T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("TimeoutError")), timeout);
  });
  return Promise.race([fn(), timeoutPromise]);
};
