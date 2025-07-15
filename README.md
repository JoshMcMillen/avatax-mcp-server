# AvaTax MCP Server

A Model Context Protocol (MCP) server that provides AvaTax API integration for tax calculation, address validation, and transaction management. This server connects Claude Desktop to the AvaTax API for seamless tax calculations in your conversations.

## 🎯 Easy Installation

Download the latest installer from [GitHub Releases](https://github.com/JoshMcMillen/avatax-mcp-server/releases) and run the setup wizard. The installer includes a modern desktop application for easy configuration and management.

## 🖥️ Desktop Application Features

- **Modern Tabbed Interface**: Welcome screen, configuration, server control, and documentation
- **Easy Configuration**: Visual forms for AvaTax credentials with connection testing
- **Server Management**: Start/stop the MCP server with real-time status
- **Integrated Documentation**: Complete setup guide and Claude Desktop configuration
- **Professional Installation**: Windows installer with upgrade detection and clean uninstall

## 🚀 Quick Setup

1. **Download** the installer from [Releases](https://github.com/JoshMcMillen/avatax-mcp-server/releases)
2. **Run** the installer and launch the application
3. **Configure** your AvaTax credentials in the Configuration tab
4. **Test** your connection to ensure everything works
5. **Start** the MCP server from the Server Control tab
6. **Add** to Claude Desktop using the provided configuration

### 🎯 Automatic Launch

The AvaTax MCP Server makes setup as easy as possible:

- **Fresh Installation**: The app automatically launches after installation completes
- **Upgrades**: After upgrading, the app starts automatically so you can continue working
- **Smart Configuration**: Your Claude Desktop configuration is generated automatically when you save credentials
- **Visual Interface**: No command-line work required - everything is done through the desktop app

The app will start automatically after installation, and you can navigate to whichever tab you need!

## Features

- **Tax Calculation**: Calculate sales tax, VAT, and other transaction taxes with line-item detail
- **Address Validation**: Validate and normalize addresses for accurate tax calculations  
- **Comprehensive Transaction Management**: Full transaction lifecycle management with commit, void, adjust, and audit capabilities
- **Document Type Intelligence**: Smart handling of temporary estimates vs permanent tax records
- **Multi-Environment Support**: Switch between sandbox and production environments
- **Dynamic Credential Management**: Switch between accounts and companies without restarting
- **Nexus Management**: Declare and manage tax nexus for multiple jurisdictions
- **Comprehensive Error Handling**: Detailed error messages for troubleshooting
- **Secure Local Storage**: Credentials stored safely on your computer
- **Smart build script with version management**: Easily manage and patch versions

## Available Tools

### 🧮 **Tax Calculation**

#### `calculate_tax`
Calculate tax for transactions with support for temporary estimates and permanent records.

**Key Features:**
- **SalesOrder**: Temporary estimates (quotes, shopping cart) - not saved to tax history
- **SalesInvoice**: Permanent transactions (final sales) - saved but uncommitted
- **Smart document type selection** based on use case

**Parameters:**
- `type`: Document type (SalesOrder for estimates, SalesInvoice for final transactions)
- `companyCode`: Your company code in AvaTax (optional if configured globally)  
- `date`: Transaction date (YYYY-MM-DD)
- `customerCode`: Customer identifier
- `lines`: Array of line items with quantities, amounts, and tax codes
- `shipFrom`/`shipTo`: Addresses for tax jurisdiction determination

#### `create_transaction`
Create committed transactions ready for tax reporting and compliance.

**Best For:** Final invoices, completed sales that need immediate tax reporting

### 📋 **Transaction Management**

#### `list_transactions`
Find and list transactions with powerful filtering capabilities.

**Important:** Must include date filter or defaults to last 30 days.

#### `get_transaction`
Retrieve detailed information about a specific transaction.

#### `commit_transaction`
Commit saved transactions to make them available for tax reporting.

#### `void_transaction`
Cancel transactions permanently (useful for cancelled orders).

#### `adjust_transaction`
Correct committed transactions by creating new versions with updated data.

#### `uncommit_transaction`
Remove committed transactions from tax reporting to allow modifications.

#### `change_transaction_code`
Rename transaction codes before commitment.

#### `verify_transaction`
Validate transaction data and ensure compliance with tax rules.

#### `get_transaction_audit`
Get detailed audit information including creation details and processing time.

### 📍 **Address Validation**

#### `validate_address`
Validate and normalize addresses worldwide for accurate tax calculations.

**Parameters:**
- `line1`: Street address
- `city`: City name  
- `region`: State/province code
- `postalCode`: ZIP/postal code
- `country`: Country code (ISO 3166-1 alpha-2)

### 🏢 **Company Management**

#### `get_companies`
Get a list of companies in your AvaTax account with optional filtering.

### 🌍 **Nexus Management**

#### `get_company_nexus`
List all nexus declarations for a company.

#### `create_nexus`
Declare nexus in new tax jurisdictions.

#### `declare_nexus_by_address`
Automatically create nexus declarations based on business addresses.

#### `update_nexus` / `delete_nexus`
Manage existing nexus declarations.

### 🏷️ **Tax Code Management**

#### `get_system_tax_codes`
Retrieve Avalara's standard tax codes for common products and services.

#### `get_tax_code_types`
Get broad categories of tax codes (Physical, Digital, Services, Non-taxable).

#### `get_company_tax_codes`
List custom tax codes created for your company.

#### `get_tax_code`
Get detailed information about a specific tax code.

#### `create_tax_code`
Create custom tax codes for specialized products or services.

#### `update_tax_code` / `delete_tax_code`
Manage existing company tax codes.

#### `query_all_tax_codes`
Search tax codes across all companies in your account.

**Key Features:**
- **System Tax Codes**: Pre-defined by Avalara for standard products
- **Custom Tax Codes**: Company-specific codes for unique requirements  
- **Tax Code Types**: P=Physical, D=Digital, S=Services, N=Non-taxable
- **Smart Search**: Filter by description, type, or activity status

### 📦 **Item Management**

*Full item management capabilities available - see [Item Documentation](docs/ITEMS.md) for complete details.*

### ⚙️ **System & Credentials**

#### `ping_service`
Test connectivity to AvaTax service and verify credentials.

#### `set_credentials` / `switch_account`
Manage multiple AvaTax accounts and environments.

#### `set_default_company` / `get_current_company`
Switch between companies dynamically.

## Configuration

The desktop application provides an intuitive interface to configure your AvaTax credentials:

| Setting | Required | Description | Example |
|---------|----------|-------------|---------|
| **Account ID** | ✅ | Your AvaTax account ID | `1234567890` |
| **License Key** | ✅ | Your AvaTax license key | `1A2B3C4D5E6F7G8H` |
| **Company Code** | ❌ | Your AvaTax company code (optional - leave blank for interactive selection) | `DEFAULT` |
| **Environment** | ✅ | Environment (`sandbox` or `production`) | `sandbox` |
| **Application Name** | ❌ | Application identifier | `AvaTax-MCP-Server` |
| **API Timeout** | ❌ | Timeout in milliseconds | `30000` |

## Getting AvaTax Credentials

1. **Sign up** for an AvaTax account at [avalara.com](https://www.avalara.com/)
2. **Access the AvaTax portal** and navigate to Settings > License Keys
3. **Copy your Account ID and License Key**
4. **Optionally find your Company Code** under Companies > Company Settings (or leave blank for interactive selection)
5. **Start with sandbox** environment for testing

### Company Code Behavior

- **If specified**: All tax calculations will use this company by default
- **If left blank**: Claude will ask which company to use and provide a searchable list when needed
- **Use `get_companies` tool**: Get a list of available companies with optional search filtering

> **Note**: The company code identifies which company entity transactions belong to in your AvaTax account.

## Claude Desktop Configuration

The application provides the exact configuration needed for Claude Desktop. Add this to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "avatax": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\AppData\\Local\\Programs\\AvaTax MCP Server\\resources\\app.asar\\dist\\index.js"],
      "env": {
        "AVATAX_ACCOUNT_ID": "your_account_id",
        "AVATAX_LICENSE_KEY": "your_license_key", 
        "AVATAX_COMPANY_CODE": "your_company_code",
        "AVATAX_ENVIRONMENT": "sandbox"
      }
    }
  }
}
```

### Finding claude_desktop_config.json

The configuration file is located at:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Example Usage

Once connected to Claude Desktop, you can leverage the full power of AvaTax through natural language:

### 🧮 **Tax Calculations**
- "Calculate sales tax for a $100 software license from Washington to California"
- "Give me a tax estimate for this shopping cart: 3 books at $20 each, shipped to Texas"
- "What's the tax on a $500 consulting service from NY to CA?"

### 📍 **Address Validation** 
- "Validate this shipping address: 123 Main St, Seattle, WA 98101"
- "Normalize this address for tax purposes: 1600 Pennsylvania Ave, Washington DC"

### 📋 **Transaction Management**
- "Create a committed sales transaction for invoice #INV-2024-001"
- "Show me all transactions from last month that need to be committed"
- "Void transaction #ORDER-12345 - it was cancelled"
- "Adjust committed transaction #INV-001 to change the amount to $150"
- "Find all uncommitted transactions for company ACME"

### 🏢 **Company & Account Management**
- "Switch to my production AvaTax account"
- "Show me all companies in my AvaTax account"  
- "Set the default company to 'RETAIL-WEST'"
- "What's my current company configuration?"

### 🌍 **Nexus Management**
- "Declare nexus for our new office in Austin, Texas" 
- "Show me all jurisdictions where we have nexus"
- "Remove nexus for California - we no longer have presence there"

### 📊 **Compliance & Reporting**
- "Get audit details for transaction #INV-2024-100"
- "Verify the tax calculation for order #12345"
- "Show me transaction history for customer ABC Corp"

### 💡 **Smart Context Understanding**
Claude understands the context and will:
- Choose the right document type (SalesOrder for estimates, SalesInvoice for final transactions)
- Ask for missing required information
- Suggest appropriate next steps
- Provide detailed explanations of tax calculations
- Help with transaction workflow decisions

### ⚡ **Workflow Examples**

**E-commerce Checkout Flow:**
```
User: "Customer is checking out with a $200 item, shipping from WA to CA"
Claude: Uses calculate_tax with SalesOrder type for instant estimate

User: "They completed the purchase"  
Claude: Uses create_transaction with SalesInvoice type for committed record
```

**Monthly Transaction Review:**
```
User: "Show me last month's uncommitted transactions"
Claude: Uses list_transactions with date filter and status filter

User: "Commit all the valid ones"
Claude: Uses commit_transaction for each valid transaction
```

## Development

### Local Development

If you want to modify or contribute to this project:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JoshMcMillen/avatax-mcp-server.git
   cd avatax-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

4. **Run the MCP server directly**:
   ```bash
   npm start
   ```

5. **Run the Electron app for development**:
   ```bash
   npm run electron:dev
   ```

## 🛠️ Development Setup

For developers who want to build and modify the AvaTax MCP Server:

### Prerequisites
- Node.js 16+ 
- Windows (for code signing)
- AvaTax Developer Account

### First-Time Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your AvaTax credentials
4. Run the setup script: `.\scripts\setup.ps1 -SetupCertificate`
5. Build the project: `npm run smart-build`

### Certificate Configuration (One-Time)
The setup script will:
- Install required PowerShell modules
- Securely store your code signing certificate password
- Enable automatic builds without manual password entry

```powershell
# Set up certificate password (run once)
.\scripts\setup.ps1 -SetupCertificate

# Check setup status
.\scripts\setup.ps1 -ShowStatus

# Remove stored password if needed
.\scripts\setup.ps1 -RemoveCertificate
```

### Building Releases
After initial setup, building is fully automated:

```powershell
# Interactive build with version selection
npm run smart-build

# Quick version bumps
npm run release:patch   # 1.0.4 → 1.0.5
npm run release:minor   # 1.0.4 → 1.1.0
npm run release:major   # 1.0.4 → 2.0.0
```

The build system will:
- Automatically handle certificate password from secure storage
- Build TypeScript and Electron application
- Create signed Windows installer
- Optionally create GitHub release

## Build Instructions
Run `scripts/smart-build.ps1` and follow prompts to select version type, including patching an existing version.

### Project Structure

```
avatax-mcp-server/
├── src/                 # TypeScript source code
├── electron/            # Electron desktop application
├── scripts/             # Build and release scripts
├── dist/                # Compiled JavaScript
└── release/             # Built installers (ignored in git)
```

## API Reference

This server uses the official AvaTax REST API v2. For detailed API documentation, visit:
- [AvaTax API Documentation](https://developer.avalara.com/api-reference/avatax/rest/v2/)
- [AvaTax Developer Guide](https://developer.avalara.com/avatax/dev-guide/)

## Troubleshooting

### Common Issues

- **"Cannot find module 'electron-store'"**: This is resolved in v1.0.1+
- **Server won't start**: Check your AvaTax credentials in the Configuration tab
- **Connection timeout**: Verify your internet connection and AvaTax environment setting
- **Invalid credentials**: Use the "Test Connection" button to verify your AvaTax credentials

### Support Resources

- **AvaTax API Issues**: Contact [Avalara Support](https://community.avalara.com/)
- **Application Issues**: Open an issue on [GitHub](https://github.com/JoshMcMillen/avatax-mcp-server/issues)
- **Documentation**: Check the [AvaTax Developer Portal](https://developer.avalara.com/)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Note**: This is an unofficial integration. AvaTax is a trademark of Avalara, Inc.