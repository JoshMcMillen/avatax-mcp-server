# AvaTax MCP Server

A Model Context Protocol (MCP) server that provides AvaTax API integration for tax calculation, address validation, and transaction management. This server can be used with Claude Desktop, VS Code Copilot, or any MCP-compatible client.

## 🚀 Quick Start with gitmcp.io

The easiest way to use this MCP server is through [gitmcp.io](https://gitmcp.io/), which instantly creates a remote MCP server from this GitHub repository.

1. **Go to [gitmcp.io](https://gitmcp.io/)**
2. **Enter this repository URL**: `https://github.com/yourusername/avatax-mcp-server`
3. **Set your environment variables**:
   - `AVATAX_ACCOUNT_ID`: Your AvaTax account ID
   - `AVATAX_LICENSE_KEY`: Your AvaTax license key
   - `AVATAX_ENVIRONMENT`: Set to `sandbox` for testing or `production` for live transactions
   - `AVATAX_COMPANY_CODE`: Your AvaTax company code (required for transactions)
4. **Copy the generated MCP server URL** and add it to your Claude Desktop configuration

## Features

- **Tax Calculation**: Calculate sales tax, VAT, and other transaction taxes
- **Address Validation**: Validate and normalize addresses for accurate tax calculations
- **Transaction Management**: Create committed transactions in AvaTax
- **Multi-Environment Support**: Switch between sandbox and production environments
- **Comprehensive Error Handling**: Detailed error messages for troubleshooting

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

## Environment Variables

When using gitmcp.io, set these environment variables:

> **Legend:** ✅ = Required, ❌ = Optional (uses default if not set; see below)
>
> **Defaults:**
> - `AVATAX_ENVIRONMENT`: Defaults to `sandbox`
> - `AVATAX_APP_NAME`: Defaults to `AvaTax-MCP-Server`
> - `AVATAX_TIMEOUT`: Defaults to `30000` (milliseconds)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AVATAX_ACCOUNT_ID` | ✅ | Your AvaTax account ID | `1234567890` |
| `AVATAX_LICENSE_KEY` | ✅ | Your AvaTax license key | `1A2B3C4D5E6F7G8H` |
| `AVATAX_COMPANY_CODE` | ✅ | Your AvaTax company code | `DEFAULT` |
| `AVATAX_ENVIRONMENT` | ❌ | Environment (`sandbox` or `production`). **Default:** `sandbox` | `sandbox` |
| `AVATAX_APP_NAME` | ❌ | Application name. **Default:** `AvaTax-MCP-Server` | `AvaTax-MCP-Server` |
| `AVATAX_TIMEOUT` | ❌ | API timeout in milliseconds. **Default:** `30000` | `30000` |

## Getting AvaTax Credentials

1. **Sign up** for an AvaTax account at [avalara.com](https://www.avalara.com/)
2. **Get sandbox credentials** from the AvaTax Developer Portal
3. **Find your company code** in the AvaTax portal under Companies > Company Settings
4. **For production**: Contact Avalara sales for a production account

> **Note**: The company code is essential for transactions. It identifies which company entity the transaction belongs to in your AvaTax account.

## Building for gitmcp.io

This repository includes built files in the `dist/` directory for gitmcp.io compatibility. If you make changes to the source code:

```bash
npm install
npm run build
git add dist/
git commit -m "Update build files"
git push
```

The build files are included in the repository so gitmcp.io can immediately use the server without needing to compile TypeScript.

## Local Development

If you want to run this server locally:

## Local Development

If you want to run this server locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/avatax-mcp-server.git
   cd avatax-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your AvaTax credentials
   ```

4. **Build and start**:
   ```bash
   npm run build
   npm start
   ```

## Claude Desktop Configuration

To use this MCP server with Claude Desktop, add it to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "avatax": {
      "command": "node",
      "args": ["/path/to/avatax-mcp-server/dist/index.js"],
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

## Example Usage

Once connected, you can ask Claude to:

- "Calculate sales tax for a $100 item shipped from California to New York"
- "Validate this address: 123 Main St, Seattle, WA 98101"
- "Create a sales transaction for my latest order"

## API Reference

This server uses the official AvaTax REST API v2. For detailed API documentation, visit:
- [AvaTax API Documentation](https://developer.avalara.com/api-reference/avatax/rest/v2/)
- [AvaTax Developer Guide](https://developer.avalara.com/avatax/dev-guide/)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

- **AvaTax API Issues**: Contact [Avalara Support](https://community.avalara.com/)
- **MCP Server Issues**: Open an issue on this repository
- **Documentation**: Check the [AvaTax Developer Portal](https://developer.avalara.com/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Note**: This is an unofficial integration. AvaTax is a trademark of Avalara, Inc.