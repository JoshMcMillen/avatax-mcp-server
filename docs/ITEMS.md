# AvaTax Item Management Endpoints

This document provides comprehensive guidance on using the AvaTax Item Management endpoints in the MCP server. Items are product catalog entries that simplify tax calculations by pre-configuring tax codes, parameters, and descriptions.

## Overview

Items in AvaTax serve as a way to separate your tax calculation process from your tax configuration details. Instead of specifying tax codes, parameters, descriptions, and other data fields for each transaction, you can:

1. **Pre-configure items** in your product catalog with all necessary tax information
2. **Reference items by code** in transactions using `itemCode`
3. **Let AvaTax automatically apply** the correct tax codes and parameters from the item table

This approach allows your CreateTransaction calls to be as simple as possible, while your tax compliance team can manage your item catalog and adjust the tax behavior of items without modifying your software.

## When to Use Items

### Use Items When:
- You have a stable product catalog with consistent tax treatment
- You want to centralize tax configuration management
- You need to simplify transaction creation calls
- Your tax compliance team manages product tax codes independently
- You want to ensure consistent tax treatment across transactions

### Don't Use Items When:
- You have highly dynamic products with varying tax treatment
- You need transaction-specific tax overrides frequently
- Your products don't fit into standardized categories

## Core Item Endpoints

### 1. List Company Items

**Endpoint:** `get_company_items`

**Purpose:** Retrieve all items in a company's product catalog

**Usage Context:**
- **Discovery:** Find existing items before creating transactions
- **Audit:** Review current product catalog configuration
- **Management:** Browse items for updates or deletions

**Common Parameters:**
```json
{
  "companyCode": "MYCOMPANY",
  "filter": "category contains 'Electronics'",
  "include": "Parameters,Classifications,Tags",
  "top": 50,
  "orderBy": "itemCode asc"
}
```

**When to Use:**
- Before creating new items to avoid duplicates
- When setting up transaction templates
- For product catalog audits
- When implementing item search functionality

### 2. Get Specific Item

**Endpoint:** `get_company_item`

**Purpose:** Retrieve detailed information about a specific item

**Usage Context:**
- **Pre-update inspection:** Check current values before modifications
- **Transaction setup:** Understand item configuration for transaction creation
- **Debugging:** Investigate item-related tax calculation issues

**Example:**
```json
{
  "itemId": 12345,
  "include": "Parameters,Classifications,Tags,TaxCodeDetails"
}
```

**When to Use:**
- Before updating an item (to preserve existing data)
- When troubleshooting tax calculations
- For displaying item details in admin interfaces

### 3. Create Items

**Endpoint:** `create_company_items`

**Purpose:** Add new items to the product catalog

**Usage Context:**
- **Product onboarding:** Add new products to your catalog
- **Bulk import:** Import items from external systems
- **Tax setup:** Configure tax treatment for new products

**Example:**
```json
{
  "items": [
    {
      "itemCode": "LAPTOP-001",
      "description": "Business Laptop",
      "taxCode": "P0000000",
      "category": "Electronics > Computers",
      "itemGroup": "Hardware",
      "parameters": [
        {
          "name": "UPC",
          "value": "123456789012"
        },
        {
          "name": "Weight",
          "value": "2.5",
          "unit": "kg"
        }
      ],
      "properties": {
        "color": "black",
        "warranty": "3 years"
      }
    }
  ]
}
```

**Best Practices:**
- Always include a meaningful description
- Use consistent itemCode naming conventions
- Add UPC/SKU as parameters when available
- Include product categories for better organization

### 4. Update Items

**Endpoint:** `update_company_item`

**Purpose:** Modify existing item configuration

**Usage Context:**
- **Tax code changes:** Update tax treatment for products
- **Product information updates:** Modify descriptions or categories
- **Parameter adjustments:** Update UPC codes, weights, etc.

**⚠️ Important:** This endpoint replaces ALL item data. Always retrieve the current item first and include all fields you want to preserve.

**Example Workflow:**
```json
// 1. First, get the current item
{
  "itemId": 12345,
  "include": "Parameters,Properties"
}

// 2. Then update with all fields (including unchanged ones)
{
  "itemId": 12345,
  "itemCode": "LAPTOP-001",
  "description": "Business Laptop - Updated",
  "taxCode": "P0000000",
  "category": "Electronics > Computers > Business",
  "itemGroup": "Hardware",
  "parameters": [
    // Include existing parameters you want to keep
    {
      "name": "UPC",
      "value": "123456789012"
    },
    // Add new parameters
    {
      "name": "ScreenSize",
      "value": "15.6",
      "unit": "inch"
    }
  ]
}
```

### 5. Delete Items

**Endpoint:** `delete_company_item`

**Purpose:** Remove items from the product catalog

**Usage Context:**
- **Product discontinuation:** Remove obsolete products
- **Cleanup:** Remove test or incorrect items
- **Catalog maintenance:** Clean up unused items

**⚠️ Restrictions:**
- Cannot delete items referenced in existing transactions
- Deletion is permanent and cannot be undone
- Consider deactivating instead if the item might be needed for historical transactions

## Item Parameters Management

Parameters store additional attributes that can affect tax calculations or provide additional product information.

### Common Parameter Types:

#### Required for Tax Compliance:
- **UPC:** Universal Product Code for product identification
- **Summary:** Detailed product description for tax code recommendations

#### Physical Attributes:
- **Weight:** Product weight (with unit)
- **Dimensions:** Length, width, height
- **Volume:** Product volume

#### Business Attributes:
- **Brand:** Product brand name
- **Model:** Product model number
- **ScreenSize:** For electronics (with unit)

### Parameter Endpoints:

#### Get Item Parameters
**Endpoint:** `get_item_parameters`
**When to Use:** Review current parameters before adding/updating

#### Create Item Parameters
**Endpoint:** `create_item_parameters`
**When to Use:** Add new attributes to existing items

#### Update Item Parameter
**Endpoint:** `update_item_parameter`
**When to Use:** Modify specific parameter values

#### Delete Item Parameter
**Endpoint:** `delete_item_parameter`
**When to Use:** Remove obsolete or incorrect parameters

## Item Classifications Management

Classifications assign standardized codes (HS codes, NAICS, etc.) required for international trade and specific tax jurisdictions.

### Classification Types:

#### International Trade:
- **TARIC:** EU tariff codes
- **HTS:** US Harmonized Tariff Schedule
- **HS:** Harmonized System codes

#### Business Classification:
- **NAICS:** North American Industry Classification
- **SIC:** Standard Industrial Classification

### Classification Endpoints:

#### Get Item Classifications
**Endpoint:** `get_item_classifications`
**Usage:** Review current trade classifications

#### Create Item Classifications
**Endpoint:** `create_item_classifications`
**Usage:** Assign HS codes, NAICS codes, etc.

```json
{
  "itemId": 12345,
  "classifications": [
    {
      "productCode": "8471300000",
      "systemCode": "HTS",
      "country": "US"
    },
    {
      "productCode": "334111",
      "systemCode": "NAICS"
    }
  ]
}
```

#### Update Item Classification
**Endpoint:** `update_item_classification`
**Usage:** Correct classification codes

#### Delete Item Classification
**Endpoint:** `delete_item_classification`
**Usage:** Remove incorrect classifications

## Item Tags Management

Tags are organizational labels that help categorize and filter items.

### Common Tag Categories:

#### Operational:
- "Seasonal"
- "Promotional"
- "Clearance"
- "New"

#### Physical Properties:
- "Fragile"
- "Hazardous"
- "Oversized"
- "Refrigerated"

#### Business Categories:
- "Electronics"
- "Clothing"
- "Food"
- "Books"

### Tag Endpoints:

#### Get Item Tags
**Endpoint:** `get_item_tags`
**Usage:** Review current organizational tags

#### Create Item Tags
**Endpoint:** `create_item_tags`
**Usage:** Add organizational labels

```json
{
  "itemId": 12345,
  "tags": [
    {"tagName": "Electronics"},
    {"tagName": "Seasonal"},
    {"tagName": "Fragile"}
  ]
}
```

#### Delete Item Tag
**Endpoint:** `delete_item_tag`
**Usage:** Remove outdated tags

## Best Practices

### Item Creation:
1. **Use meaningful itemCodes** that follow a consistent naming convention
2. **Include comprehensive descriptions** for tax code recommendations
3. **Add UPC codes as parameters** when available
4. **Categorize items consistently** for better organization
5. **Include weight/dimensions** for shipping-related tax calculations

### Item Management:
1. **Always retrieve before updating** to preserve existing data
2. **Use tags for organization** rather than complex naming schemes
3. **Keep parameters up to date** for accurate tax calculations
4. **Review classifications regularly** for compliance requirements
5. **Document parameter meanings** for team consistency

### Transaction Integration:
1. **Reference items by itemCode** in transactions when possible
2. **Override item settings only when necessary** in transactions
3. **Use consistent itemCodes** across all systems
4. **Monitor item usage** to identify unused items

### Compliance:
1. **Assign appropriate HS codes** for international shipments
2. **Keep UPC codes current** for product identification
3. **Update tax codes** when product classification changes
4. **Maintain accurate product descriptions** for audits

## Error Handling

### Common Errors:

#### Item Not Found (404):
- Verify itemId exists
- Check company permissions
- Ensure item wasn't deleted

#### Validation Errors (400):
- Check required fields (itemCode, description)
- Verify field length limits
- Validate parameter structures

#### Permission Errors (401/403):
- Confirm user has item management permissions
- Check company access rights
- Verify API credentials

#### Dependency Errors:
- Cannot delete items referenced in transactions
- Cannot use duplicate itemCodes
- Cannot reference non-existent tax codes

## Integration Examples

### E-commerce Integration:
```json
// Create item for new product
{
  "items": [
    {
      "itemCode": "PROD-123",
      "description": "Wireless Bluetooth Headphones",
      "taxCode": "P0000000",
      "category": "Electronics > Audio",
      "parameters": [
        {"name": "UPC", "value": "123456789012"},
        {"name": "Weight", "value": "0.3", "unit": "kg"},
        {"name": "Brand", "value": "TechCorp"}
      ],
      "properties": {
        "color": "black",
        "wireless": "true"
      }
    }
  ]
}

// Use in transaction
{
  "lines": [
    {
      "number": "1",
      "quantity": 1,
      "amount": 99.99,
      "itemCode": "PROD-123"  // References the item above
    }
  ]
}
```

### ERP Integration:
```json
// Bulk update items from ERP system
{
  "items": [
    {
      "itemCode": "SKU-001",
      "description": "Updated from ERP",
      "taxCode": "P0000000",
      "sourceEntityId": "ERP-ID-12345",
      "source": "ERP_SYSTEM"
    }
  ]
}
```

This comprehensive approach to item management enables efficient tax calculation while maintaining flexibility and compliance with various tax jurisdictions.
