# AvaTax Transaction Management Guide

This guide provides comprehensive information about AvaTax transaction operations, document types, and workflow patterns for the MCP server.

## Transaction Document Types - Critical Understanding

### 🔄 **Temporary vs Permanent Transactions**

AvaTax distinguishes between temporary calculations and permanent tax records:

#### **Order Types (Temporary - NOT saved to tax history)**
- **SalesOrder**: Quotes, estimates, shopping cart calculations
- **PurchaseOrder**: Purchase quotes and estimates  
- **ReturnOrder**: Refund estimates
- **InventoryTransferOrder**: Inventory movement estimates

#### **Invoice Types (Permanent - SAVED to AvaTax)**
- **SalesInvoice**: Final sales transactions
- **PurchaseInvoice**: Final purchase transactions
- **ReturnInvoice**: Final refunds/returns
- **InventoryTransferInvoice**: Final inventory movements

### 📊 **Transaction Status Lifecycle**

1. **Saved** - Permanent transaction created but not committed
2. **Committed** - Available for tax reporting and compliance
3. **Locked** - Reported to tax authorities (cannot be modified)
4. **Voided** - Cancelled transaction
5. **Adjusted** - Original transaction replaced with new version

## MCP Tools and Usage Patterns

### 💰 **Tax Calculation Workflow**

#### For Quotes/Estimates (Recommended)
```
Tool: calculate_tax
Document Type: SalesOrder
Purpose: Get tax estimate without creating permanent record
Status: Temporary (not saved)
Use Case: Shopping cart, pricing quotes, "what-if" scenarios
```

#### For Final Transactions  
```
Tool: create_transaction  
Document Type: SalesInvoice
Purpose: Create committed transaction for tax filing
Status: Committed (immediately available for reporting)
Use Case: Final invoices, completed sales
```

#### Alternative: Two-Step Process
```
1. Tool: calculate_tax (type: SalesInvoice)
   - Creates permanent but uncommitted transaction
   - Allows review before commitment

2. Tool: commit_transaction  
   - Commits the transaction for reporting
   - Makes it available for tax filing
```

### 🔍 **Transaction Discovery**

#### Finding Transactions
```
Tool: list_transactions
Required: filter with date range
Example: "date ge '2024-01-01' and date le '2024-01-31'"
Use Case: Find transactions to commit, void, or adjust
```

#### Transaction Details
```
Tool: get_transaction
Parameters: companyCode, transactionCode
Use Case: Review transaction before making changes
```

### ✏️ **Transaction Modifications**

#### Committing Transactions
```
Tool: commit_transaction
Prerequisite: Transaction must be in "Saved" status
Effect: Makes transaction available for tax reporting
Restriction: Cannot commit already committed, voided, or locked transactions
```

#### Voiding Transactions  
```
Tool: void_transaction
Purpose: Cancel a transaction permanently
Effect: Transaction status becomes "DocVoided"
Restriction: Cannot void locked transactions (already reported)
Use Case: Cancelled orders, duplicate transactions
```

#### Adjusting Transactions
```
Tool: adjust_transaction
Prerequisite: Transaction must be "Committed"
Effect: Original becomes "Adjusted", new version becomes current
Restriction: Cannot adjust locked transactions
Use Case: Correct errors in committed transactions
```

#### Uncommitting Transactions
```
Tool: uncommit_transaction  
Purpose: Change committed transaction back to "Saved"
Effect: Removes from tax reporting until recommitted
Use Case: Make changes to committed transactions
```

### 🛠️ **Administrative Operations**

#### Code Management
```
Tool: change_transaction_code
Purpose: Rename transaction code
Restriction: Transaction must not be committed, voided, or locked
Use Case: Correct transaction codes before commitment
```

#### Verification & Audit
```
Tool: verify_transaction
Purpose: Validate transaction data and compliance

Tool: get_transaction_audit
Purpose: Get creation details, processing time, API call info
Use Case: Debugging, compliance audit trails
```

## Best Practices and Recommendations

### 🎯 **Document Type Selection**

#### Use SalesOrder When:
- Showing prices in shopping cart
- Providing tax estimates to customers
- "What-if" tax calculations
- Quote generation

#### Use SalesInvoice When:
- Creating final committed transactions
- Need permanent tax record
- Compliance reporting required
- Transaction will be invoiced

### ⚡ **Performance Considerations**

#### For High-Volume Estimates
- Use `SalesOrder` type with `calculate_tax`
- Avoids creating permanent records
- Faster processing
- No cleanup required

#### For Transaction Records
- Use `SalesInvoice` type with `create_transaction`
- Creates permanent, committed record
- Immediate compliance reporting
- Requires proper transaction management

### 🔒 **Compliance and Reporting**

#### Tax Reporting Requirements
- Only **committed** transactions appear in tax reports
- **Locked** transactions have been reported to authorities
- **Voided** transactions appear as cancelled in reports
- **Adjusted** transactions show correction history

#### Audit Trail
- All transaction modifications create audit records
- Use `get_transaction_audit` for compliance documentation
- Original API calls are reconstructed for auditing

### ⚠️ **Common Pitfalls to Avoid**

1. **Using wrong document type**
   - Don't use SalesOrder for final transactions
   - Don't use SalesInvoice for temporary calculations

2. **Modifying locked transactions**
   - Check transaction status before modifications
   - Locked transactions cannot be changed

3. **Missing date filters**
   - Always include date range in list_transactions
   - Defaults to last 30 days only

4. **Committing estimates**
   - Don't commit SalesOrder types
   - Use appropriate Invoice types for final transactions

## Error Handling

### Common Error Scenarios

#### Transaction Not Found
- Verify company code and transaction code
- Check if transaction was voided or deleted
- Ensure proper encoding of special characters

#### Cannot Modify Transaction
- Check transaction status (may be locked)
- Verify user permissions
- Ensure transaction hasn't been reported

#### Invalid Document Type
- Use appropriate type for operation
- Orders for estimates, Invoices for final transactions
- Check enum values in tool definitions

### Special Character Encoding

When transaction codes contain special characters:
- `/` becomes `_-ava2f-_`
- `+` becomes `_-ava2b-_`  
- `?` becomes `_-ava3f-_`
- `%` becomes `_-ava25-_`
- `#` becomes `_-ava23-_`
- ` ` (space) becomes `%20`

## Examples

### Complete Sales Workflow
```
1. Customer browsing (estimate):
   calculate_tax(type: "SalesOrder", ...)

2. Customer checkout (final):
   create_transaction(type: "SalesInvoice", commit: true, ...)

3. Later correction needed:
   adjust_transaction(companyCode, transactionCode, newTransaction, ...)
```

### Transaction Management Workflow
```
1. Find transactions to review:
   list_transactions(filter: "date ge '2024-01-01' and status eq 'Saved'")

2. Review specific transaction:
   get_transaction(companyCode, transactionCode)

3. Commit for reporting:
   commit_transaction(companyCode, transactionCode)
```

This comprehensive transaction management system provides full control over the AvaTax transaction lifecycle while ensuring compliance with tax reporting requirements.
