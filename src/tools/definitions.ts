// Tool definitions for AvaTax MCP Server
export const TOOL_DEFINITIONS = [
  {
    name: 'calculate_tax',
    description: 'Calculate tax for a transaction using AvaTax API. IMPORTANT: This creates an UNCOMMITTED transaction for tax calculation only. Use document type "SalesOrder" for quotes/estimates (temporary, not saved), "SalesInvoice" for final transactions (permanent but uncommitted). To create a committed transaction, use create_transaction instead.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          description: 'Document type - controls whether transaction is temporary or permanent, and how it\'s processed:\n• SalesOrder: Temporary estimate/quote (not saved to tax history, use for pricing quotes)\n• SalesInvoice: Permanent transaction but uncommitted (saved to AvaTax, can be committed later)\n• PurchaseOrder: Temporary purchase estimate\n• PurchaseInvoice: Permanent purchase transaction\n• ReturnOrder: Temporary refund estimate\n• ReturnInvoice: Permanent refund transaction\n• InventoryTransferOrder: Temporary inventory movement estimate\n• InventoryTransferInvoice: Permanent inventory movement',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice'],
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
    description: 'Create a committed transaction in AvaTax. IMPORTANT: This creates a COMMITTED transaction that will be reported for tax filing. Use this for final invoices and transactions that need to be recorded permanently. The transaction will be immediately available for tax reporting and compliance.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          description: 'Document type - determines transaction permanence and reporting:\n• SalesInvoice: Final committed sale (recommended for most sales)\n• PurchaseInvoice: Final committed purchase\n• ReturnInvoice: Final committed refund/return\n• InventoryTransferInvoice: Final committed inventory movement\nNOTE: Order types (SalesOrder, PurchaseOrder) are not recommended for committed transactions',
          enum: ['SalesInvoice', 'PurchaseInvoice', 'ReturnInvoice', 'InventoryTransferInvoice', 'InventoryTransferOutboundInvoice'],
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
    name: 'list_transactions',
    description: 'List transactions for a company with optional filtering. IMPORTANT: Must include a date filter or defaults to last 30 days. Use this to find existing transactions before committing, voiding, or adjusting them.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        filter: {
          type: 'string',
          description: 'OData filter criteria. REQUIRED: Must include date filter (e.g., "date ge \'2024-01-01\' and date le \'2024-01-31\'"). Other filters: status, customerCode, type, totalAmount, etc.'
        },
        include: {
          type: 'string',
          description: 'Additional data to include: Lines, Details, Summary, Addresses, SummaryOnly, LinesOnly'
        },
        top: {
          type: 'number',
          description: 'Maximum records to return (max 1000, default varies)'
        },
        skip: {
          type: 'number',
          description: 'Records to skip for pagination'
        },
        orderBy: {
          type: 'string',
          description: 'Sort order (e.g., "date desc, code asc")'
        }
      },
      required: ['filter']
    }
  },
  {
    name: 'get_transaction',
    description: 'Retrieve a specific transaction by company code and transaction code. Use this to examine transaction details before making changes like committing, voiding, or adjusting.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (required)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to retrieve (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        },
        include: {
          type: 'string',
          description: 'Additional data to include: Lines, Details, Summary, Addresses, SummaryOnly, LinesOnly'
        }
      },
      required: ['companyCode', 'transactionCode']
    }
  },
  {
    name: 'commit_transaction',
    description: 'Commit an existing uncommitted transaction for tax reporting. IMPORTANT: Once committed, transactions are available for Avalara Managed Returns and tax filing. Only transactions in "Saved" status can be committed. Cannot commit transactions that are already committed, voided, or locked.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to commit (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        },
        commit: {
          type: 'boolean',
          description: 'Set to true to commit the transaction (required for this operation)',
          default: true
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'void_transaction',
    description: 'Void a transaction, marking it as cancelled. IMPORTANT: This permanently voids the transaction - use for cancelled orders/invoices. Cannot void transactions that have been reported to tax authorities via Managed Returns. Voided transactions cannot be committed or adjusted.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to void (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        },
        code: {
          type: 'string',
          description: 'Void reason code - must be "DocVoided" for transaction voiding',
          enum: ['DocVoided'],
          default: 'DocVoided'
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'adjust_transaction',
    description: 'Adjust/correct a committed transaction by creating a new version. IMPORTANT: Only committed transactions can be adjusted. The original transaction becomes "Adjusted" status and the new version becomes the current transaction. Cannot adjust locked transactions (already reported to tax authorities).',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to adjust (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        },
        date: { 
          type: 'string', 
          description: 'New transaction date (YYYY-MM-DD)' 
        },
        customerCode: { 
          type: 'string', 
          description: 'Customer identifier for the adjusted transaction' 
        },
        lines: {
          type: 'array',
          description: 'Updated transaction line items',
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
        }
      },
      required: ['transactionCode', 'date', 'customerCode', 'lines']
    }
  },
  {
    name: 'uncommit_transaction',
    description: 'Uncommit a committed transaction, changing its status back to "Saved". IMPORTANT: This removes the transaction from tax reporting. Only committed transactions that have not been locked (reported to tax authorities) can be uncommitted. Use this to make changes to a committed transaction.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to uncommit (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'get_transaction_audit',
    description: 'Get audit information about a transaction including creation details, server processing time, and original API call information. Use this for debugging and compliance audit trails.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to audit (required)'
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'change_transaction_code',
    description: 'Change the transaction code of an existing transaction. IMPORTANT: Use this to rename a transaction code. The transaction must not be committed, voided, or locked. Useful for correcting transaction codes before commitment.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Current transaction code (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        },
        newCode: {
          type: 'string',
          description: 'New transaction code to assign (required)'
        }
      },
      required: ['transactionCode', 'newCode']
    }
  },
  {
    name: 'verify_transaction',
    description: 'Verify a transaction by checking its accuracy and compliance with tax rules. Use this to validate transaction data and ensure it meets AvaTax requirements before processing.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        transactionCode: {
          type: 'string',
          description: 'Transaction code to verify (required)'
        },
        documentType: {
          type: 'string',
          description: 'Document type if multiple transactions exist with same code (optional, defaults to SalesInvoice)',
          enum: ['SalesOrder', 'SalesInvoice', 'PurchaseOrder', 'PurchaseInvoice', 'ReturnOrder', 'ReturnInvoice', 'InventoryTransferOrder', 'InventoryTransferInvoice', 'InventoryTransferOutboundOrder', 'InventoryTransferOutboundInvoice']
        }
      },
      required: ['transactionCode']
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
    name: 'get_companies',
    description: 'Get a list of companies in the AvaTax account with optional search filtering. Use this to find available companies before performing operations on specific companies.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { 
          type: 'string', 
          description: 'OData filter criteria to search companies. Examples: "companyCode eq \'MYCOMPANY\'", "name contains \'Test\'", "isActive eq true", "companyCode eq \'COMP1\' or companyCode eq \'COMP2\'"' 
        },
        include: {
          type: 'string',
          description: 'Additional data to include in response (comma-separated): Settings, FilingCalendars, Contacts, Items, Locations, Nexus, TaxCodes, TaxRules, UPC'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return (default: 25, max: 1000)'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0)'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by (e.g., "companyCode asc", "name desc", "createdDate desc")'
        }
      }
    }
  },
  {
    name: 'get_company',
    description: 'Retrieve detailed information about a specific company by its company code. Use this to examine company settings, status, and configuration details.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to retrieve (required)'
        },
        include: {
          type: 'string',
          description: 'Additional data to include in response (comma-separated): Settings, FilingCalendars, Contacts, Items, Locations, Nexus, TaxCodes, TaxRules, UPC'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'create_company',
    description: 'Create a new company in the AvaTax account. IMPORTANT: This creates a permanent company record that will be part of your AvaTax account. Use carefully and ensure all required information is accurate. The company will be available for transaction processing once created.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Unique company code (1-25 characters, alphanumeric and underscore only). This will be used to identify the company in all API calls.'
        },
        name: {
          type: 'string',
          description: 'Company name (required, 1-255 characters)'
        },
        taxpayerIdNumber: {
          type: 'string',
          description: 'Tax identification number (EIN in US, equivalent in other countries). Required for tax compliance.'
        },
        line1: {
          type: 'string',
          description: 'First line of company address'
        },
        line2: {
          type: 'string',
          description: 'Second line of company address (optional)'
        },
        line3: {
          type: 'string',
          description: 'Third line of company address (optional)'
        },
        city: {
          type: 'string',
          description: 'City name'
        },
        region: {
          type: 'string',
          description: 'State/Province/Region code'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Two-character ISO country code (e.g., "US", "CA", "GB")'
        },
        phoneNumber: {
          type: 'string',
          description: 'Company phone number'
        },
        email: {
          type: 'string',
          description: 'Company email address'
        },
        website: {
          type: 'string',
          description: 'Company website URL'
        },
        parentCompanyId: {
          type: 'number',
          description: 'ID of parent company if this is a subsidiary'
        },
        isActive: {
          type: 'boolean',
          description: 'Whether the company is active (default: true)',
          default: true
        },
        isDefault: {
          type: 'boolean',
          description: 'Whether this is the default company for the account (default: false)',
          default: false
        },
        defaultLocationCode: {
          type: 'string',
          description: 'Default location code for transactions (will be created if not exists)'
        },
        businessTypeId: {
          type: 'string',
          description: 'Business type identifier from AvaTax business type list'
        },
        roundingLevelId: {
          type: 'string',
          description: 'Tax rounding level: "Line" (round each line), "Document" (round total document)'
        },
        hasProfile: {
          type: 'boolean',
          description: 'Whether company has a filing profile setup'
        },
        isTest: {
          type: 'boolean',
          description: 'Mark company as test company (recommended for development/testing)',
          default: false
        }
      },
      required: ['companyCode', 'name']
    }
  },
  {
    name: 'update_company',
    description: 'Update an existing company\'s information. IMPORTANT: This modifies permanent company records. Be careful when updating critical information like tax IDs or addresses as it may affect tax compliance and reporting.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to update (required)'
        },
        name: {
          type: 'string',
          description: 'Updated company name'
        },
        taxpayerIdNumber: {
          type: 'string',
          description: 'Updated tax identification number (EIN in US, equivalent in other countries)'
        },
        line1: {
          type: 'string',
          description: 'Updated first line of company address'
        },
        line2: {
          type: 'string',
          description: 'Updated second line of company address'
        },
        line3: {
          type: 'string',
          description: 'Updated third line of company address'
        },
        city: {
          type: 'string',
          description: 'Updated city name'
        },
        region: {
          type: 'string',
          description: 'Updated state/province/region code'
        },
        postalCode: {
          type: 'string',
          description: 'Updated postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Updated two-character ISO country code'
        },
        phoneNumber: {
          type: 'string',
          description: 'Updated company phone number'
        },
        email: {
          type: 'string',
          description: 'Updated company email address'
        },
        website: {
          type: 'string',
          description: 'Updated company website URL'
        },
        isActive: {
          type: 'boolean',
          description: 'Whether the company is active'
        },
        isDefault: {
          type: 'boolean',
          description: 'Whether this is the default company for the account'
        },
        defaultLocationCode: {
          type: 'string',
          description: 'Updated default location code for transactions'
        },
        businessTypeId: {
          type: 'string',
          description: 'Updated business type identifier'
        },
        roundingLevelId: {
          type: 'string',
          description: 'Updated tax rounding level: "Line" or "Document"'
        },
        isTest: {
          type: 'boolean',
          description: 'Updated test company flag'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'delete_company',
    description: 'Delete a company from the AvaTax account. CRITICAL WARNING: This permanently removes the company and ALL associated data including transactions, nexus declarations, items, locations, and settings. This operation CANNOT be undone. Use with extreme caution and only for companies that should never have been created.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to delete (required). WARNING: This will permanently delete the company and all its data.'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'get_company_configuration',
    description: 'Retrieve detailed configuration settings for a company including tax calculation settings, compliance options, and feature flags. Use this to understand how a company is configured for tax processing.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to get configuration for (required)'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'set_company_configuration',
    description: 'Update company configuration settings for tax calculation behavior, compliance options, and features. IMPORTANT: These settings affect how taxes are calculated and reported for the company. Changes should be made carefully and tested thoroughly.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to configure (required)'
        },
        settings: {
          type: 'array',
          description: 'Array of configuration settings to update',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Setting name (e.g., "isSellerImporterOfRecord", "isBuyerImporterOfRecord", "enableUsPurchaseTransactions")'
              },
              value: {
                type: 'string',
                description: 'Setting value (usually "true" or "false" for boolean settings)'
              }
            },
            required: ['name', 'value']
          }
        }
      },
      required: ['companyCode', 'settings']
    }
  },
  {
    name: 'initialize_company',
    description: 'Initialize a newly created company with default settings, locations, and tax codes. IMPORTANT: This sets up the company for immediate use by creating necessary default configurations. Run this after creating a new company to make it ready for transaction processing.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to initialize (required)'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'get_company_filing_status',
    description: 'Get the tax filing status and compliance information for a company including return filing requirements, due dates, and status. Use this to understand tax compliance obligations and current filing state.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to check filing status for (required)'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'approve_company_filing',
    description: 'Approve tax filings for a company. IMPORTANT: This approves returns for submission to tax authorities. Only use when you are authorized to approve tax filings and have verified the accuracy of the returns. This affects legal tax compliance.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to approve filings for (required)'
        },
        year: {
          type: 'number',
          description: 'Tax year to approve filings for (required)'
        },
        month: {
          type: 'number',
          description: 'Tax month to approve filings for (1-12, required)'
        },
        model: {
          type: 'object',
          description: 'Approval details',
          properties: {
            approved: {
              type: 'boolean',
              description: 'Whether to approve the filing',
              default: true
            }
          }
        }
      },
      required: ['companyCode', 'year', 'month']
    }
  },
  {
    name: 'get_company_parameters',
    description: 'Retrieve company parameters and settings that control various aspects of tax calculation and compliance. Use this to see specific configuration values and calculation settings for a company.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to get parameters for (required)'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'set_company_parameters',
    description: 'Update company parameters and settings. IMPORTANT: These parameters control tax calculation behavior and compliance features. Changes should be tested thoroughly before applying to production.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to set parameters for (required)'
        },
        parameters: {
          type: 'array',
          description: 'Array of parameter objects to set',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Parameter name (e.g., "taxCalculationMode", "roundingLevel", "accountingMethod")'
              },
              value: {
                type: 'string',
                description: 'Parameter value'
              },
              unit: {
                type: 'string',
                description: 'Parameter unit if applicable'
              }
            },
            required: ['name', 'value']
          }
        }
      },
      required: ['companyCode', 'parameters']
    }
  },
  {
    name: 'get_company_certificates',
    description: 'Retrieve exemption certificates associated with a company. Use this to see what exemption certificates are available for use in tax calculations.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to get certificates for (required)'
        },
        include: {
          type: 'string',
          description: 'Additional data to include (comma-separated): Details, Customers'
        },
        filter: {
          type: 'string',
          description: 'OData filter criteria for certificates'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return (default: 25, max: 1000)'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0)'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'fund_company_account',
    description: 'Fund a company account for usage-based services. IMPORTANT: This affects billing and account credits. Use only when authorized to manage company finances.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to fund (required)'
        },
        fundingRequest: {
          type: 'object',
          description: 'Funding request details',
          properties: {
            amount: {
              type: 'number',
              description: 'Amount to fund the account with'
            },
            currency: {
              type: 'string',
              description: 'Currency code (e.g., "USD")'
            }
          },
          required: ['amount']
        }
      },
      required: ['companyCode', 'fundingRequest']
    }
  },
  {
    name: 'get_company_returns',
    description: 'Retrieve tax returns for a company. Use this to see filed and pending tax returns and their status.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to get returns for (required)'
        },
        filingFrequency: {
          type: 'string',
          description: 'Filter by filing frequency',
          enum: ['Monthly', 'Quarterly', 'SemiAnnually', 'Annually', 'InverseQuarterly', 'Weekly', 'Bimonthly']
        },
        country: {
          type: 'string',
          description: 'Filter by country code'
        },
        region: {
          type: 'string',
          description: 'Filter by region/state code'
        },
        year: {
          type: 'number',
          description: 'Filter by tax year'
        },
        month: {
          type: 'number',
          description: 'Filter by tax month (1-12)'
        },
        include: {
          type: 'string',
          description: 'Additional data to include'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'create_company_return',
    description: 'Create a new tax return for a company. IMPORTANT: This creates a legal tax return document. Only use when authorized and ensure all data is accurate.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to create return for (required)'
        },
        returnObject: {
          type: 'object',
          description: 'Tax return details',
          properties: {
            companyId: {
              type: 'number',
              description: 'Company ID'
            },
            filingFrequency: {
              type: 'string',
              description: 'Filing frequency',
              enum: ['Monthly', 'Quarterly', 'SemiAnnually', 'Annually', 'InverseQuarterly', 'Weekly', 'Bimonthly']
            },
            country: {
              type: 'string',
              description: 'Country code'
            },
            region: {
              type: 'string',
              description: 'Region/state code'
            },
            filingCalendarId: {
              type: 'number',
              description: 'Filing calendar ID'
            },
            taxAuthorityId: {
              type: 'number',
              description: 'Tax authority ID'
            },
            year: {
              type: 'number',
              description: 'Tax year'
            },
            month: {
              type: 'number',
              description: 'Tax month'
            }
          },
          required: ['filingFrequency', 'country', 'region', 'year', 'month']
        }
      },
      required: ['companyCode', 'returnObject']
    }
  },
  {
    name: 'approve_company_return',
    description: 'Approve a tax return for filing. CRITICAL: This approves legal tax documents for submission to authorities. Only use when legally authorized and after thorough review.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (required)'
        },
        year: {
          type: 'number',
          description: 'Tax year (required)'
        },
        month: {
          type: 'number',
          description: 'Tax month (1-12, required)'
        },
        country: {
          type: 'string',
          description: 'Country code (required)'
        },
        region: {
          type: 'string',
          description: 'Region/state code (required)'
        },
        filingFrequency: {
          type: 'string',
          description: 'Filing frequency (required)',
          enum: ['Monthly', 'Quarterly', 'SemiAnnually', 'Annually', 'InverseQuarterly', 'Weekly', 'Bimonthly']
        }
      },
      required: ['companyCode', 'year', 'month', 'country', 'region', 'filingFrequency']
    }
  },
  {
    name: 'get_company_notices',
    description: 'Retrieve tax notices received by a company from tax authorities. Use this to track compliance notices and required responses.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to get notices for (required)'
        },
        include: {
          type: 'string',
          description: 'Additional data to include'
        },
        filter: {
          type: 'string',
          description: 'OData filter criteria'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'create_company_notice',
    description: 'Create a new tax notice for a company. Use this to manually record notices received from tax authorities that need tracking and response.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to create notice for (required)'
        },
        notice: {
          type: 'object',
          description: 'Notice details',
          properties: {
            noticeNumber: {
              type: 'string',
              description: 'Notice number from tax authority'
            },
            noticeDate: {
              type: 'string',
              description: 'Date notice was issued (YYYY-MM-DD)'
            },
            taxAuthorityId: {
              type: 'number',
              description: 'ID of the tax authority that issued the notice'
            },
            country: {
              type: 'string',
              description: 'Country code'
            },
            region: {
              type: 'string',
              description: 'Region/state code'
            },
            description: {
              type: 'string',
              description: 'Description of the notice'
            },
            amount: {
              type: 'number',
              description: 'Amount involved in the notice'
            },
            status: {
              type: 'string',
              description: 'Current status of the notice'
            }
          },
          required: ['noticeNumber', 'noticeDate']
        }
      },
      required: ['companyCode', 'notice']
    }
  },
  {
    name: 'quick_setup_company',
    description: 'Perform quick setup for a company by automatically creating necessary locations, nexus declarations, and settings based on business address. IMPORTANT: This is a convenience method that creates multiple records. Use for new companies that need immediate setup.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to setup (required)'
        },
        setupRequest: {
          type: 'object',
          description: 'Quick setup configuration',
          properties: {
            businessName: {
              type: 'string',
              description: 'Business name'
            },
            firstName: {
              type: 'string',
              description: 'Contact first name'
            },
            lastName: {
              type: 'string',
              description: 'Contact last name'
            },
            title: {
              type: 'string',
              description: 'Contact title'
            },
            email: {
              type: 'string',
              description: 'Contact email'
            },
            phoneNumber: {
              type: 'string',
              description: 'Contact phone number'
            },
            line1: {
              type: 'string',
              description: 'Business address line 1'
            },
            line2: {
              type: 'string',
              description: 'Business address line 2'
            },
            city: {
              type: 'string',
              description: 'Business city'
            },
            region: {
              type: 'string',
              description: 'Business state/province'
            },
            postalCode: {
              type: 'string',
              description: 'Business postal/ZIP code'
            },
            country: {
              type: 'string',
              description: 'Business country code'
            },
            taxpayerIdNumber: {
              type: 'string',
              description: 'Tax ID number'
            },
            effectiveDate: {
              type: 'string',
              description: 'Effective date for nexus (YYYY-MM-DD)'
            }
          },
          required: ['businessName', 'line1', 'city', 'region', 'postalCode', 'country']
        }
      },
      required: ['companyCode', 'setupRequest']
    }
  },
  {
    name: 'get_company_worksheets',
    description: 'Retrieve tax worksheets for a company. Use this to access detailed tax calculation worksheets and supporting documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to get worksheets for (required)'
        },
        year: {
          type: 'number',
          description: 'Tax year to filter worksheets'
        },
        month: {
          type: 'number',
          description: 'Tax month to filter worksheets (1-12)'
        },
        country: {
          type: 'string',
          description: 'Country code to filter worksheets'
        },
        region: {
          type: 'string',
          description: 'Region/state code to filter worksheets'
        },
        include: {
          type: 'string',
          description: 'Additional data to include'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'rebuild_company_worksheets',
    description: 'Rebuild tax worksheets for a company for a specific time period. IMPORTANT: This recalculates tax worksheets which may affect reporting. Use when data corrections require worksheet regeneration.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code to rebuild worksheets for (required)'
        },
        rebuildRequest: {
          type: 'object',
          description: 'Rebuild parameters',
          properties: {
            year: {
              type: 'number',
              description: 'Tax year to rebuild (required)'
            },
            month: {
              type: 'number',
              description: 'Tax month to rebuild (1-12, required)'
            },
            country: {
              type: 'string',
              description: 'Country code'
            },
            region: {
              type: 'string',
              description: 'Region/state code'
            },
            rebuildType: {
              type: 'string',
              description: 'Type of rebuild to perform'
            }
          },
          required: ['year', 'month']
        }
      },
      required: ['companyCode', 'rebuildRequest']
    }
  },
  {
    name: 'ping_service',
    description: 'Test connectivity to AvaTax service and verify credentials',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  // Nexus Management Tools
  {
    name: 'get_company_nexus',
    description: 'Retrieve all nexus declarations for a company. Use this when you need to see what tax jurisdictions a company has declared nexus in. Nexus represents where a company has established sufficient business presence to be required to collect and remit taxes.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        filter: {
          type: 'string',
          description: 'OData filter criteria for nexus declarations (e.g., "country eq \'US\'" or "region eq \'CA\'")'
        },
        include: {
          type: 'string',
          description: 'Additional information to include in the response (comma-separated values)'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return (default: 25, max: 1000)'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0)'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by (e.g., "country asc, region desc")'
        }
      }
    }
  },
  {
    name: 'get_nexus_by_id',
    description: 'Retrieve a specific nexus declaration by its ID. Use this when you have a specific nexus ID and need detailed information about that particular nexus declaration.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        id: {
          type: 'number',
          description: 'The unique ID of the nexus declaration to retrieve'
        },
        include: {
          type: 'string',
          description: 'Additional information to include in the response (comma-separated values)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'create_nexus',
    description: 'Create a new nexus declaration for a company. Use this when a company establishes business presence in a new jurisdiction and needs to declare nexus for tax compliance. This is required before the company can collect taxes in that jurisdiction.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        country: {
          type: 'string',
          description: 'Two-character ISO country code where nexus is being declared (e.g., "US", "CA", "GB")'
        },
        region: {
          type: 'string',
          description: 'Two or three-character region code (state/province) where nexus is being declared (e.g., "CA", "NY", "ON")'
        },
        jurisTypeId: {
          type: 'string',
          description: 'Type of jurisdiction (Country, State, County, City, Special)',
          enum: ['Country', 'State', 'County', 'City', 'Special']
        },
        jurisCode: {
          type: 'string',
          description: 'Specific jurisdiction code for the nexus location'
        },
        jurisName: {
          type: 'string',
          description: 'Human-readable name of the jurisdiction'
        },
        effectiveDate: {
          type: 'string',
          description: 'Date when nexus becomes effective (YYYY-MM-DD format). Typically the date business presence was established.'
        },
        endDate: {
          type: 'string',
          description: 'Date when nexus ends (YYYY-MM-DD format). Leave empty for ongoing nexus.'
        },
        nexusTypeId: {
          type: 'string',
          description: 'Type of nexus being declared',
          enum: ['SalesOrSellersUseTax', 'SalesTax', 'SellersUseTax', 'UseTax', 'ConsumerUseTax', 'RentalTax', 'AccommodationTax']
        },
        sourcing: {
          type: 'string',
          description: 'Sourcing method for this nexus location',
          enum: ['Mixed', 'Destination', 'Origin']
        },
        hasLocalNexus: {
          type: 'boolean',
          description: 'Whether this location has local jurisdiction nexus in addition to state/province nexus'
        },
        taxId: {
          type: 'string',
          description: 'Tax registration ID or permit number for this nexus (if applicable)'
        },
        streamlinedSalesTax: {
          type: 'boolean',
          description: 'Whether this nexus participates in Streamlined Sales Tax program (US only)'
        }
      },
      required: ['country']
    }
  },
  {
    name: 'update_nexus',
    description: 'Update an existing nexus declaration. IMPORTANT: When updating nexus, only user-selectable fields can be modified: effectiveDate, endDate, taxId, nexusTypeId, hasLocalNexus, and streamlinedSalesTax. All other fields (country, region, jurisCode, jurisName, etc.) must match the existing Avalara-defined nexus object exactly. Use get_nexus_by_id first to retrieve current values.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        id: {
          type: 'number',
          description: 'The unique ID of the nexus declaration to update'
        },
        effectiveDate: {
          type: 'string',
          description: 'Date when nexus becomes effective (YYYY-MM-DD format) - USER SELECTABLE'
        },
        endDate: {
          type: 'string',
          description: 'Date when nexus ends (YYYY-MM-DD format). Set this to cease nexus in a jurisdiction - USER SELECTABLE'
        },
        nexusTypeId: {
          type: 'string',
          description: 'Type of nexus being declared - USER SELECTABLE',
          enum: ['SalesOrSellersUseTax', 'SalesTax', 'SellersUseTax', 'UseTax', 'ConsumerUseTax', 'RentalTax', 'AccommodationTax']
        },
        hasLocalNexus: {
          type: 'boolean',
          description: 'Whether this location has local jurisdiction nexus in addition to state/province nexus - USER SELECTABLE'
        },
        taxId: {
          type: 'string',
          description: 'Tax registration ID or permit number for this nexus - USER SELECTABLE'
        },
        streamlinedSalesTax: {
          type: 'boolean',
          description: 'Whether this nexus participates in Streamlined Sales Tax program (US only) - USER SELECTABLE'
        },
        country: {
          type: 'string',
          description: 'Two-character ISO country code (e.g., "US", "CA", "GB") - MUST MATCH EXISTING NEXUS EXACTLY'
        },
        region: {
          type: 'string',
          description: 'Two or three-character region code (state/province) (e.g., "CA", "NY", "ON") - MUST MATCH EXISTING NEXUS EXACTLY'
        },
        jurisTypeId: {
          type: 'string',
          description: 'Type of jurisdiction (Country, State, County, City, Special) - MUST MATCH EXISTING NEXUS EXACTLY',
          enum: ['Country', 'State', 'County', 'City', 'Special']
        },
        jurisCode: {
          type: 'string',
          description: 'Specific jurisdiction code for the nexus location - MUST MATCH EXISTING NEXUS EXACTLY'
        },
        jurisName: {
          type: 'string',
          description: 'Human-readable name of the jurisdiction - MUST MATCH EXISTING NEXUS EXACTLY'
        },
        sourcing: {
          type: 'string',
          description: 'Sourcing method for this nexus location - MUST MATCH EXISTING NEXUS EXACTLY',
          enum: ['Mixed', 'Destination', 'Origin']
        }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_nexus',
    description: 'Delete a nexus declaration. Use this to remove a nexus declaration when a company permanently ceases all business activities in a jurisdiction. This is typically used instead of setting an end date when the nexus was created in error or is no longer needed.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        id: {
          type: 'number',
          description: 'The unique ID of the nexus declaration to delete'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'get_nexus_by_form_code',
    description: 'Retrieve nexus declarations associated with a specific tax form code. Use this when you need to find all nexus locations that require filing a particular tax form. NOTE: Form codes are jurisdiction-specific and must exist in the AvaTax system. If you get "formCode not found" errors, the form code does not exist. Use get_company_nexus to see existing nexus declarations first.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        formCode: {
          type: 'string',
          description: 'Tax form code to filter nexus declarations by. Must be a valid form code that exists in AvaTax system. Form codes are jurisdiction-specific (e.g., state tax form codes like "ST-1" for some states). Contact Avalara support if unsure of valid form codes for your jurisdictions.'
        },
        include: {
          type: 'string',
          description: 'Additional information to include in the response (comma-separated values)'
        },
        filter: {
          type: 'string',
          description: 'OData filter criteria for additional filtering'
        },
        top: {
          type: 'number',
          description: 'Maximum number of records to return (default: 25)'
        },
        skip: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0)'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by'
        }
      },
      required: ['formCode']
    }
  },
  {
    name: 'declare_nexus_by_address',
    description: 'Automatically declare nexus based on a physical business address. Use this when you have a business location and want AvaTax to automatically determine and create the appropriate nexus declarations for that address. This is the easiest way to establish nexus for a new business location.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, will prompt user)'
        },
        line1: {
          type: 'string',
          description: 'First line of the business address where nexus should be declared'
        },
        line2: {
          type: 'string',
          description: 'Second line of the business address (optional)'
        },
        line3: {
          type: 'string',
          description: 'Third line of the business address (optional)'
        },
        city: {
          type: 'string',
          description: 'City name of the business location'
        },
        region: {
          type: 'string',
          description: 'State or province code of the business location'
        },
        country: {
          type: 'string',
          description: 'Two-character ISO country code of the business location'
        },
        postalCode: {
          type: 'string',
          description: 'Postal or ZIP code of the business location'
        },
        textCase: {
          type: 'string',
          enum: ['Upper', 'Mixed'],
          description: 'Text case for the response (Upper for all caps, Mixed for normal case)'
        },
        effectiveDate: {
          type: 'string',
          description: 'Date when nexus becomes effective (YYYY-MM-DD). Defaults to current date if not specified.'
        }
      },
      required: ['line1', 'city', 'region', 'country', 'postalCode']
    }
  },

  // Credential Management Tools
  {
    name: 'set_default_company',
    description: 'Set the default company code for the current session. This allows you to switch between companies without restarting Claude.',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'The company code to use as default for subsequent operations'
        }
      },
      required: ['companyCode']
    }
  },
  {
    name: 'get_current_company',
    description: 'Get the currently configured default company code and account information',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'set_credentials',
    description: 'Set or update the AvaTax credentials for the current session. Use this to switch between different accounts or environments without restarting Claude.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The AvaTax account ID'
        },
        licenseKey: {
          type: 'string',
          description: 'The AvaTax license key'
        },
        environment: {
          type: 'string',
          description: 'The AvaTax environment (sandbox or production)',
          enum: ['sandbox', 'production']
        },
        companyCode: {
          type: 'string',
          description: 'Optional default company code'
        }
      },
      required: ['accountId', 'licenseKey']
    }
  },
  {
    name: 'switch_account',
    description: 'Switch to a different pre-configured AvaTax account',
    inputSchema: {
      type: 'object',
      properties: {
        accountName: {
          type: 'string',
          description: 'Name of the account configuration to switch to (e.g., "sandbox", "production")'
        }
      },
      required: ['accountName']
    }
  },
  {
    name: 'list_accounts',
    description: 'List all available pre-configured AvaTax accounts',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];
