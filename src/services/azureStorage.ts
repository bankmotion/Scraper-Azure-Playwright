import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import * as fs from "fs";

import { config } from "../utils/config";
import { streamToBuffer } from "../utils/utils";
import path = require("path");

// function to download Browsers from Azure
export const downloadBrowserFromAzure = async (): Promise<void> => {
  const blobSerivceClient = BlobServiceClient.fromConnectionString(
    config.azureStoConnectionStr
  );
  const containerClient = blobSerivceClient.getContainerClient(
    config.blobContainerName
  );

  if (!fs.existsSync(config.localBrowserPath)) {
    fs.mkdirSync(config.localBrowserPath);
  }

  for await (const blob of containerClient.listBlobsFlat()) {
    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
    const downloadFilePath = path.join(config.localBrowserPath, blob.name);
    await blockBlobClient.downloadToFile(downloadFilePath);
    console.log(`Downloaded ${blob.name} to ${downloadFilePath}`);
  }
};

// funciton to upload Browsers to Azure
const uploadBrowserToAzure = async (filePath: string): Promise<void> => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    config.azureStoConnectionStr
  );
  const containerClient = blobServiceClient.getContainerClient(
    config.blobContainerName
  );
  await containerClient.createIfNotExists();
  console.log(`Uploading browser files from ${config.browserPath}`);

  const files = fs.readFileSync(config.browserPath);
  for (const file of files) {
    const filePath = path.join(config.browserPath, file.toString());
    const blockBlobClient = containerClient.getBlockBlobClient(file.toString());
    await blockBlobClient.uploadFile(filePath);
    console.log(`Uplaoded ${file} to Azure Blob Storage`);
  }

  console.log(`All browser files uploaded successfully`);
};
