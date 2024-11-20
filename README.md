Log In to Azure:
az login
az login --use-device-code

Create a Resource Group:
az group create --name <ResourceGroupName> --location <Location>
Replace <ResourceGroupName> with your desired name and <Location> with the region (e.g., eastus).



3. Create an Azure Storage Account
Azure Durable Functions require a storage account.

az storage account create --name <StorageAccountName> --resource-group <ResourceGroupName> --location <Location> --sku Standard_LRS


4. Create a Function App
A Function App is the hosting environment for your Azure Functions.

az functionapp create --resource-group <ResourceGroupName> --consumption-plan-location <Location> --runtime <RuntimeStack> --runtime-version <Version> --functions-version 4 --name <FunctionAppName> --storage-account <StorageAccountName>

5. Deploy Your Code
Deploy your Durable Function code to Azure.
Deploy Using Azure CLI: In your project directory, run:
func azure functionapp publish <FunctionAppName>

6. Configure Application Settings
If your Durable Function requires environment variables:

az functionapp config appsettings set --name <FunctionAppName> --resource-group <ResourceGroupName> --settings "KEY1=VALUE1" "KEY2=VALUE2"




az functionapp create --resource-group HPE --consumption-plan-location eastus --runtime node --runtime-version 20 --functions-version 4 --name HPE-Scraping --storage-account hpestorageacc
