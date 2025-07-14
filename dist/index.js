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
const definitions_js_1 = require("./tools/definitions.js");
const handlers_js_1 = require("./tools/handlers.js");
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
        tools: definitions_js_1.TOOL_DEFINITIONS
    });
}));
// Handle tool execution
server.setRequestHandler(types_js_1.CallToolRequestSchema, (request) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, arguments: args } = request.params;
    try {
        return yield (0, handlers_js_1.handleToolCall)(name, args, avataxClient);
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
        // Don't log to console in MCP mode - it interferes with JSON-RPC communication
    });
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
