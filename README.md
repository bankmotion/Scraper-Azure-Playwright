# Azure Durable Functions Deployment Guide

This guide walks you through the steps to deploy your Durable Function to Azure using the Azure CLI.

## 1. Log In to Azure

To log in to your Azure account, use the following command:

```bash
az login
```

Alternatively, you can use the device code login method:

```bash
az login --use-device-code
```

## 2. Create a Resource Group on Azure Portal

You need to create a resource group to organize your resources on Azure. You can create a resource group via the Azure Portal, or by using the following Azure CLI command:

```bash
az group create --name <ResourceGroupName> --location <Location>
```

Replace <ResourceGroupName> with the name of your resource group and <Location> with the desired Azure region (e.g., EastUS, WestEurope).

## 3. Create an Azure Storage Account

Azure Durable Functions require a Storage Account for storing function state, logs, and more. Create a storage account using the Azure Portal or the following command:

```bash
az storage account create --name <StorageAccountName> --resource-group <ResourceGroupName> --location <Location> --sku Standard_LRS
```

Replace <StorageAccountName> with a unique storage account name.

## 4. Create a Function App
A Function App is the hosting environment for your Azure Functions. To create a new Function App, run the following Azure CLI command:

```bash
az functionapp create --resource-group <ResourceGroupName> --consumption-plan-location <Location> --runtime <RuntimeStack> --runtime-version <Version> --functions-version 4 --name <FunctionAppName> --storage-account <StorageAccountName>
```

eplace the following placeholders:
<ResourceGroupName>: The name of your Azure resource group.
<Location>: The location (region) for your Function App (e.g., EastUS).
<RuntimeStack>: The runtime stack for your function app, such as dotnet, node, python, or java.
<Version>: The runtime version (e.g., 3, 4).
<FunctionAppName>: A unique name for your Function App.
<StorageAccountName>: The name of the storage account created earlier.

## 5. Deploy Your Code
After setting up the Function App, deploy your Durable Function code to Azure. You can do this using the Azure CLI in your project directory by running:

```bash
func azure functionapp publish <FunctionAppName>
```

This will publish your Durable Function code to the Function App.

## Successful Deployment Output

After a successful deployment, you will see output similar to this:

```bash
[2024-11-22T15:07:13.470Z] The deployment was successful!
Functions in <FunctionAppName>:
    closeScraperService - [activityTrigger]
    durableScraper - [activityTrigger]
    durableScraperHttpStart - [httpTrigger]
        Invoke URL: https://<FunctionAppName>.azurewebsites.net/api/orchestrators/{orchestratorname}
    durableScraperOrchestrator - [orchestrationTrigger]
    initScraperService - [activityTrigger]
```

This confirms that your functions were deployed successfully and are ready to handle requests.

## Invoke URL

The URL to invoke the orchestrator function will be:


```bash
https://<FunctionAppName>.azurewebsites.net/api/orchestrators/{orchestratorname}
```

Replace <FunctionAppName> with your actual function app name and {orchestratorname} with the name of the orchestrator.