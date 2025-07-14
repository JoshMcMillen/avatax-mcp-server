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
  tools: TOOL_DEFINITIONS
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;
  
  try {
    return await handleToolCall(name, args, avataxClient);
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
