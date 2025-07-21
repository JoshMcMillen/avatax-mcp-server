# AvaTax MCP Server - Technical Guide

## Overview

The AvaTax MCP Server is a Model Context Protocol (MCP) server that bridges the gap between Claude Desktop and Avalara's AvaTax API. It provides tax calculation, address validation, transaction management, and nexus declaration capabilities through a user-friendly desktop application.

**What is MCP?** Model Context Protocol is Anthropic's standard for connecting AI assistants (like Claude) to external tools and data sources. This server makes AvaTax functionality available directly within Claude conversations.

## Project Architecture

### Core Components

```
avatax-mcp-server/
├── src/                    # TypeScript source code
│   ├── avatax/            # AvaTax API integration layer
│   ├── tools/             # MCP tool definitions and handlers
│   ├── types/             # TypeScript type definitions
│   └── index.ts           # Main MCP server entry point
├── electron/              # Desktop application
│   ├── main.js            # Electron main process
│   ├── preload.js         # Security bridge between main and renderer
│   └── renderer/          # HTML/CSS/JS for the user interface
├── scripts/               # Build and deployment automation
├── docs/                  # Detailed documentation
├── tests/                 # Test files and examples
└── release/               # Built installers and executables
```

## Key Files and Their Purpose

### 🔧 Source Code (`src/`)

#### `src/index.ts` - MCP Server Entry Point
- **Purpose**: Main entry point for the MCP server
- **Function**: Sets up the Model Context Protocol server, initializes AvaTax client, and handles tool requests from Claude
- **Key Features**:
  - Registers available tools (tax calculation, address validation, etc.)
  - Routes tool calls to appropriate handlers
  - Manages error handling and responses

#### `src/avatax/client.ts` - AvaTax API Client
- **Purpose**: Core AvaTax API integration
- **Function**: Handles all communication with Avalara's REST API
- **Key Features**:
  - Credential management and authentication
  - Company and environment switching
  - Request/response handling with proper error management
  - Smart caching for company ID lookups
  - Support for both sandbox and production environments

#### `src/avatax/config.ts` - Configuration Management
- **Purpose**: Manages AvaTax configuration and credentials
- **Function**: Loads and validates configuration from stored credentials
- **Key Features**:
  - Secure credential storage
  - Environment detection (sandbox vs production)
  - Default company code management

#### `src/tools/` - MCP Tool Layer
- **`definitions.ts`**: Defines all available tools for Claude (tax calculation, address validation, etc.)
- **`handlers.ts`**: Implements the actual logic for each tool
- **`index.ts`**: Exports tool-related functionality

### 🖥️ Desktop Application (`electron/`)

#### `electron/main.js` - Application Controller
- **Purpose**: Controls the desktop application lifecycle
- **Function**: Manages windows, server processes, and user interactions
- **Key Features**:
  - Server start/stop functionality
  - Credential storage and management
  - Auto-updater integration
  - System tray integration
  - Installation state detection

#### `electron/renderer/` - User Interface
- **Purpose**: Provides the visual interface for configuration and control
- **Function**: Tabbed interface for easy management
- **Tabs**:
  - **Welcome**: Introduction and getting started
  - **Configuration**: AvaTax credential setup and testing
  - **Server Control**: Start/stop MCP server with status monitoring
  - **Documentation**: Integrated help and setup guides

### 🛠️ Build System (`scripts/`)

#### `scripts/smart-build.ps1` - Intelligent Build Script
- **Purpose**: Automated building and releasing with version management
- **Function**: Handles TypeScript compilation, Electron building, and installer creation
- **Key Features**:
  - Automatic version bumping (patch, minor, major)
  - Code signing for Windows installers
  - Release artifact management
  - Git integration for tagging releases

#### `scripts/setup.ps1` - Development Setup
- **Purpose**: Sets up development environment
- **Function**: Installs dependencies and configures development tools

## Data Flow

### 1. User Interaction Flow
```
Claude Desktop → MCP Server → AvaTax API → Response → Claude
```

1. User asks Claude to calculate tax or validate address
2. Claude sends MCP tool request to the server
3. Server authenticates with AvaTax using stored credentials
4. Server makes API call to AvaTax
5. AvaTax returns tax calculation or validation result
6. Server formats response and sends back to Claude
7. Claude presents results to user in natural language

### 2. Configuration Flow
```
Desktop App → Electron Store → MCP Server → AvaTax API
```

1. User enters credentials in desktop app
2. App tests connection to AvaTax
3. Credentials stored securely in Electron Store
4. MCP server loads credentials on startup
5. Server uses credentials for all API calls

## Key Concepts

### Company Codes vs Company IDs
- **Company Code**: Human-readable string identifier (e.g., "ACME-CORP")
- **Company ID**: Numeric identifier used internally by AvaTax
- The client automatically handles conversion between these as needed

### Document Types
- **SalesOrder**: Temporary estimates (quotes, shopping cart calculations)
- **SalesInvoice**: Permanent transactions that need to be committed for tax reporting
- **PurchaseOrder**: Purchase transactions
- **ReturnInvoice**: Returns and refunds

### Transaction Lifecycle
1. **Create**: Calculate tax (temporary or permanent)
2. **Commit**: Finalize for tax reporting
3. **Adjust**: Modify committed transactions
4. **Void**: Cancel transactions
5. **Audit**: Track all changes

### Nexus Management
- **Nexus**: Legal obligation to collect tax in a jurisdiction
- Managed automatically when you have business presence
- Required before collecting taxes in any location

## Configuration Files

### `package.json`
- **Purpose**: Node.js project configuration
- **Key Sections**:
  - Dependencies (MCP SDK, Electron, TypeScript)
  - Build scripts and automation
  - Electron Builder configuration for installers

### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **Function**: Defines how TypeScript code is compiled to JavaScript

### `mcp.json`
- **Purpose**: MCP server configuration template
- **Function**: Provides Claude Desktop configuration template

## Environment Management

### Sandbox vs Production
- **Sandbox**: Test environment for development and testing
- **Production**: Live environment for real tax calculations
- Credentials and URLs differ between environments
- Switch easily through the desktop app

### Credential Storage
- Stored securely using Electron Store
- Encrypted and isolated per user account
- Multiple account profiles supported
- No sensitive data in source code

## Error Handling

### API Errors
- Comprehensive error parsing from AvaTax API
- User-friendly error messages
- Rate limiting detection and guidance
- Authentication failure detection

### Network Issues
- Timeout handling
- Retry logic for transient failures
- Connection testing utilities

## Security Features

### Credential Protection
- No hardcoded credentials in source code
- Secure local storage using OS-level encryption
- Credentials never transmitted to unauthorized endpoints

### Code Signing
- Windows installers are code-signed
- Prevents tampering and ensures authenticity
- Certificate managed through build process

## Development Workflow

### Building the Project
```bash
# Development build
npm run build

# Watch mode for development
npm run build:watch

# Create installer
npm run smart-build
```

### Version Management
```bash
# Patch version (bug fixes)
npm run release:patch

# Minor version (new features)
npm run release:minor

# Major version (breaking changes)
npm run release:major
```

### Testing
- Use test files in `/tests/` directory
- Test both sandbox and production environments
- Validate all major tax calculation scenarios

## Troubleshooting

### Common Issues

#### "Company code is required" Error
- **Cause**: No default company set or invalid company code
- **Solution**: Set default company in desktop app or use `get_companies` tool

#### Authentication Failures
- **Cause**: Invalid Account ID or License Key
- **Solution**: Verify credentials in AvaTax Admin Console and re-enter in desktop app

#### Connection Timeouts
- **Cause**: Network issues or AvaTax service problems
- **Solution**: Check internet connection and AvaTax service status

#### Server Won't Start
- **Cause**: Port conflicts or missing dependencies
- **Solution**: Check that no other MCP servers are running on the same port

### Log Files
- Electron logs: Available through desktop app
- MCP server logs: Console output when running in development mode
- AvaTax API logs: Captured in error responses

## File Locations

### Windows
- **Installation**: `C:\Program Files\AvaTax MCP Server\`
- **User Data**: `%APPDATA%\avatax-mcp-server\`
- **Credentials**: Stored in Electron Store (encrypted)

### Configuration Templates
- Claude Desktop config automatically generated
- MCP server configuration in `mcp.json`

## Extending the Server

### Adding New Tools
1. Define tool schema in `src/tools/definitions.ts`
2. Implement handler in `src/tools/handlers.ts`
3. Add AvaTax API method to `src/avatax/client.ts` if needed
4. Update documentation

### API Integration
- Follow existing patterns in `client.ts`
- Handle both company code and company ID URL patterns
- Implement proper error handling
- Add parameter validation

## Support and Documentation

### Built-in Documentation
- Desktop app includes comprehensive setup guides
- Examples and tutorials in `/docs/` directory
- API reference documentation

### External Resources
- [AvaTax API Documentation](https://developer.avalara.com/api-reference/avatax/rest/v2/)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Electron Documentation](https://www.electronjs.org/docs)

## Maintenance

### Regular Updates
- Keep dependencies updated for security
- Monitor AvaTax API changes
- Update MCP SDK when new versions are available

### Backup Considerations
- Export company and credential configurations
- Document custom configurations
- Keep installer files for rollback capability

This guide provides the foundation for understanding and working with the AvaTax MCP Server. For specific implementation details, refer to the source code comments and the `/docs/` directory for additional technical documentation.
