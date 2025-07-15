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
        newTransaction: {
          type: 'object',
          description: 'New transaction data to replace the existing transaction',
          properties: {
            date: { type: 'string', description: 'Transaction date (YYYY-MM-DD)' },
            customerCode: { type: 'string', description: 'Customer identifier' },
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
          required: ['date', 'customerCode', 'lines']
        }
      },
      required: ['transactionCode', 'newTransaction']
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
