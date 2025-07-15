# Dynamic Credential Management

The AvaTax MCP Server now supports dynamic credential management, allowing you to switch between different accounts, environments, and company codes without restarting Claude Desktop.

## Features

### 1. Secure Credential Storage
Credentials are now stored in a separate JSON file outside of Claude's configuration, providing better security and flexibility.

**Credentials File Location**: `~/.avatax/credentials.json`

### 2. Session-Based Management
You can now:
- Switch between pre-configured accounts
- Set temporary credentials for a session
- Change default company codes dynamically
- Switch between sandbox and production environments

## Setup

### 1. Update Claude Configuration
Your `claude_desktop_config.json` should only contain:
```json
{
  "mcpServers": {
    "avatax": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "AVATAX_CREDENTIALS_PATH": "C:\\Users\\username\\.avatax\\credentials.json",
        "AVATAX_APP_NAME": "AvaTax-MCP-Server",
        "AVATAX_TIMEOUT": "30000"
      }
    }
  }
}
```

### 2. Create Credentials File
Create `~/.avatax/credentials.json`:
```json
{
  "accounts": {
    "sandbox": {
      "accountId": "your_sandbox_account_id",
      "licenseKey": "your_sandbox_license_key",
      "environment": "sandbox",
      "defaultCompanyCode": ""
    },
    "production": {
      "accountId": "your_prod_account_id",
      "licenseKey": "your_prod_license_key",
      "environment": "production",
      "defaultCompanyCode": "PROD_COMPANY"
    }
  },
  "defaultAccount": "sandbox"
}
```

## Available Tools

### Account Management

#### `list_accounts`
Lists all pre-configured accounts and shows which one is currently active.

#### `switch_account`
Switch to a different pre-configured account.
```
Parameters:
- accountName: Name of the account to switch to (e.g., "sandbox", "production")
```

#### `set_credentials`
Set temporary credentials for the current session (not saved to file).
```
Parameters:
- accountId: AvaTax account ID
- licenseKey: AvaTax license key
- environment: "sandbox" or "production"
- companyCode: Optional default company code
```

### Company Management

#### `get_current_company`
Shows current account and company configuration.

#### `set_default_company`
Set the default company code for the current session.
```
Parameters:
- companyCode: Company code to use as default
```

## Usage Examples

### Switch to Production Environment
```
Use the switch_account tool to change to the production account
```

### Set Temporary Credentials
```
Use set_credentials with:
- accountId: "1234567890"
- licenseKey: "ABCD1234EFGH5678"
- environment: "sandbox"
- companyCode: "TEST_COMPANY"
```

### Change Default Company
```
Use set_default_company with companyCode: "NEW_COMPANY"
```

## Security Benefits

1. **Credentials Not in Claude Config**: Sensitive information is stored separately
2. **File Permissions**: You can set restrictive permissions on the credentials file
3. **Multiple Accounts**: Easy switching between different environments
4. **Session-Based**: Temporary credential changes don't affect stored configuration

## Fallback Support

The system still supports the original environment variable approach for backward compatibility:
- `AVATAX_ACCOUNT_ID`
- `AVATAX_LICENSE_KEY` 
- `AVATAX_ENVIRONMENT`
- `AVATAX_COMPANY_CODE`

If no credentials file is found, it will fall back to reading these environment variables.
