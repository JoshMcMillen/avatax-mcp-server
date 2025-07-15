# AvaTax Document Types - Quick Reference

## 🎯 **When to Use Which Document Type**

### 📝 **For Estimates & Quotes (Temporary)**

| Document Type | Use Case | Saved to AvaTax? | Recommended Tool |
|---------------|----------|------------------|------------------|
| **SalesOrder** | Shopping cart, price quotes, "what-if" scenarios | ❌ No | `calculate_tax` |
| **PurchaseOrder** | Purchase estimates, vendor quotes | ❌ No | `calculate_tax` |
| **ReturnOrder** | Refund estimates | ❌ No | `calculate_tax` |
| **InventoryTransferOrder** | Inventory movement estimates | ❌ No | `calculate_tax` |

### 📋 **For Final Transactions (Permanent)**

| Document Type | Use Case | Saved to AvaTax? | Recommended Tool |
|---------------|----------|------------------|------------------|
| **SalesInvoice** | Completed sales, final invoices | ✅ Yes | `create_transaction` or `calculate_tax` then `commit_transaction` |
| **PurchaseInvoice** | Completed purchases | ✅ Yes | `create_transaction` |
| **ReturnInvoice** | Processed refunds/returns | ✅ Yes | `create_transaction` |
| **InventoryTransferInvoice** | Completed inventory movements | ✅ Yes | `create_transaction` |

## 🔄 **Transaction Status Flow**

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ SalesOrder  │    │ SalesInvoice │    │ SalesInvoice│
│ (Temporary) │    │   (Saved)    │    │ (Committed) │
│             │    │              │    │             │
│ Not Saved   ├───▶│ Uncommitted  ├───▶│ Tax Ready   │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                    │
                           ▼                    ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ SalesInvoice │    │ SalesInvoice│
                   │   (Voided)   │    │  (Locked)   │
                   │              │    │             │
                   │ Cancelled    │    │ Reported    │
                   └──────────────┘    └─────────────┘
```

## 💡 **MCP Tool Recommendations**

### For E-commerce Shopping Cart
```typescript
// Show customer tax estimate
calculate_tax({
  type: "SalesOrder",  // Temporary - won't create permanent record
  // ... transaction details
})
```

### For Completed Purchase
```typescript
// Create final committed transaction
create_transaction({
  type: "SalesInvoice",  // Permanent & committed
  commit: true,
  // ... transaction details
})
```

### For Two-Step Process
```typescript
// Step 1: Create permanent but uncommitted
calculate_tax({
  type: "SalesInvoice",  // Permanent but not yet committed
  // ... transaction details
})

// Step 2: Review and commit when ready
commit_transaction({
  companyCode: "YOUR_COMPANY",
  transactionCode: "TXN-12345"
})
```

## ⚠️ **Critical Guidelines**

### ✅ **DO**
- Use **SalesOrder** for quotes, estimates, shopping carts
- Use **SalesInvoice** for final invoices and completed sales
- Include date filters when listing transactions
- Check transaction status before making modifications
- Use proper company codes for multi-entity businesses

### ❌ **DON'T**
- Don't use SalesOrder for final transactions (won't be saved)
- Don't commit SalesOrder types (they're temporary by design)
- Don't modify locked transactions (already reported to tax authorities)
- Don't forget date filters in transaction lists (defaults to 30 days)
- Don't use commit=true with calculate_tax for estimates

## 🚀 **Performance Tips**

### High-Volume Estimates
- Use `SalesOrder` with `calculate_tax`
- No permanent records created
- Faster processing
- No cleanup needed

### Transaction Records
- Use `SalesInvoice` with `create_transaction`
- Creates audit trail
- Available for reporting
- Requires proper lifecycle management

## 📞 **Getting Help**

If you're unsure which document type to use:

1. **Ask yourself**: "Do I need a permanent tax record?"
   - Yes → Use Invoice types
   - No → Use Order types

2. **Consider the use case**:
   - Pricing/quotes → SalesOrder
   - Final invoice → SalesInvoice
   - Customer return → ReturnInvoice

3. **Check transaction purpose**:
   - Estimation → Temporary (Order types)
   - Tax compliance → Permanent (Invoice types)

Remember: You can always start with estimates (SalesOrder) and create final transactions (SalesInvoice) later!
