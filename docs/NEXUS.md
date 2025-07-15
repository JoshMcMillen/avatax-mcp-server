# Nexus Management Tools

This document describes the nexus management tools available in the AvaTax MCP Server. Nexus represents the tax jurisdictions where a company has established a physical or economic presence and is required to collect and remit taxes.

## What is Nexus?

Nexus is a legal term that describes the connection between a business and a tax jurisdiction (state, country, etc.) that creates a tax obligation. When a company has nexus in a jurisdiction, they are required to:

- Register for tax permits/licenses
- Collect appropriate taxes on sales
- File tax returns and remit collected taxes
- Comply with local tax laws and regulations

## Available Tools

### 1. `get_company_nexus`

**Purpose:** Retrieve all nexus declarations for a company.

**When to use:** 
- When you need to see what tax jurisdictions a company has declared nexus in
- To audit current nexus locations
- To understand where a company is required to collect taxes
- For compliance reporting

**Parameters:**
- `companyCode` (optional): Company identifier in AvaTax
- `filter` (optional): OData filter for specific nexus records
- `include` (optional): Additional data to include
- `top` (optional): Limit number of results (default: 25)
- `skip` (optional): Skip records for pagination
- `orderBy` (optional): Sort results by field

**Example usage:**
```
Use get_company_nexus to see all nexus locations for company "ACME"
Use get_company_nexus with filter "country eq 'US'" to see only US nexus
```

### 2. `get_nexus_by_id`

**Purpose:** Retrieve a specific nexus declaration by its unique ID.

**When to use:**
- When you have a specific nexus ID and need detailed information
- To verify nexus details before updating
- To check the current status of a particular nexus

**Parameters:**
- `id` (required): The unique nexus declaration ID
- `companyCode` (optional): Company identifier
- `include` (optional): Additional data to include

### 3. `create_nexus`

**Purpose:** Create a new nexus declaration for a company.

**When to use:**
- When a company establishes business presence in a new jurisdiction
- Before starting to collect taxes in a new location
- When compliance requirements change and nexus is newly required
- After receiving notice from tax authorities about nexus obligations

**Key Parameters:**
- `country` (required): Two-character ISO country code (e.g., "US", "CA")
- `region` (optional): State/province code (e.g., "CA", "NY", "ON")
- `effectiveDate` (optional): When nexus begins (YYYY-MM-DD)
- `nexusTypeId` (optional): Type of nexus (SalesOrSellersUseTax, SalesTax, etc.)
- `sourcing` (optional): Sourcing method (Mixed, Destination, Origin)
- `taxId` (optional): Tax registration number/permit

**Example scenarios:**
- Company opens new office in California: create nexus with country="US", region="CA"
- Company reaches economic nexus threshold in Texas: create nexus for sales tax compliance
- Company starts selling into Canada: create nexus with country="CA"

### 4. `update_nexus`

**Purpose:** Update an existing nexus declaration.

**When to use:**
- When nexus details change (tax ID updates, sourcing changes)
- To set an end date when ceasing business operations
- To modify effective dates or nexus types
- When tax authority provides new registration numbers

**Parameters:**
- `id` (required): Nexus declaration ID to update
- All same parameters as create_nexus for updating values
- `endDate`: Set this to cease nexus in a jurisdiction

### 5. `delete_nexus`

**Purpose:** Permanently delete a nexus declaration.

**When to use:**
- When nexus was created in error
- When nexus is no longer needed and won't be reactivated
- For cleanup of test/duplicate nexus declarations

**⚠️ Warning:** Use `update_nexus` with an `endDate` instead of delete for normal business cessation.

**Parameters:**
- `id` (required): Nexus declaration ID to delete
- `companyCode` (optional): Company identifier

### 6. `get_nexus_by_form_code`

**Purpose:** Find nexus declarations associated with specific tax forms.

**When to use:**
- During tax filing season to identify locations requiring specific forms
- For compliance workflow automation
- To understand filing obligations by form type
- For tax preparation and planning

**Parameters:**
- `formCode` (required): Tax form code (e.g., "ST-1", "DR-15", "Sales")
- Standard filtering and pagination options

### 7. `declare_nexus_by_address`

**Purpose:** Automatically declare nexus based on a business address.

**When to use:**
- Easiest way to establish nexus for a new business location
- When you have a physical address but aren't sure about jurisdiction details
- For quick nexus setup based on office/warehouse/store locations
- When AvaTax should automatically determine appropriate nexus settings

**Key Parameters:**
- `line1` (required): Street address
- `city` (required): City name
- `region` (required): State/province code
- `country` (required): Country code
- `postalCode` (required): ZIP/postal code
- `effectiveDate` (optional): When nexus becomes effective

**Example scenarios:**
- Company opens new warehouse at "123 Main St, Sacramento, CA 95814, US"
- Company establishes sales office and wants automatic nexus setup
- Quick nexus declaration without manually researching jurisdiction codes

## Best Practices

### Nexus Lifecycle Management

1. **Research First**: Before creating nexus, research local requirements
2. **Document Reasons**: Keep records of why nexus was established
3. **Monitor Thresholds**: Track economic nexus thresholds in various jurisdictions
4. **Regular Reviews**: Periodically review nexus declarations for accuracy
5. **Proper Cessation**: Use end dates rather than deletion when ceasing business

### Common Workflows

#### New Location Setup
1. Use `declare_nexus_by_address` for automatic setup
2. Or use `create_nexus` with specific jurisdiction details
3. Verify with `get_nexus_by_id` after creation
4. Update company tax profiles if needed

#### Compliance Audit
1. Use `get_company_nexus` to list all current nexus
2. Filter by country/region as needed
3. Cross-reference with business locations and activities
4. Update or create missing nexus declarations

#### Tax Filing Preparation
1. Use `get_nexus_by_form_code` to find locations requiring specific forms
2. Group nexus by filing frequency and due dates
3. Ensure all active nexus have proper registration numbers

#### Business Cessation
1. Use `update_nexus` to set `endDate` when stopping operations
2. Keep records for audit purposes
3. Don't delete unless the nexus was created in error

## Error Handling

Common issues and solutions:

- **"Company not found"**: Verify company code or ensure company exists
- **"Invalid jurisdiction"**: Check country/region codes are valid
- **"Nexus already exists"**: Use `get_company_nexus` to find existing nexus
- **"Missing required fields"**: Ensure country is provided for create operations
- **"Invalid date format"**: Use YYYY-MM-DD format for dates

## Integration Notes

- Nexus declarations affect tax calculation results
- Changes to nexus may require updating tax profiles
- Consider nexus when setting up location codes
- Nexus affects where tax returns must be filed
- Economic nexus thresholds should be monitored programmatically

## Related AvaTax Concepts

- **Companies**: Nexus declarations belong to specific companies
- **Locations**: Physical locations often trigger nexus requirements
- **Tax Codes**: Different nexus types may use different tax codes
- **Jurisdictions**: Nexus creates obligations in specific tax jurisdictions
- **Returns**: Nexus determines where tax returns must be filed
