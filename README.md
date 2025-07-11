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

## Features

- **Tax Calculation**: Calculate sales tax, VAT, and other transaction taxes with line-item detail
- **Address Validation**: Validate and normalize addresses for accurate tax calculations  
- **Transaction Management**: Create committed transactions directly in AvaTax
- **Multi-Environment Support**: Switch between sandbox and production environments
- **Comprehensive Error Handling**: Detailed error messages for troubleshooting
- **Secure Local Storage**: Credentials stored safely on your computer

## Available Tools

### `calculate_tax`
Calculate tax for a transaction with detailed line items.

**Parameters:**
- `type`: Transaction type (SalesInvoice, PurchaseInvoice, etc.)
- `companyCode`: Your company code in AvaTax
- `date`: Transaction date (YYYY-MM-DD)
- `customerCode`: Customer identifier
- `lines`: Array of line items with quantities, amounts, and addresses

### `validate_address`
Validate and normalize an address.

**Parameters:**
- `line1`: Street address
- `city`: City name
- `region`: State/province code
- `postalCode`: ZIP/postal code
- `country`: Country code (ISO 3166-1 alpha-2)

### `create_transaction`
Create a committed transaction in AvaTax.

**Parameters:**
- Same as `calculate_tax` plus:
- `commit`: Whether to commit the transaction (default: true)

## Configuration

The desktop application provides an intuitive interface to configure your AvaTax credentials:

| Setting | Required | Description | Example |
|---------|----------|-------------|---------|
| **Account ID** | ✅ | Your AvaTax account ID | `1234567890` |
| **License Key** | ✅ | Your AvaTax license key | `1A2B3C4D5E6F7G8H` |
| **Company Code** | ✅ | Your AvaTax company code | `DEFAULT` |
| **Environment** | ✅ | Environment (`sandbox` or `production`) | `sandbox` |
| **Application Name** | ❌ | Application identifier | `AvaTax-MCP-Server` |
| **API Timeout** | ❌ | Timeout in milliseconds | `30000` |

## Getting AvaTax Credentials

1. **Sign up** for an AvaTax account at [avalara.com](https://www.avalara.com/)
2. **Access the AvaTax portal** and navigate to Settings > License Keys
3. **Copy your Account ID and License Key**
4. **Find your Company Code** under Companies > Company Settings
5. **Start with sandbox** environment for testing

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

Once connected to Claude Desktop, you can ask Claude to:

- "Calculate sales tax for a $100 item shipped from California to New York"
- "Validate this address: 123 Main St, Seattle, WA 98101"
- "Create a committed sales transaction for order #12345"
- "What's the tax rate for Austin, Texas?"
- "Help me calculate taxes for my online store order"

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

### Building Releases

This project includes automated release scripts:

1. **From VS Code**: Use Tasks → "Build and Release"
2. **From terminal**: `scripts\create-release.ps1 -Version "1.0.2" -ReleaseNotes "Your changes"`
3. **Automated**: Builds, creates GitHub release, and uploads installer

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