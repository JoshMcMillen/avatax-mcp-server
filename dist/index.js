#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const config_js_1 = require("./avatax/config.js");
const client_js_1 = __importDefault(require("./avatax/client.js"));
const server = new index_js_1.Server({
    name: 'avatax-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize AvaTax client
let avataxClient;
try {
    const config = (0, config_js_1.createAvaTaxConfig)();
    avataxClient = new client_js_1.default(config);
}
catch (error) {
    console.error('Failed to initialize AvaTax client:', error);
    process.exit(1);
}
// Define available tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, () => __awaiter(void 0, void 0, void 0, function* () {
    return ({
        tools: [
            {
                name: 'calculate_tax',
                description: 'Calculate tax for a transaction using AvaTax API',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'Transaction type (SalesInvoice, PurchaseInvoice, etc.)',
                            enum: ['SalesInvoice', 'PurchaseInvoice', 'ReturnInvoice', 'SalesOrder', 'PurchaseOrder', 'InventoryTransferOutbound', 'InventoryTransferInbound'],
                            default: 'SalesInvoice'
                        },
                        companyCode: {
                            type: 'string',
                            description: 'Company code in AvaTax (optional, uses default from config if not provided)'
                        },
                        date: {
                            type: 'string',
                            description: 'Transaction date (YYYY-MM-DD)'
                        },
                        customerCode: {
                            type: 'string',
                            description: 'Customer identifier'
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
                                    taxCode: { type: 'string', description: 'Tax code (optional)' },
                                    addresses: {
                                        type: 'object',
                                        properties: {
                                            shipFrom: {
                                                type: 'object',
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
                                                properties: {
                                                    line1: { type: 'string' },
                                                    city: { type: 'string' },
                                                    region: { type: 'string' },
                                                    postalCode: { type: 'string' },
                                                    country: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                },
                                required: ['number', 'quantity', 'amount', 'addresses']
                            }
                        }
                    },
                    required: ['type', 'date', 'customerCode', 'lines']
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
                        companyCode: { type: 'string', description: 'Company code in AvaTax (optional, uses default from config if not provided)' },
                        date: { type: 'string', description: 'Transaction date (YYYY-MM-DD)' },
                        customerCode: { type: 'string', description: 'Customer identifier' },
                        commit: { type: 'boolean', description: 'Whether to commit the transaction', default: true },
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
                                    taxCode: { type: 'string' },
                                    addresses: {
                                        type: 'object',
                                        properties: {
                                            shipFrom: {
                                                type: 'object',
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
                                                properties: {
                                                    line1: { type: 'string' },
                                                    city: { type: 'string' },
                                                    region: { type: 'string' },
                                                    postalCode: { type: 'string' },
                                                    country: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                },
                                required: ['number', 'quantity', 'amount', 'addresses']
                            }
                        }
                    },
                    required: ['date', 'customerCode', 'lines']
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
    });
}));
// Handle tool execution
server.setRequestHandler(types_js_1.CallToolRequestSchema, (request) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'calculate_tax': {
                const result = yield avataxClient.calculateTax(args);
                return {
                    content: [{
                            type: 'text',
                            text: `Tax calculation completed successfully!\n\n${JSON.stringify(result, null, 2)}`
                        }]
                };
            }
            case 'validate_address': {
                const result = yield avataxClient.validateAddress(args);
                return {
                    content: [{
                            type: 'text',
                            text: `Address validation completed!\n\n${JSON.stringify(result, null, 2)}`
                        }]
                };
            }
            case 'create_transaction': {
                const result = yield avataxClient.createTransaction(args);
                return {
                    content: [{
                            type: 'text',
                            text: `Transaction created successfully!\n\n${JSON.stringify(result, null, 2)}`
                        }]
                };
            }
            case 'ping_service': {
                const result = yield avataxClient.ping();
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
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
                }]
        };
    }
}));
// Start the server
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new stdio_js_1.StdioServerTransport();
        yield server.connect(transport);
        console.error('AvaTax MCP Server running on stdio');
    });
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
