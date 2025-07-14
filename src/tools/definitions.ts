// Tool definitions for AvaTax MCP Server
export const TOOL_DEFINITIONS = [
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
        commit: { 
          type: 'boolean', 
          description: 'Whether to commit the transaction',
          default: true 
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
];
