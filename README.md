 This repository is for practicing deployment to Azure App Service. It starts with a simple static web app and will later include a Node.js Express API for CI/CD practice.

 ## Project Structure
 ```
 AzureDev-AppService/
 ├── public/index.html            # Static files (e.g., index.html)
 ├── src/                # Source code for Node.js/Express API (to be added later)
 ├── .github/            # GitHub Actions workflows
 │   └── workflows/
 ├── README.md
 ├── package-lock.json
 ├── package.json
 └── server.js
 ```

 ## Initial Setup
 $ mkdir -p public src .github/workflows
 - public/ — holds static files like index.html.

 - src/ — will later hold your Express.js API logic.

 - server.js — serves the frontend and (soon) backend content.

 - package.json — defines project and dependencies.

### 🌐 Deploy to Azure App Service (via CLI)
🔧 1. Create Resource Group (if not already created)

- $ az group create \
  --name <Resource group name> \
  --location <location>

⚙️ 2. Create App Service Plan

- $ az appservice plan create \
  --name ASP-<Resource group name>-DevAppService \
  --resource-group <Resource group name> \
  --location <location> \
  --sku F1  # Free tier for testing

🌍 3. Create Web App
- $ az webapp create \
  --name <App service name> \
  --resource-group <Resource group name> \
  --plan ASP-<Resource group name>-DevAppService \
  --runtime "NODE|16-lts"

🚀 4. Deploy From Local Machine (Optional)
-$ cd path/to/AzureDev-AppService
-$ az webapp up --name <App service name> --resource-group <Resource group name> --runtime "NODE|16-lts"


###  🔁 GitHub Actions CI/CD
Whenever you push to main, GitHub Actions automatically:

Installs dependencies (npm install)

Zips your project (including server.js, public/, etc.)

Deploys to Azure Web App

###  ✅ Prerequisites
Set these secrets in your GitHub repo:

AZURE_CREDENTIALS – from a service principal

AZURE_WEBAPP_PUBLISH_PROFILE – from Azure Portal > App Service > "Get Publish Profile"


###  🛠️ Useful Azure Commands

Description	Command

Tail logs	$ az webapp log tail --name <App service name> --resource-group <Resource group name>
Restart app	$ az webapp restart --name <App service name> --resource-group <Resource group name>
View app	https://ailidevappservice.azurewebsites.net

