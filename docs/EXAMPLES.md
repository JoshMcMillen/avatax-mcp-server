# AvaTax MCP Server - Practical Examples

This document provides real-world examples of using the AvaTax MCP Server for common business scenarios.

## 🛒 **E-commerce Scenarios**

### Shopping Cart Tax Calculation
```
User Request: "Calculate tax for a customer's cart: 2 books at $15 each, 1 software license at $99, shipping from Seattle to Los Angeles"

Claude Response: I'll calculate the tax estimate for this shopping cart using a temporary SalesOrder.

MCP Tool Used: calculate_tax
Parameters:
- type: "SalesOrder" (temporary estimate)
- date: "2024-01-15"
- customerCode: "GUEST_CUSTOMER"
- shipFrom: { line1: "123 Business St", city: "Seattle", region: "WA", postalCode: "98101", country: "US" }
- shipTo: { line1: "456 Customer Ave", city: "Los Angeles", region: "CA", postalCode: "90210", country: "US" }
- lines: [
    { quantity: 2, amount: 30, description: "Books", taxCode: "PB200000" },
    { quantity: 1, amount: 99, description: "Software License", taxCode: "PS081282" }
  ]
```

### Order Completion
```
User Request: "Customer completed checkout - create final transaction for order #ORDER-2024-001"

Claude Response: I'll create a committed transaction for the completed order.

MCP Tool Used: create_transaction
Parameters:
- type: "SalesInvoice" (final committed transaction)
- commit: true
- customerCode: "CUST-12345"
- [same transaction details as estimate]
```

## 🏢 **B2B Invoice Processing**

### Creating Business Invoice
```
User Request: "Create invoice INV-2024-0089 for Acme Corp: $5,000 consulting services, $2,500 software, ship from our NYC office to their Austin office"

MCP Tool Used: create_transaction
Parameters:
- type: "SalesInvoice"
- code: "INV-2024-0089"
- customerCode: "ACME-CORP"
- date: "2024-01-15"
- shipFrom: { line1: "100 Wall St", city: "New York", region: "NY", postalCode: "10005", country: "US" }
- shipTo: { line1: "500 Congress Ave", city: "Austin", region: "TX", postalCode: "78701", country: "US" }
- lines: [
    { quantity: 1, amount: 5000, description: "Consulting Services", taxCode: "P0000000" },
    { quantity: 1, amount: 2500, description: "Software License", taxCode: "PS081282" }
  ]
```

## 🔄 **Transaction Management Workflows**

### Monthly Transaction Review
```
User Request: "Show me all uncommitted transactions from December 2023"

MCP Tool Used: list_transactions
Parameters:
- filter: "date ge '2023-12-01' and date le '2023-12-31' and status eq 'Saved'"
- include: "Lines,Summary"

Follow-up: "Commit transaction INV-2023-1205"

MCP Tool Used: commit_transaction
Parameters:
- transactionCode: "INV-2023-1205"
- companyCode: "DEFAULT"
```

### Transaction Correction
```
User Request: "Invoice INV-2024-0050 has wrong amount - it should be $1,200 not $1,000"

Step 1 - Get current transaction:
MCP Tool Used: get_transaction
Parameters:
- transactionCode: "INV-2024-0050"
- include: "Lines,Details"

Step 2 - Adjust the transaction:
MCP Tool Used: adjust_transaction
Parameters:
- transactionCode: "INV-2024-0050"
- newTransaction: {
    date: "2024-01-15",
    customerCode: "CUST-789",
    lines: [{ quantity: 1, amount: 1200, description: "Corrected amount" }]
  }
```

### Void Cancelled Order
```
User Request: "Cancel order ORD-2024-0123 - customer requested cancellation"

MCP Tool Used: void_transaction
Parameters:
- transactionCode: "ORD-2024-0123"
- code: "DocVoided"

Result: Transaction status changes to "DocVoided"
```

## 🏪 **Retail Scenarios**

### Point of Sale Transaction
```
User Request: "Ring up sale: 3 t-shirts at $25 each, 1 pair jeans at $80, customer pickup at our Dallas store"

MCP Tool Used: create_transaction
Parameters:
- type: "SalesInvoice"
- customerCode: "WALK-IN-CUSTOMER"
- date: "2024-01-15"
- shipFrom: { line1: "789 Main St", city: "Dallas", region: "TX", postalCode: "75201", country: "US" }
- shipTo: { line1: "789 Main St", city: "Dallas", region: "TX", postalCode: "75201", country: "US" }
- lines: [
    { quantity: 3, amount: 75, description: "T-Shirts", itemCode: "TSHIRT-001" },
    { quantity: 1, amount: 80, description: "Jeans", itemCode: "JEANS-001" }
  ]
```

### Return Processing
```
User Request: "Process return for invoice INV-2024-0045: customer returning 1 defective item worth $50"

MCP Tool Used: create_transaction
Parameters:
- type: "ReturnInvoice"
- customerCode: "CUST-456"
- date: "2024-01-15"
- lines: [
    { quantity: 1, amount: -50, description: "Returned defective item", itemCode: "ITEM-001" }
  ]
```

## 🌍 **Multi-Location Business**

### Company Switching
```
User Request: "Switch to our West Coast company and calculate tax for CA sale"

Step 1 - Switch company:
MCP Tool Used: set_default_company
Parameters:
- companyCode: "WESTCOAST"

Step 2 - Calculate tax:
MCP Tool Used: calculate_tax
Parameters:
- type: "SalesOrder"
- [transaction details]
```

### Nexus Management
```
User Request: "We're opening new office in Austin - declare nexus"

MCP Tool Used: declare_nexus_by_address
Parameters:
- line1: "500 Congress Ave"
- city: "Austin"
- region: "TX"
- country: "US"
- postalCode: "78701"
- effectiveDate: "2024-02-01"
```

## 📊 **Compliance & Audit**

### Transaction Audit Trail
```
User Request: "Get audit information for transaction INV-2024-0100 for compliance review"

MCP Tool Used: get_transaction_audit
Parameters:
- transactionCode: "INV-2024-0100"

Returns:
- Creation timestamp
- Processing duration
- Original API call details
- Company information
```

### Verification Before Filing
```
User Request: "Verify all transactions from Q4 2023 before tax filing"

Step 1 - List Q4 transactions:
MCP Tool Used: list_transactions
Parameters:
- filter: "date ge '2023-10-01' and date le '2023-12-31' and status eq 'Committed'"

Step 2 - Verify specific transaction:
MCP Tool Used: verify_transaction
Parameters:
- transactionCode: "INV-2023-Q4-001"
```

## 🔧 **Troubleshooting Examples**

### Address Validation Error
```
User Request: "Having trouble with tax calculation - address seems wrong"

Step 1 - Validate address:
MCP Tool Used: validate_address
Parameters:
- line1: "123 Main Street"
- city: "Anytown"
- region: "CA"
- postalCode: "90210"
- country: "US"

Result: Returns corrected/validated address for use in tax calculation
```

### Finding Lost Transaction
```
User Request: "Can't find transaction for customer XYZ from last week"

MCP Tool Used: list_transactions
Parameters:
- filter: "date ge '2024-01-08' and date le '2024-01-15' and customerCode eq 'XYZ'"
- include: "Summary"
```

### Account Connectivity Check
```
User Request: "Test if AvaTax is working properly"

MCP Tool Used: ping_service

Returns:
- Authentication status
- Service availability
- API response time
```

## 💡 **Advanced Workflows**

### Bulk Transaction Processing
```
User Request: "Process multiple invoices from our ERP export"

Workflow:
1. For each invoice:
   - Use calculate_tax (type: SalesInvoice) to create saved transaction
   - Review results
   - Use commit_transaction to finalize
2. Use list_transactions to verify all committed properly
```

### Error Recovery
```
User Request: "I created wrong transaction type - fix it"

Scenario: Created SalesOrder but needed SalesInvoice

Solution:
1. SalesOrder is temporary (not saved) - no cleanup needed
2. Create new transaction with correct type:
   - Use create_transaction with type: "SalesInvoice"
```

### Environment Switching
```
User Request: "Test in sandbox then promote to production"

Step 1 - Test in sandbox:
MCP Tool Used: switch_account
Parameters:
- accountName: "sandbox"

[Run transactions]

Step 2 - Switch to production:
MCP Tool Used: switch_account  
Parameters:
- accountName: "production"

[Create production transactions]
```

## 📝 **Best Practices Summary**

1. **Always use SalesOrder for estimates** - they don't create permanent records
2. **Use SalesInvoice for final transactions** - they create proper audit trails
3. **Include date filters in searches** - avoid timeout issues
4. **Validate addresses first** - ensures accurate tax calculations  
5. **Check transaction status** - before attempting modifications
6. **Use appropriate company codes** - for multi-entity businesses
7. **Keep transaction codes unique** - within each company/document type combination

These examples show how the AvaTax MCP Server integrates seamlessly with natural language requests to handle complex tax scenarios efficiently and accurately.
