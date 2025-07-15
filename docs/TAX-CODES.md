# Tax Code Management

This document provides comprehensive information about AvaTax tax codes and how to use the tax code endpoints in this MCP server.

## Overview

Tax codes in AvaTax are essential for accurate tax calculation. They represent uniquely identified types of products, goods, or services. Avalara provides thousands of pre-defined tax codes, and companies can also create custom tax codes for specific business needs.

## Types of Tax Codes

### 1. System Tax Codes
- Pre-defined by Avalara for common products and services
- Cover all major product categories with proper tax treatment
- Maintained and updated by Avalara's tax experts
- Recommended for most standard business needs

### 2. Company Tax Codes
- Custom tax codes created specifically for your company
- Used when system tax codes don't meet specific business requirements
- Can override system tax code behavior for particular jurisdictions
- Useful for unique products or special tax treatments

## Tax Code Types

Tax codes are categorized by type:

- **P** - Physical goods (tangible products)
- **D** - Digital products (software, downloads, digital services)
- **S** - Services (professional services, consulting, etc.)
- **N** - Non-taxable items

## Available Endpoints

### System Tax Code Endpoints

#### `get_system_tax_codes`
**Purpose**: Retrieve Avalara's standard tax codes
**When to Use**:
- Finding appropriate tax codes for standard products
- Researching available tax classifications
- Validating tax code assignments
- Browsing tax codes by category or description

**Example Usage**:
```
Search for clothing tax codes:
filter: "description contains 'clothing'"

Find all physical goods tax codes:
filter: "taxCodeTypeId eq 'P'"

Get tax codes sorted by description:
orderBy: "description asc"
```

#### `get_tax_code_types`
**Purpose**: Get broad categories of tax codes
**When to Use**:
- Understanding high-level tax code categories
- Planning product classification strategy
- Filtering tax codes by broad type

### Company Tax Code Endpoints

#### `get_company_tax_codes`
**Purpose**: List custom tax codes for your company
**When to Use**:
- Reviewing existing custom tax codes
- Auditing tax code configuration
- Managing company tax code catalog
- Preparing for tax code cleanup

**Example Usage**:
```
Get only active tax codes:
filter: "isActive eq true"

Search custom tax codes:
filter: "description contains 'custom'"
```

#### `get_tax_code`
**Purpose**: Get detailed information about a specific tax code
**When to Use**:
- Examining tax code properties before use
- Troubleshooting tax code issues
- Validating tax code configuration

#### `create_tax_code`
**Purpose**: Create new custom tax codes
**When to Use**:
- Need specialized tax treatment not covered by system codes
- Creating company-specific product classifications
- Setting up tax codes for unique business requirements

**Required Fields**:
- `taxCode`: Unique identifier (max 25 characters)
- `taxCodeTypeId`: Type (P, D, S, or N)

**Optional Fields**:
- `description`: Human-readable description
- `parentTaxCode`: Parent tax code if this is a subset
- `goodsServiceCode`: Avalara Goods and Service Code
- `entityUseCode`: Entity Use Code for exemptions
- `isActive`: Whether the code is active (default: true)
- `isSSTCertified`: SST certification status

**Example**:
```json
{
  "taxCodes": [
    {
      "taxCode": "CUST001",
      "taxCodeTypeId": "P",
      "description": "Custom Widget Type A",
      "isActive": true
    }
  ]
}
```

#### `update_tax_code`
**Purpose**: Modify existing custom tax codes
**When to Use**:
- Updating tax code descriptions
- Activating or deactivating tax codes
- Correcting tax code configuration
- Updating tax code relationships

#### `delete_tax_code`
**Purpose**: Remove custom tax codes
**When to Use**:
- Removing obsolete tax codes
- Cleaning up test or incorrect codes
- Maintaining clean tax code catalog

**⚠️ Warning**: Deletion cannot be undone. Ensure the tax code is not actively used.

#### `query_all_tax_codes`
**Purpose**: Search tax codes across all companies in account
**When to Use**:
- Multi-company tax code consistency
- Cross-company tax code analysis
- Account-wide tax code auditing

## Best Practices

### Tax Code Selection
1. **Start with System Codes**: Always check if a suitable system tax code exists before creating custom codes
2. **Use Descriptive Names**: Make tax code names and descriptions clear and meaningful
3. **Consistent Naming**: Establish naming conventions for custom tax codes
4. **Documentation**: Document why custom tax codes were created and their specific use cases

### Tax Code Management
1. **Regular Audits**: Periodically review active tax codes and remove unused ones
2. **Testing**: Test custom tax codes thoroughly before production use
3. **Version Control**: Track changes to tax code configurations
4. **Training**: Ensure staff understand which tax codes to use for different products

### Performance Optimization
1. **Caching**: Cache frequently used tax code lists to reduce API calls
2. **Filtering**: Use filters to reduce response sizes when searching
3. **Pagination**: Use top/skip parameters for large datasets

## Common Use Cases

### E-commerce Setup
1. Use `get_system_tax_codes` to find standard product classifications
2. Create custom tax codes for unique products with `create_tax_code`
3. Assign tax codes to products in your catalog
4. Use `get_company_tax_codes` to review and manage your tax code list

### Tax Code Research
1. Search system tax codes by product description
2. Filter by tax code type (Physical, Digital, Services)
3. Review parent-child relationships in tax code hierarchy
4. Get tax code recommendations for items

### Compliance Auditing
1. List all company tax codes to review configuration
2. Check for inactive or unused tax codes
3. Validate tax code assignments against business requirements
4. Ensure proper tax code documentation

## Error Handling

Common errors and solutions:

- **Tax code already exists**: Use a unique tax code identifier
- **Invalid tax code type**: Use P, D, S, or N for taxCodeTypeId
- **Tax code not found**: Verify the tax code ID and company
- **Permission denied**: Ensure proper user roles for tax code management

## Integration with Transactions

Tax codes are used in transaction creation:

```json
{
  "lines": [
    {
      "number": "1",
      "quantity": 1,
      "amount": 100.00,
      "taxCode": "CUST001",
      "description": "Custom Widget"
    }
  ]
}
```

When a tax code is specified in a transaction line, AvaTax uses the associated tax rules for that code to determine the correct tax treatment.

## Related Documentation

- [AvaTax API Documentation](https://developer.avalara.com/avatax/api-reference/)
- [Tax Code Classification Guide](https://help.avalara.com/Avalara_AvaTax/Tax_Codes)
- [Transaction Management](./TRANSACTION-MANAGEMENT.md)
- [Item Management](./ITEMS.md)
