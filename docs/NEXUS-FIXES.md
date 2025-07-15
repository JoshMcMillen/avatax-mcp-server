# Nexus API Issues and Fixes

This document outlines the issues identified with the nexus-related API functions and the fixes implemented.

## Issues Identified

### 1. `update_nexus` Function Issues

**Problem**: Multiple error attempts with "IncorrectPathError" and field validation errors.

**Root Cause**: The AvaTax API has specific requirements for updating nexus declarations:
- Only user-selectable fields can be modified
- All other fields must match the existing Avalara-defined nexus object exactly
- The API requires the complete nexus object, not just the fields being updated

**User-Selectable Fields** (can be modified):
- `effectiveDate`
- `endDate` 
- `taxId`
- `nexusTypeId`
- `hasLocalNexus`
- `streamlinedSalesTax`
- `hasPermanentEstablishment`
- `isSellerImporterOfRecord`
- `localNexusTypeId`

**System Fields** (must match existing nexus exactly):
- `country`
- `region`
- `jurisCode`
- `jurisName`
- `jurisTypeId`
- `sourcing`
- `companyId`

### 2. `get_nexus_by_form_code` Function Issues

**Problem**: "EntityNotFoundError" for form codes like "Sales", "ST-1", "AL-ST1", "ST".

**Root Cause**: The function works correctly, but the tested form codes don't exist in the AvaTax system. Form codes are jurisdiction-specific and must be valid codes defined by Avalara.

## Fixes Implemented

### 1. Enhanced `update_nexus` Function

**Changes Made**:
1. **Added comprehensive documentation** explaining user-selectable vs system fields
2. **Created `updateNexusSafely()` helper method** that:
   - First retrieves the existing nexus declaration
   - Merges only user-selectable fields with existing data
   - Ensures all system fields remain unchanged
3. **Updated tool definition** with clear field categorization
4. **Enhanced error handling** with specific troubleshooting guidance
5. **Smart handler logic** that:
   - Uses safe update when only user-selectable fields provided
   - Warns when system fields are provided
   - Provides detailed error guidance

**Usage Recommendations**:
- **For simple updates** (changing dates, tax IDs): Only provide user-selectable fields
- **For complex updates**: Use `get_nexus_by_id` first to get current values, then update
- **Best practice**: Always use the safe update approach by providing only the fields you want to change

### 2. Enhanced `get_nexus_by_form_code` Function

**Changes Made**:
1. **Improved error handling** for "EntityNotFoundError"
2. **Enhanced response messages** explaining why form codes might not be found
3. **Added guidance** on how to find valid form codes
4. **Updated tool description** to set proper expectations
5. **Better handling of empty results** vs actual errors

**Usage Recommendations**:
- Use `get_company_nexus` first to see existing nexus declarations
- Contact Avalara support for valid form codes for your jurisdictions
- Form codes are typically state/jurisdiction-specific

## API Endpoint Information

### Update Nexus Endpoint
```
PUT /api/v2/companies/{companyId}/nexus/{id}
```
- Uses numeric `companyId` in URL (not `companyCode`)
- Requires complete nexus object in request body
- Only user-selectable fields should be modified
- All system fields must match existing Avalara definitions

### Get Nexus By Form Code Endpoint
```
GET /api/v2/companies/{companyId}/nexus/byform/{formCode}
```
- Returns nexus declarations associated with a tax form
- Form codes must exist in Avalara's system
- Returns empty arrays when form code is not found (not an error)
- Throws EntityNotFoundError when form code is completely invalid

## Testing Recommendations

### For `update_nexus`:
1. First use `get_company_nexus` to find a nexus ID
2. Use `get_nexus_by_id` to get current values
3. Test updating only user-selectable fields (e.g., just `endDate`)
4. Verify the safe update method works correctly

### For `get_nexus_by_form_code`:
1. Contact Avalara support to get valid form codes for test environment
2. Test with both valid and invalid form codes
3. Verify proper error handling and guidance messages

## Error Messages Improved

### Before:
- Generic "IncorrectPathError" without guidance
- "EntityNotFoundError" without explanation

### After:
- Detailed troubleshooting steps for update errors
- Clear explanation of user-selectable vs system fields
- Guidance on finding valid form codes
- Suggestions for alternative approaches

## Documentation Updates

1. **Tool definitions** now clearly explain field requirements
2. **Function descriptions** include usage warnings and recommendations
3. **Error handling** provides actionable troubleshooting steps
4. **API comments** explain AvaTax-specific requirements
