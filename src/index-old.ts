#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createAvaTaxConfig } from './avatax/config.js';
import AvaTaxClient from './avatax/client.js';
import { TOOL_DEFINITIONS } from './tools/definitions.js';
import { handleToolCall } from './tools/handlers.js';

const server = new Server(
  {
    name: 'avatax-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize AvaTax client
let avataxClient: AvaTaxClient;
try {
  const config = createAvaTaxConfig();
  avataxClient = new AvaTaxClient(config);
} catch (error) {
  console.error('Failed to initialize AvaTax client:', error);
  process.exit(1);
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'calculate_tax',
      description: 'Calculate tax for a transaction using AvaTax API',
      inputSchema: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            description: 'Transaction type (SalesOrder for calculations, SalesInvoice for committed transactions)',
            enum: ['SalesInvoice', 'PurchaseInvoice', 'ReturnInvoice', 'SalesOrder', 'PurchaseOrder', 'InventoryTransferOutbound', 'InventoryTransferInbound'],
            default: 'SalesOrder'
          },
          companyCode: { 
            type: 'string', 
            description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
          },
          date: { 
            type: 'string', 
            description: 'Transaction date (YYYY-MM-DD)' 
          },
          customerCode: { 
            type: 'string', 
            description: 'Customer identifier' 
          },
          shipFrom: {
            type: 'object',
            description: 'Ship from address',
            properties: {
              line1: { type: 'string' },
              city: { type: 'string' },
              region: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          shipTo: {
            type: 'object',
            description: 'Ship to address',
            properties: {
              line1: { type: 'string' },
              city: { type: 'string' },
              region: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          lines: {
            type: 'array',
            description: 'Transaction line items',
            items: {
              type: 'object',
              properties: {
                number: { type: 'string', description: 'Line number' },
                quantity: { type: 'number', description: 'Quantity' },
                amount: { type: 'number', description: 'Line amount' },
                itemCode: { type: 'string', description: 'Item/product code' },
                description: { type: 'string', description: 'Line description' },
                taxCode: { type: 'string', description: 'Tax code (optional)' }
              },
              required: ['quantity', 'amount']
            }
          }
        },
        required: ['date', 'customerCode', 'lines']
      }
    },
    {
      name: 'validate_address',
      description: 'Validate and normalize an address using AvaTax',
      inputSchema: {
        type: 'object',
        properties: {
          line1: { type: 'string', description: 'Street address line 1' },
          line2: { type: 'string', description: 'Street address line 2 (optional)' },
          line3: { type: 'string', description: 'Street address line 3 (optional)' },
          city: { type: 'string', description: 'City name' },
          region: { type: 'string', description: 'State/Province/Region code' },
          postalCode: { type: 'string', description: 'Postal/ZIP code' },
          country: { type: 'string', description: 'Country code (ISO 3166-1 alpha-2)' }
        },
        required: ['line1', 'city', 'region', 'postalCode', 'country']
      }
    },
    {
      name: 'create_transaction',
      description: 'Create a committed transaction in AvaTax',
      inputSchema: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            description: 'Transaction type',
            enum: ['SalesInvoice', 'PurchaseInvoice', 'ReturnInvoice', 'SalesOrder', 'PurchaseOrder', 'InventoryTransferOutbound', 'InventoryTransferInbound'],
            default: 'SalesInvoice'
          },
          companyCode: { type: 'string', description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' },
          date: { type: 'string', description: 'Transaction date (YYYY-MM-DD)' },
          customerCode: { type: 'string', description: 'Customer identifier' },
          commit: { type: 'boolean', description: 'Whether to commit the transaction', default: true },
          shipFrom: {
            type: 'object',
            description: 'Ship from address',
            properties: {
              line1: { type: 'string' },
              city: { type: 'string' },
              region: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          shipTo: {
            type: 'object',
            description: 'Ship to address',
            properties: {
              line1: { type: 'string' },
              city: { type: 'string' },
              region: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' }
            }
          },
          lines: {
            type: 'array',
            description: 'Transaction line items',
            items: {
              type: 'object',
              properties: {
                number: { type: 'string' },
                quantity: { type: 'number' },
                amount: { type: 'number' },
                itemCode: { type: 'string' },
                description: { type: 'string' },
                taxCode: { type: 'string' }
              },
              required: ['quantity', 'amount']
            }
          }
        },
        required: ['date', 'customerCode', 'lines']
      }
    },
    {
      name: 'get_companies',
      description: 'Get a list of companies in the AvaTax account with optional search filtering',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Optional search filter to find companies by company code or name'
          }
        }
      }
    },
    {
      name: 'ping_service',
      description: 'Test connectivity to AvaTax service and verify credentials',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ]
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'calculate_tax': {
        const result = await avataxClient.calculateTax(args);
        return { 
          content: [{ 
            type: 'text', 
            text: `Tax calculation completed successfully!\n\n${JSON.stringify(result, null, 2)}` 
          }] 
        };
      }
      
      case 'validate_address': {
        const result = await avataxClient.validateAddress(args);
        return { 
          content: [{ 
            type: 'text', 
            text: `Address validation completed!\n\n${JSON.stringify(result, null, 2)}` 
          }] 
        };
      }
      
      case 'create_transaction': {
        const result = await avataxClient.createTransaction(args);
        return { 
          content: [{ 
            type: 'text', 
            text: `Transaction created successfully!\n\n${JSON.stringify(result, null, 2)}` 
          }] 
        };
      }
      
      case 'get_companies': {
        const result = await avataxClient.getCompanies(args.filter);
        return { 
          content: [{ 
            type: 'text', 
            text: `Found ${result.count} companies:\n\n${JSON.stringify(result, null, 2)}` 
          }] 
        };
      }
      
      case 'ping_service': {
        const result = await avataxClient.ping();
        return { 
          content: [{ 
            type: 'text', 
            text: `AvaTax service is ${result.authenticated ? 'accessible and authenticated' : 'not accessible'}\n\n${JSON.stringify(result, null, 2)}` 
          }] 
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Don't log to console in MCP mode - it interferes with JSON-RPC communication
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});