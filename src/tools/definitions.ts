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
          description: 'Ship from address (optional if default origin address is configured in settings)',
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
          description: 'Ship from address (optional if default origin address is configured in settings)',
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
  },
  // Phase 1: Core Transaction Operations
  {
    name: 'void_transaction',
    description: 'Void/cancel an existing transaction in AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        transactionCode: { 
          type: 'string', 
          description: 'The transaction code to void' 
        },
        voidType: {
          type: 'string',
          description: 'Type of void operation',
          enum: ['Unspecified', 'PostFailed', 'DocDeleted', 'DocVoided', 'AdjustmentCancelled'],
          default: 'DocVoided'
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'refund_transaction',
    description: 'Create a refund for an existing transaction',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        originalTransactionCode: { 
          type: 'string', 
          description: 'The original transaction code to refund' 
        },
        refundTransactionCode: { 
          type: 'string', 
          description: 'Code for the new refund transaction' 
        },
        refundDate: { 
          type: 'string', 
          description: 'Refund date (YYYY-MM-DD)' 
        },
        refundType: {
          type: 'string',
          description: 'Type of refund (Full, Partial, Percentage)',
          enum: ['Full', 'Partial', 'Percentage'],
          default: 'Full'
        },
        refundPercentage: {
          type: 'number',
          description: 'Percentage to refund (0-100, only for Percentage refunds)',
          minimum: 0,
          maximum: 100
        },
        lines: {
          type: 'array',
          description: 'Specific lines to refund (for partial refunds)',
          items: {
            type: 'object',
            properties: {
              lineNumber: { type: 'string', description: 'Line number from original transaction' },
              quantity: { type: 'number', description: 'Quantity to refund' },
              amount: { type: 'number', description: 'Amount to refund' }
            }
          }
        }
      },
      required: ['originalTransactionCode', 'refundTransactionCode', 'refundDate']
    }
  },
  {
    name: 'adjust_transaction',
    description: 'Adjust an existing transaction in AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        transactionCode: { 
          type: 'string', 
          description: 'The transaction code to adjust' 
        },
        adjustmentDescription: { 
          type: 'string', 
          description: 'Description of the adjustment being made' 
        },
        adjustmentReason: {
          type: 'string',
          description: 'Reason for the adjustment',
          enum: ['NotSupported', 'SourcingIssue', 'ReconciledWithGeneralLedger', 'ExemptCertApplied', 'PriceAdjusted', 'ProductReturned', 'ProductExchanged', 'BadDebt', 'Other', 'Offline']
        },
        newTransaction: {
          type: 'object',
          description: 'Updated transaction data',
          properties: {
            lines: {
              type: 'array',
              description: 'Updated line items',
              items: {
                type: 'object',
                properties: {
                  number: { type: 'string' },
                  quantity: { type: 'number' },
                  amount: { type: 'number' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      },
      required: ['transactionCode', 'adjustmentDescription']
    }
  },
  {
    name: 'settle_transaction',
    description: 'Mark a transaction as settled in AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        transactionCode: { 
          type: 'string', 
          description: 'The transaction code to settle' 
        },
        paymentDate: { 
          type: 'string', 
          description: 'Payment/settlement date (YYYY-MM-DD)' 
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'verify_transaction',
    description: 'Verify the status and details of a transaction',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        transactionCode: { 
          type: 'string', 
          description: 'The transaction code to verify' 
        },
        documentType: {
          type: 'string',
          description: 'Document type to verify',
          enum: ['SalesInvoice', 'PurchaseInvoice', 'ReturnInvoice', 'SalesOrder', 'PurchaseOrder'],
          default: 'SalesInvoice'
        },
        include: {
          type: 'string',
          description: 'Additional data to include in response (Lines, Details, Summary, Addresses, TaxDetailsByTaxType)',
          default: 'Lines'
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'lock_transaction',
    description: 'Lock a transaction to prevent further changes',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        transactionCode: { 
          type: 'string', 
          description: 'The transaction code to lock' 
        }
      },
      required: ['transactionCode']
    }
  },
  {
    name: 'unlock_transaction',
    description: 'Unlock a transaction to allow changes',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        transactionCode: { 
          type: 'string', 
          description: 'The transaction code to unlock' 
        }
      },
      required: ['transactionCode']
    }
  },
  // Phase 2: Batch Operations
  {
    name: 'create_batch',
    description: 'Create a batch of transactions for processing in AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        batchName: { 
          type: 'string', 
          description: 'Name for the batch' 
        },
        transactions: {
          type: 'array',
          description: 'Array of transactions to include in the batch',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'Transaction code' },
              type: { 
                type: 'string', 
                description: 'Transaction type',
                enum: ['SalesInvoice', 'PurchaseInvoice', 'ReturnInvoice', 'SalesOrder', 'PurchaseOrder'],
                default: 'SalesInvoice'
              },
              date: { type: 'string', description: 'Transaction date (YYYY-MM-DD)' },
              customerCode: { type: 'string', description: 'Customer identifier' },
              lines: {
                type: 'array',
                description: 'Transaction line items',
                items: {
                  type: 'object',
                  properties: {
                    number: { type: 'string' },
                    quantity: { type: 'number' },
                    amount: { type: 'number' },
                    description: { type: 'string' }
                  },
                  required: ['quantity', 'amount']
                }
              }
            },
            required: ['code', 'date', 'customerCode', 'lines']
          }
        }
      },
      required: ['batchName', 'transactions']
    }
  },
  {
    name: 'get_batch_status',
    description: 'Get the status and details of a batch operation',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        batchId: { 
          type: 'string', 
          description: 'The batch ID to check status for' 
        }
      },
      required: ['batchId']
    }
  },
  {
    name: 'download_batch',
    description: 'Download the results of a completed batch operation',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        batchId: { 
          type: 'string', 
          description: 'The batch ID to download results for' 
        }
      },
      required: ['batchId']
    }
  },
  {
    name: 'cancel_batch',
    description: 'Cancel a batch operation that is in progress',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        batchId: { 
          type: 'string', 
          description: 'The batch ID to cancel' 
        }
      },
      required: ['batchId']
    }
  },
  // Phase 3: Company & Configuration Management
  {
    name: 'create_company',
    description: 'Create a new company in AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Unique company code for the new company' 
        },
        name: { 
          type: 'string', 
          description: 'Company name' 
        },
        line1: { 
          type: 'string', 
          description: 'Street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Street address line 2 (optional)' 
        },
        city: { 
          type: 'string', 
          description: 'City' 
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
          description: 'Country code (ISO 3166-1 alpha-2)' 
        },
        taxpayerIdNumber: { 
          type: 'string', 
          description: 'Tax identification number (EIN, etc.)' 
        },
        companyClassification: {
          type: 'string',
          description: 'Company classification',
          enum: ['Marketplace', 'ManagedReturns', 'SST']
        }
      },
      required: ['companyCode', 'name', 'line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'update_company',
    description: 'Update an existing company in AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        companyId: { 
          type: 'string', 
          description: 'Company ID to update' 
        },
        name: { 
          type: 'string', 
          description: 'Updated company name' 
        },
        line1: { 
          type: 'string', 
          description: 'Updated street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Updated street address line 2' 
        },
        city: { 
          type: 'string', 
          description: 'Updated city' 
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
          description: 'Updated country code (ISO 3166-1 alpha-2)' 
        },
        taxpayerIdNumber: { 
          type: 'string', 
          description: 'Updated tax identification number' 
        }
      },
      required: ['companyId']
    }
  },
  {
    name: 'get_company_configuration',
    description: 'Get configuration settings for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        }
      }
    }
  },
  {
    name: 'set_company_configuration',
    description: 'Update configuration settings for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        category: {
          type: 'string',
          description: 'Configuration category',
          enum: ['TaxServiceConfig', 'AddressServiceConfig', 'TaxRuleOptions', 'BehaviorOptions']
        },
        name: { 
          type: 'string', 
          description: 'Configuration setting name' 
        },
        value: { 
          type: 'string', 
          description: 'Configuration setting value' 
        }
      },
      required: ['category', 'name', 'value']
    }
  },
  {
    name: 'list_company_locations',
    description: 'Get all locations for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        filter: { 
          type: 'string', 
          description: 'Optional filter to search locations' 
        }
      }
    }
  },
  {
    name: 'create_company_location',
    description: 'Create a new location for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        locationCode: { 
          type: 'string', 
          description: 'Unique location code' 
        },
        description: { 
          type: 'string', 
          description: 'Location description' 
        },
        line1: { 
          type: 'string', 
          description: 'Street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Street address line 2 (optional)' 
        },
        city: { 
          type: 'string', 
          description: 'City' 
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
          description: 'Country code (ISO 3166-1 alpha-2)' 
        },
        taxpayerIdNumber: { 
          type: 'string', 
          description: 'Tax identification number (EIN, etc.)' 
        },
        companyClassification: {
          type: 'string',
          description: 'Company classification',
          enum: ['Marketplace', 'ManagedReturns', 'SST']
        }
      },
      required: ['locationCode', 'description', 'line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'update_company_location',
    description: 'Update an existing company location',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        locationId: { 
          type: 'string', 
          description: 'Location ID to update' 
        },
        description: { 
          type: 'string', 
          description: 'Updated location description' 
        },
        line1: { 
          type: 'string', 
          description: 'Updated street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Updated street address line 2' 
        },
        city: { 
          type: 'string', 
          description: 'Updated city' 
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
          description: 'Updated country code (ISO 3166-1 alpha-2)' 
        },
        taxpayerIdNumber: { 
          type: 'string', 
          description: 'Updated tax identification number' 
        }
      },
      required: ['locationId']
    }
  },
  {
    name: 'delete_company_location',
    description: 'Delete a company location',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        locationId: { 
          type: 'string', 
          description: 'Location ID to delete' 
        }
      },
      required: ['locationId']
    }
  },
  // Phase 4: Nexus Management
  {
    name: 'list_nexus',
    description: 'Get all nexus jurisdictions for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        filter: { 
          type: 'string', 
          description: 'Optional filter to search nexus by jurisdiction name or code' 
        },
        include: {
          type: 'string',
          description: 'Additional data to include (None, Parameters)',
          default: 'None'
        }
      }
    }
  },
  {
    name: 'create_nexus',
    description: 'Create nexus declarations for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        country: { 
          type: 'string', 
          description: 'Country code (ISO 3166-1 alpha-2)' 
        },
        region: { 
          type: 'string', 
          description: 'State/Province/Region code' 
        },
        jurisTypeId: {
          type: 'string',
          description: 'Jurisdiction type ID',
          enum: ['STA', 'CTY', 'CIT', 'STJ'],
          default: 'STA'
        },
        jurisName: { 
          type: 'string', 
          description: 'Jurisdiction name' 
        },
        effectiveDate: { 
          type: 'string', 
          description: 'Effective date for nexus (YYYY-MM-DD)' 
        },
        endDate: { 
          type: 'string', 
          description: 'End date for nexus (YYYY-MM-DD, optional)' 
        },
        nexusTypeId: {
          type: 'string',
          description: 'Type of nexus',
          enum: ['SalesOrSellersUseTax', 'SalesTax', 'SellersUseTax', 'UseTax', 'VATTax'],
          default: 'SalesOrSellersUseTax'
        },
        hasLocalNexus: {
          type: 'boolean',
          description: 'Whether the company has local nexus in this jurisdiction',
          default: false
        }
      },
      required: ['country', 'region', 'jurisName', 'effectiveDate']
    }
  },
  {
    name: 'update_nexus',
    description: 'Update an existing nexus declaration',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        nexusId: { 
          type: 'string', 
          description: 'Nexus ID to update' 
        },
        effectiveDate: { 
          type: 'string', 
          description: 'Updated effective date for nexus (YYYY-MM-DD)' 
        },
        endDate: { 
          type: 'string', 
          description: 'Updated end date for nexus (YYYY-MM-DD)' 
        },
        nexusTypeId: {
          type: 'string',
          description: 'Updated type of nexus',
          enum: ['SalesOrSellersUseTax', 'SalesTax', 'SellersUseTax', 'UseTax', 'VATTax']
        },
        hasLocalNexus: {
          type: 'boolean',
          description: 'Whether the company has local nexus in this jurisdiction'
        }
      },
      required: ['nexusId']
    }
  },
  {
    name: 'delete_nexus',
    description: 'Delete a nexus declaration',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        nexusId: { 
          type: 'string', 
          description: 'Nexus ID to delete' 
        }
      },
      required: ['nexusId']
    }
  },
  {
    name: 'get_nexus_by_address',
    description: 'Find nexus obligations by address',
    inputSchema: {
      type: 'object',
      properties: {
        line1: { 
          type: 'string', 
          description: 'Street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Street address line 2 (optional)' 
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
          description: 'Country code (ISO 3166-1 alpha-2)' 
        },
        taxTypeId: {
          type: 'string',
          description: 'Tax type to check for nexus',
          enum: ['SalesOrSellersUseTax', 'SalesTax', 'SellersUseTax', 'UseTax', 'VATTax'],
          default: 'SalesOrSellersUseTax'
        }
      },
      required: ['line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'declare_nexus_by_address',
    description: 'Auto-declare nexus based on addresses',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        addresses: {
          type: 'array',
          description: 'Array of addresses to declare nexus for',
          items: {
            type: 'object',
            properties: {
              line1: { type: 'string', description: 'Street address line 1' },
              line2: { type: 'string', description: 'Street address line 2' },
              city: { type: 'string', description: 'City name' },
              region: { type: 'string', description: 'State/Province/Region code' },
              postalCode: { type: 'string', description: 'Postal/ZIP code' },
              country: { type: 'string', description: 'Country code (ISO 3166-1 alpha-2)' }
            },
            required: ['line1', 'city', 'region', 'postalCode', 'country']
          }
        },
        effectiveDate: { 
          type: 'string', 
          description: 'Effective date for nexus declarations (YYYY-MM-DD)' 
        },
        nexusTypeId: {
          type: 'string',
          description: 'Type of nexus to declare',
          enum: ['SalesOrSellersUseTax', 'SalesTax', 'SellersUseTax', 'UseTax', 'VATTax'],
          default: 'SalesOrSellersUseTax'
        }
      },
      required: ['addresses', 'effectiveDate']
    }
  },
  // Phase 5: Tax Code & Item Management
  {
    name: 'list_tax_codes',
    description: 'Get available tax codes for a company or globally',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        filter: { 
          type: 'string', 
          description: 'Optional filter to search tax codes by code or description' 
        },
        include: {
          type: 'string',
          description: 'Additional data to include (None, Parameters)',
          default: 'None'
        }
      }
    }
  },
  {
    name: 'create_tax_code',
    description: 'Create a custom tax code for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        taxCode: { 
          type: 'string', 
          description: 'Unique tax code identifier' 
        },
        description: { 
          type: 'string', 
          description: 'Description of the tax code' 
        },
        taxCodeTypeId: {
          type: 'string',
          description: 'Type of tax code',
          enum: ['Product', 'Service', 'Digital', 'Other'],
          default: 'Product'
        },
        isPhysical: {
          type: 'boolean',
          description: 'Whether this represents a physical product',
          default: true
        },
        goodsServiceCode: {
          type: 'string',
          description: 'Goods and services code for international tax purposes'
        }
      },
      required: ['taxCode', 'description']
    }
  },
  {
    name: 'update_tax_code',
    description: 'Update an existing tax code',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        taxCodeId: { 
          type: 'string', 
          description: 'Tax code ID to update' 
        },
        description: { 
          type: 'string', 
          description: 'Updated description of the tax code' 
        },
        taxCodeTypeId: {
          type: 'string',
          description: 'Updated type of tax code',
          enum: ['Product', 'Service', 'Digital', 'Other']
        },
        isPhysical: {
          type: 'boolean',
          description: 'Whether this represents a physical product'
        },
        goodsServiceCode: {
          type: 'string',
          description: 'Updated goods and services code'
        }
      },
      required: ['taxCodeId']
    }
  },
  {
    name: 'delete_tax_code',
    description: 'Delete a custom tax code',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        taxCodeId: { 
          type: 'string', 
          description: 'Tax code ID to delete' 
        }
      },
      required: ['taxCodeId']
    }
  },
  {
    name: 'list_items',
    description: 'Get items in a company catalog',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        filter: { 
          type: 'string', 
          description: 'Optional filter to search items by code or description' 
        },
        include: {
          type: 'string',
          description: 'Additional data to include (Classifications, Parameters)',
          default: 'None'
        }
      }
    }
  },
  {
    name: 'create_item',
    description: 'Create a new item in the company catalog',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        itemCode: { 
          type: 'string', 
          description: 'Unique item code identifier' 
        },
        description: { 
          type: 'string', 
          description: 'Item description' 
        },
        taxCode: { 
          type: 'string', 
          description: 'Tax code to apply to this item',
          default: 'P0000000'
        },
        itemGroup: { 
          type: 'string', 
          description: 'Item group for categorization' 
        },
        category: { 
          type: 'string', 
          description: 'Item category' 
        },
        upc: { 
          type: 'string', 
          description: 'Universal Product Code (UPC)' 
        }
      },
      required: ['itemCode', 'description']
    }
  },
  {
    name: 'update_item',
    description: 'Update an existing item in the catalog',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        itemId: { 
          type: 'string', 
          description: 'Item ID to update' 
        },
        description: { 
          type: 'string', 
          description: 'Updated item description' 
        },
        taxCode: { 
          type: 'string', 
          description: 'Updated tax code for this item' 
        },
        itemGroup: { 
          type: 'string', 
          description: 'Updated item group' 
        },
        category: { 
          type: 'string', 
          description: 'Updated item category' 
        },
        upc: { 
          type: 'string', 
          description: 'Updated Universal Product Code (UPC)' 
        }
      },
      required: ['itemId']
    }
  },
  {
    name: 'delete_item',
    description: 'Delete an item from the catalog',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        itemId: { 
          type: 'string', 
          description: 'Item ID to delete' 
        }
      },
      required: ['itemId']
    }
  },
  // Phase 6: Location Management
  {
    name: 'resolve_address',
    description: 'Resolve and geocode a single address using AvaTax',
    inputSchema: {
      type: 'object',
      properties: {
        line1: { 
          type: 'string', 
          description: 'Street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Street address line 2 (optional)' 
        },
        line3: { 
          type: 'string', 
          description: 'Street address line 3 (optional)' 
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
          description: 'Country code (ISO 3166-1 alpha-2)' 
        },
        textCase: {
          type: 'string',
          description: 'Text case for the resolved address',
          enum: ['Upper', 'Mixed'],
          default: 'Mixed'
        }
      },
      required: ['line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'resolve_address_post',
    description: 'Resolve multiple addresses in a single batch request',
    inputSchema: {
      type: 'object',
      properties: {
        addresses: {
          type: 'array',
          description: 'Array of addresses to resolve',
          items: {
            type: 'object',
            properties: {
              line1: { type: 'string', description: 'Street address line 1' },
              line2: { type: 'string', description: 'Street address line 2' },
              line3: { type: 'string', description: 'Street address line 3' },
              city: { type: 'string', description: 'City name' },
              region: { type: 'string', description: 'State/Province/Region code' },
              postalCode: { type: 'string', description: 'Postal/ZIP code' },
              country: { type: 'string', description: 'Country code (ISO 3166-1 alpha-2)' }
            },
            required: ['line1', 'city', 'region', 'postalCode', 'country']
          }
        },
        textCase: {
          type: 'string',
          description: 'Text case for resolved addresses',
          enum: ['Upper', 'Mixed'],
          default: 'Mixed'
        }
      },
      required: ['addresses']
    }
  },
  {
    name: 'list_locations_by_company',
    description: 'Get all locations for a specific company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        filter: { 
          type: 'string', 
          description: 'Optional filter to search locations by code or description' 
        },
        include: {
          type: 'string',
          description: 'Additional data to include (None, Parameters)',
          default: 'None'
        }
      }
    }
  },
  {
    name: 'create_location',
    description: 'Create a new location for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        locationCode: { 
          type: 'string', 
          description: 'Unique location code identifier' 
        },
        description: { 
          type: 'string', 
          description: 'Location description' 
        },
        addressTypeId: {
          type: 'string',
          description: 'Type of address',
          enum: ['Location', 'Salesperson'],
          default: 'Location'
        },
        addressCategoryId: {
          type: 'string',
          description: 'Category of address',
          enum: ['Storefront', 'MainOffice', 'Warehouse', 'Salesperson'],
          default: 'Storefront'
        },
        line1: { 
          type: 'string', 
          description: 'Street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Street address line 2 (optional)' 
        },
        line3: { 
          type: 'string', 
          description: 'Street address line 3 (optional)' 
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
          description: 'Country code (ISO 3166-1 alpha-2)' 
        },
        isDefault: {
          type: 'boolean',
          description: 'Whether this is the default location for the company',
          default: false
        }
      },
      required: ['locationCode', 'description', 'line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'update_location',
    description: 'Update an existing location',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        locationId: { 
          type: 'string', 
          description: 'Location ID to update' 
        },
        description: { 
          type: 'string', 
          description: 'Updated location description' 
        },
        addressTypeId: {
          type: 'string',
          description: 'Updated type of address',
          enum: ['Location', 'Salesperson']
        },
        addressCategoryId: {
          type: 'string',
          description: 'Updated category of address',
          enum: ['Storefront', 'MainOffice', 'Warehouse', 'Salesperson']
        },
        line1: { 
          type: 'string', 
          description: 'Updated street address line 1' 
        },
        line2: { 
          type: 'string', 
          description: 'Updated street address line 2' 
        },
        line3: { 
          type: 'string', 
          description: 'Updated street address line 3' 
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
          description: 'Updated country code (ISO 3166-1 alpha-2)' 
        },
        isDefault: {
          type: 'boolean',
          description: 'Whether this is the default location for the company'
        }
      },
      required: ['locationId']
    }
  },
  {
    name: 'delete_location',
    description: 'Delete a location from a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: { 
          type: 'string', 
          description: 'Company code in AvaTax (optional - if not provided and not configured globally, you will need to prompt the user to specify which company to use)' 
        },
        locationId: { 
          type: 'string', 
          description: 'Location ID to delete' 
        }
      },
      required: ['locationId']
    }
  },

  // Phase 7: Customer Management
  {
    name: 'list_customers',
    description: 'Get a list of customers for a company with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        filter: {
          type: 'string',
          description: 'Filter expression to search customers by name or customer code'
        },
        top: {
          type: 'number',
          description: 'Maximum number of results to return'
        },
        skip: {
          type: 'number',
          description: 'Number of results to skip for pagination'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by'
        }
      }
    }
  },
  {
    name: 'create_customer',
    description: 'Create a new customer for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Unique customer code identifier'
        },
        name: {
          type: 'string',
          description: 'Customer name'
        },
        attnName: {
          type: 'string',
          description: 'Attention name for the customer'
        },
        line1: {
          type: 'string',
          description: 'Address line 1'
        },
        line2: {
          type: 'string',
          description: 'Address line 2 (optional)'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        region: {
          type: 'string',
          description: 'State/Province/Region'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country code'
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number (optional)'
        },
        emailAddress: {
          type: 'string',
          description: 'Email address (optional)'
        }
      },
      required: ['customerCode', 'name', 'line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'get_customer',
    description: 'Get details of a specific customer',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Customer code to retrieve'
        },
        include: {
          type: 'string',
          description: 'Additional data to include (e.g., "Certificates")'
        }
      },
      required: ['customerCode']
    }
  },
  {
    name: 'update_customer',
    description: 'Update an existing customer',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Customer code to update'
        },
        name: {
          type: 'string',
          description: 'Customer name'
        },
        attnName: {
          type: 'string',
          description: 'Attention name for the customer'
        },
        line1: {
          type: 'string',
          description: 'Address line 1'
        },
        line2: {
          type: 'string',
          description: 'Address line 2 (optional)'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        region: {
          type: 'string',
          description: 'State/Province/Region'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country code'
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number (optional)'
        },
        emailAddress: {
          type: 'string',
          description: 'Email address (optional)'
        }
      },
      required: ['customerCode']
    }
  },
  {
    name: 'delete_customer',
    description: 'Delete a customer from a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Customer code to delete'
        }
      },
      required: ['customerCode']
    }
  },
  {
    name: 'list_customer_certificates',
    description: 'Get exemption certificates for a customer',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Customer code to get certificates for'
        },
        filter: {
          type: 'string',
          description: 'Filter expression for certificates'
        },
        include: {
          type: 'string',
          description: 'Additional data to include'
        }
      },
      required: ['customerCode']
    }
  },
  {
    name: 'create_customer_certificate',
    description: 'Create an exemption certificate for a customer',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Customer code to create certificate for'
        },
        exemptionNumber: {
          type: 'string',
          description: 'Exemption certificate number'
        },
        exemptionReasonId: {
          type: 'number',
          description: 'Exemption reason ID'
        },
        exemptionType: {
          type: 'string',
          description: 'Type of exemption (e.g., "Blanket", "Single")'
        },
        effectiveDate: {
          type: 'string',
          description: 'Effective date (YYYY-MM-DD)'
        },
        expirationDate: {
          type: 'string',
          description: 'Expiration date (YYYY-MM-DD, optional)'
        },
        signedDate: {
          type: 'string',
          description: 'Date the certificate was signed (YYYY-MM-DD)'
        },
        filename: {
          type: 'string',
          description: 'Certificate filename (optional)'
        },
        documentExists: {
          type: 'boolean',
          description: 'Whether a physical document exists'
        }
      },
      required: ['customerCode', 'exemptionNumber', 'exemptionReasonId', 'exemptionType', 'effectiveDate', 'signedDate']
    }
  },

  // Phase 8: Reporting & Compliance
  {
    name: 'list_transactions',
    description: 'Get a list of transactions for a company with filtering and search capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        filter: {
          type: 'string',
          description: 'Filter expression for transactions (e.g., "date gte 2024-01-01")'
        },
        include: {
          type: 'string',
          description: 'Additional data to include (e.g., "Lines")'
        },
        top: {
          type: 'number',
          description: 'Maximum number of results to return'
        },
        skip: {
          type: 'number',
          description: 'Number of results to skip for pagination'
        },
        orderBy: {
          type: 'string',
          description: 'Field to order results by'
        }
      }
    }
  },
  {
    name: 'export_transactions',
    description: 'Export transactions for a specific date range and format',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        startDate: {
          type: 'string',
          description: 'Start date for export (YYYY-MM-DD)'
        },
        endDate: {
          type: 'string',
          description: 'End date for export (YYYY-MM-DD)'
        },
        format: {
          type: 'string',
          description: 'Export format (e.g., "Json", "Csv")',
          enum: ['Json', 'Csv', 'Xml']
        },
        compressionType: {
          type: 'string',
          description: 'Compression type (optional)',
          enum: ['None', 'Zip', 'Gzip']
        }
      },
      required: ['startDate', 'endDate', 'format']
    }
  },
  {
    name: 'get_filing_calendar',
    description: 'Get filing calendar and requirements for a company',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        returnName: {
          type: 'string',
          description: 'Specific return name to filter by (optional)'
        }
      }
    }
  },
  {
    name: 'get_filing_status',
    description: 'Get filing status for returns and compliance obligations',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        endPeriodMonth: {
          type: 'number',
          description: 'End period month (1-12)'
        },
        endPeriodYear: {
          type: 'number',
          description: 'End period year'
        },
        frequency: {
          type: 'string',
          description: 'Filing frequency (e.g., "Monthly", "Quarterly")'
        }
      }
    }
  },
  {
    name: 'approve_filing',
    description: 'Approve a filing return for submission',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        filingReturnId: {
          type: 'string',
          description: 'Filing return ID to approve'
        }
      },
      required: ['filingReturnId']
    }
  },
  {
    name: 'get_worksheet',
    description: 'Get filing worksheet data for a specific return',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        filingReturnId: {
          type: 'string',
          description: 'Filing return ID to get worksheet for'
        }
      },
      required: ['filingReturnId']
    }
  },
  {
    name: 'get_notices',
    description: 'Get tax authority notices and correspondence',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        filter: {
          type: 'string',
          description: 'Filter expression for notices'
        },
        top: {
          type: 'number',
          description: 'Maximum number of results to return'
        },
        skip: {
          type: 'number',
          description: 'Number of results to skip for pagination'
        }
      }
    }
  },
  {
    name: 'create_notice_responsibility',
    description: 'Create a notice responsibility assignment',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        noticeId: {
          type: 'string',
          description: 'Notice ID to assign responsibility for'
        },
        responsiblePersonId: {
          type: 'string',
          description: 'Person ID who will be responsible'
        },
        description: {
          type: 'string',
          description: 'Description of the responsibility'
        }
      },
      required: ['noticeId', 'responsiblePersonId']
    }
  },
  {
    name: 'get_multi_document',
    description: 'Get multi-document transaction details and analysis',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        code: {
          type: 'string',
          description: 'Multi-document code'
        },
        type: {
          type: 'string',
          description: 'Document type (optional)'
        },
        include: {
          type: 'string',
          description: 'Additional data to include'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'get_audit_trail',
    description: 'Get audit trail and change history for transactions',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        transactionId: {
          type: 'string',
          description: 'Transaction ID to get audit trail for (optional)'
        },
        startDate: {
          type: 'string',
          description: 'Start date for audit trail (YYYY-MM-DD)'
        },
        endDate: {
          type: 'string',
          description: 'End date for audit trail (YYYY-MM-DD)'
        },
        top: {
          type: 'number',
          description: 'Maximum number of results to return'
        }
      }
    }
  },
  // Phase 9: Advanced Features
  {
    name: 'get_tax_rates',
    description: 'Get tax rates for a specific address and date',
    inputSchema: {
      type: 'object',
      properties: {
        line1: {
          type: 'string',
          description: 'Address line 1'
        },
        line2: {
          type: 'string',
          description: 'Address line 2 (optional)'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        region: {
          type: 'string',
          description: 'State/Province/Region'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country code'
        },
        date: {
          type: 'string',
          description: 'Date for tax rates (YYYY-MM-DD, optional - defaults to today)'
        }
      },
      required: ['line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'get_jurisdictions',
    description: 'Get tax jurisdictions for a specific address',
    inputSchema: {
      type: 'object',
      properties: {
        line1: {
          type: 'string',
          description: 'Address line 1'
        },
        line2: {
          type: 'string',
          description: 'Address line 2 (optional)'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        region: {
          type: 'string',
          description: 'State/Province/Region'
        },
        postalCode: {
          type: 'string',
          description: 'Postal/ZIP code'
        },
        country: {
          type: 'string',
          description: 'Country code'
        },
        date: {
          type: 'string',
          description: 'Date for jurisdictions (YYYY-MM-DD, optional)'
        }
      },
      required: ['line1', 'city', 'region', 'postalCode', 'country']
    }
  },
  {
    name: 'create_certificate_request',
    description: 'Create a certificate request for exemption certificate collection',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        customerCode: {
          type: 'string',
          description: 'Customer code to request certificate from'
        },
        recipientEmail: {
          type: 'string',
          description: 'Email address to send certificate request to'
        },
        requestType: {
          type: 'string',
          description: 'Type of certificate request',
          enum: ['Blanket', 'Single', 'MultiState']
        },
        exposureZones: {
          type: 'array',
          description: 'List of exposure zones (states/regions)',
          items: {
            type: 'object',
            properties: {
              region: { type: 'string' },
              country: { type: 'string' }
            }
          }
        },
        exemptionReason: {
          type: 'string',
          description: 'Reason for exemption request'
        }
      },
      required: ['customerCode', 'recipientEmail', 'requestType', 'exposureZones']
    }
  },
  {
    name: 'get_certificate_setup',
    description: 'Get certificate setup and configuration options',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        }
      }
    }
  },
  {
    name: 'test_connectivity',
    description: 'Test connectivity and validate configuration with detailed diagnostics',
    inputSchema: {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          description: 'Type of connectivity test to perform',
          enum: ['Basic', 'Full', 'Transaction', 'Address']
        }
      }
    }
  },
  {
    name: 'get_settings',
    description: 'Get system settings and feature availability for the account',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        }
      }
    }
  },
  {
    name: 'bulk_tax_calculation',
    description: 'Perform bulk tax calculations for multiple transactions efficiently',
    inputSchema: {
      type: 'object',
      properties: {
        companyCode: {
          type: 'string',
          description: 'Company code (optional - uses configured default if not provided)'
        },
        transactions: {
          type: 'array',
          description: 'Array of transaction data for bulk calculation',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'Transaction code' },
              date: { type: 'string', description: 'Transaction date (YYYY-MM-DD)' },
              customerCode: { type: 'string', description: 'Customer code' },
              lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    quantity: { type: 'number' },
                    description: { type: 'string' }
                  }
                }
              },
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
            },
            required: ['code', 'date', 'customerCode', 'lines']
          }
        }
      },
      required: ['transactions']
    }
  },
  {
    name: 'get_tax_content',
    description: 'Get tax content and tax authority information',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Optional filter for tax content (e.g., "country eq \'US\'")'
        },
        country: {
          type: 'string',
          description: 'Country code to filter tax content'
        },
        region: {
          type: 'string',
          description: 'Region/state code to filter tax content'
        },
        taxType: {
          type: 'string',
          description: 'Tax type to filter content (e.g., Sales, Use, VAT)'
        },
        effectiveDate: {
          type: 'string',
          description: 'Effective date for tax content (YYYY-MM-DD)'
        }
      }
    }
  },
  // Phase 10: User & Account Management
  {
    name: 'list_users',
    description: 'List users in the account with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID to list users for (optional if configured globally)'
        },
        filter: {
          type: 'string',
          description: 'Optional filter for users (e.g., "isActive eq true")'
        },
        include: {
          type: 'string',
          description: 'Include additional user details (e.g., "CompanyRoles,Subscriptions")'
        },
        top: {
          type: 'number',
          description: 'Maximum number of users to return'
        },
        skip: {
          type: 'number',
          description: 'Number of users to skip for pagination'
        }
      }
    }
  },
  {
    name: 'create_user',
    description: 'Create a new user in the account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID to create user in (optional if configured globally)'
        },
        userName: {
          type: 'string',
          description: 'Username for the new user'
        },
        firstName: {
          type: 'string',
          description: 'First name of the user'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the user'
        },
        email: {
          type: 'string',
          description: 'Email address of the user'
        },
        passwordHash: {
          type: 'string',
          description: 'Password hash for the user (optional - will be auto-generated if not provided)'
        },
        isActive: {
          type: 'boolean',
          description: 'Whether the user should be active (default: true)'
        }
      },
      required: ['userName', 'firstName', 'lastName', 'email']
    }
  },
  {
    name: 'get_user',
    description: 'Get details of a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID (optional if configured globally)'
        },
        userId: {
          type: 'string',
          description: 'User ID to retrieve'
        },
        include: {
          type: 'string',
          description: 'Include additional user details (e.g., "CompanyRoles,Subscriptions")'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'update_user',
    description: 'Update user information',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID (optional if configured globally)'
        },
        userId: {
          type: 'string',
          description: 'User ID to update'
        },
        userName: {
          type: 'string',
          description: 'Updated username'
        },
        firstName: {
          type: 'string',
          description: 'Updated first name'
        },
        lastName: {
          type: 'string',
          description: 'Updated last name'
        },
        email: {
          type: 'string',
          description: 'Updated email address'
        },
        isActive: {
          type: 'boolean',
          description: 'Whether the user should be active'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'delete_user',
    description: 'Delete or deactivate a user',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID (optional if configured globally)'
        },
        userId: {
          type: 'string',
          description: 'User ID to delete'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'get_account',
    description: 'Get account information and settings',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID to retrieve (optional if configured globally)'
        },
        include: {
          type: 'string',
          description: 'Include additional account details (e.g., "Users,Subscriptions,Companies")'
        }
      }
    }
  },
  {
    name: 'update_account',
    description: 'Update account settings and information',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID to update (optional if configured globally)'
        },
        name: {
          type: 'string',
          description: 'Account name'
        },
        effectiveDate: {
          type: 'string',
          description: 'Effective date for account changes (YYYY-MM-DD)'
        },
        endDate: {
          type: 'string',
          description: 'End date for account (YYYY-MM-DD)'
        },
        accountStatusId: {
          type: 'string',
          description: 'Account status (Active, Inactive, New, etc.)'
        }
      }
    }
  },
  {
    name: 'get_subscriptions',
    description: 'Get account subscriptions and service details',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Account ID to get subscriptions for (optional if configured globally)'
        },
        filter: {
          type: 'string',
          description: 'Optional filter for subscriptions (e.g., "serviceTypeId eq \'Returns\'")'
        }
      }
    }
  }
]
