import AvaTaxClient from '../avatax/client.js';

export async function handleToolCall(name: string, args: any, avataxClient: AvaTaxClient) {
  switch (name) {
    case 'calculate_tax': {
      const result = await avataxClient.calculateTax(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Tax calculation completed successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'validate_address': {
      const result = await avataxClient.validateAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Address validation completed!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_transaction': {
      const result = await avataxClient.createTransaction(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_companies': {
      const result = await avataxClient.getCompanies(args.filter);
      return { 
        content: [{ 
          type: 'text', 
          text: `Found ${result.count} companies:\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'ping_service': {
      const result = await avataxClient.ping();
      return { 
        content: [{ 
          type: 'text', 
          text: `AvaTax service is ${result.authenticated ? 'accessible and authenticated' : 'not accessible'}\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }

    // Nexus Management Tools
    case 'get_company_nexus': {
      const result = await avataxClient.getCompanyNexus(args.companyCode, {
        filter: args.filter,
        include: args.include,
        top: args.top,
        skip: args.skip,
        orderBy: args.orderBy
      });
      return {
        content: [{
          type: 'text',
          text: `Found ${result.count || 0} nexus declarations:\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_nexus_by_id': {
      const result = await avataxClient.getNexusById(args.id, args.companyCode, {
        include: args.include
      });
      return {
        content: [{
          type: 'text',
          text: `Nexus declaration details:\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_nexus': {
      const nexusData: any = {
        country: args.country,
        region: args.region,
        jurisTypeId: args.jurisTypeId,
        jurisCode: args.jurisCode,
        jurisName: args.jurisName,
        effectiveDate: args.effectiveDate,
        endDate: args.endDate,
        nexusTypeId: args.nexusTypeId,
        sourcing: args.sourcing,
        hasLocalNexus: args.hasLocalNexus,
        taxId: args.taxId,
        streamlinedSalesTax: args.streamlinedSalesTax
      };
      
      // Remove undefined properties
      Object.keys(nexusData).forEach(key => {
        if (nexusData[key] === undefined) {
          delete nexusData[key];
        }
      });

      const result = await avataxClient.createNexus(nexusData, args.companyCode);
      return {
        content: [{
          type: 'text',
          text: `Nexus declaration created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'update_nexus': {
      try {
        // Separate user-selectable fields from system fields
        const userSelectableFields: any = {
          effectiveDate: args.effectiveDate,
          endDate: args.endDate,
          nexusTypeId: args.nexusTypeId,
          hasLocalNexus: args.hasLocalNexus,
          taxId: args.taxId,
          streamlinedSalesTax: args.streamlinedSalesTax
        };

        const systemFields: any = {
          country: args.country,
          region: args.region,
          jurisTypeId: args.jurisTypeId,
          jurisCode: args.jurisCode,
          jurisName: args.jurisName,
          sourcing: args.sourcing
        };
        
        // Remove undefined properties
        Object.keys(userSelectableFields).forEach(key => {
          if (userSelectableFields[key] === undefined) {
            delete userSelectableFields[key];
          }
        });

        Object.keys(systemFields).forEach(key => {
          if (systemFields[key] === undefined) {
            delete systemFields[key];
          }
        });

        // If only user-selectable fields are provided, use the safe update method
        if (Object.keys(systemFields).length === 0 && Object.keys(userSelectableFields).length > 0) {
          const result = await avataxClient.updateNexusSafely(args.id, userSelectableFields, args.companyCode);
          return {
            content: [{
              type: 'text',
              text: `Nexus declaration updated successfully using safe update method!\n\n${JSON.stringify(result, null, 2)}`
            }]
          };
        } else {
          // If system fields are provided, use the regular update method but warn the user
          const allFields = { ...userSelectableFields, ...systemFields };
          const result = await avataxClient.updateNexus(args.id, allFields, args.companyCode);
          return {
            content: [{
              type: 'text',
              text: `Nexus declaration updated successfully!\n\nWARNING: You provided system fields (country, region, etc.) which must match the existing nexus exactly. If you get errors, use get_nexus_by_id first to get the current values.\n\n${JSON.stringify(result, null, 2)}`
            }]
          };
        }
      } catch (error: any) {
        // Provide specific guidance for common update_nexus errors
        if (error.message && error.message.includes('IncorrectPathError')) {
          return {
            content: [{
              type: 'text',
              text: `Error updating nexus: ${error.message}\n\nTroubleshooting suggestions:\n1. Verify the nexus ID exists by using get_nexus_by_id first\n2. Ensure all non-user-selectable fields (country, region, jurisCode, jurisName, etc.) match the existing nexus exactly\n3. Only modify user-selectable fields: effectiveDate, endDate, taxId, nexusTypeId, hasLocalNexus, streamlinedSalesTax\n4. Use get_company_nexus to list all nexus declarations and find the correct ID\n\nFor more details about this error:\n${JSON.stringify(error, null, 2)}`
            }]
          };
        } else {
          // Re-throw other errors to be handled by the main error handler
          throw error;
        }
      }
    }

    case 'delete_nexus': {
      const result = await avataxClient.deleteNexus(args.id, args.companyCode);
      return {
        content: [{
          type: 'text',
          text: `Nexus declaration deleted successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_nexus_by_form_code': {
      try {
        const result = await avataxClient.getNexusByFormCode(args.formCode, args.companyCode, {
          include: args.include,
          filter: args.filter,
          top: args.top,
          skip: args.skip,
          orderBy: args.orderBy
        });
        
        if (result.companyNexus && result.companyNexus.length === 0 && result.nexusDefinitions && result.nexusDefinitions.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No nexus declarations found for form code "${args.formCode}".\n\nThis could mean:\n1. The form code "${args.formCode}" does not exist in the AvaTax system\n2. Your company has no nexus declarations associated with this form\n3. The form code format may be incorrect\n\nSuggestions:\n- Use get_company_nexus to see all your nexus declarations\n- Check with Avalara support for valid form codes for your jurisdictions\n- Form codes are typically state-specific (e.g., "ST-1" for some states)\n\nAPI Response:\n${JSON.stringify(result, null, 2)}`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Found ${result.companyNexus?.length || 0} company nexus declarations and ${result.nexusDefinitions?.length || 0} nexus definitions for form code "${args.formCode}":\n\n${JSON.stringify(result, null, 2)}`
            }]
          };
        }
      } catch (error: any) {
        if (error.message && error.message.includes('EntityNotFoundError')) {
          return {
            content: [{
              type: 'text',
              text: `Form code "${args.formCode}" not found in AvaTax system.\n\nThis means the form code does not exist in Avalara's database. Form codes are specific to tax jurisdictions and filing requirements.\n\nSuggestions:\n1. Verify the form code with your tax authority or Avalara support\n2. Use get_company_nexus to see existing nexus declarations\n3. Common form codes vary by state/jurisdiction\n\nError details:\n${JSON.stringify(error, null, 2)}`
            }]
          };
        } else {
          // Re-throw other errors to be handled by the main error handler
          throw error;
        }
      }
    }

    case 'declare_nexus_by_address': {
      const addressData: any = {
        line1: args.line1,
        line2: args.line2,
        line3: args.line3,
        city: args.city,
        region: args.region,
        country: args.country,
        postalCode: args.postalCode
      };
      
      // Remove undefined properties
      Object.keys(addressData).forEach(key => {
        if (addressData[key] === undefined) {
          delete addressData[key];
        }
      });

      const result = await avataxClient.declareNexusByAddress(addressData, args.companyCode, {
        textCase: args.textCase,
        effectiveDate: args.effectiveDate
      });
      return {
        content: [{
          type: 'text',
          text: `Nexus declared automatically based on address!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    // Credential Management Tools
    case 'set_default_company': {
      const { companyCode } = args;
      
      // Validate that the company exists
      const companies = await avataxClient.getCompanies();
      const company = companies.companies.find((c: any) => c.companyCode === companyCode);
      
      if (!company) {
        throw new Error(`Company with code '${companyCode}' not found`);
      }
      
      // Update the runtime configuration
      avataxClient.setDefaultCompanyCode(companyCode);
      
      return {
        content: [{
          type: 'text',
          text: `Default company code set to: ${companyCode} (${company.name})`
        }]
      };
    }
    
    case 'get_current_company': {
      const currentInfo = avataxClient.getCurrentAccountInfo();
      return {
        content: [{
          type: 'text',
          text: `Current Configuration:
Account Name: ${currentInfo.accountName || 'Not configured'}
Account ID: ${currentInfo.accountId}
Environment: ${currentInfo.environment}
Default Company Code: ${currentInfo.companyCode || 'Not set'}`
        }]
      };
    }

    case 'set_credentials': {
      const { accountId, licenseKey, environment, companyCode } = args;
      
      // Test the credentials by making a ping request
      const tempClient = new (avataxClient.constructor as any)({
        accountId,
        licenseKey,
        environment,
        companyCode: companyCode || '',
        appName: 'AvaTax-MCP-Server',
        timeout: 30000
      });
      
      try {
        await tempClient.ping();
      } catch (error: any) {
        throw new Error(`Invalid credentials: ${error?.message || 'Authentication failed'}`);
      }
      
      // Update the runtime configuration
      avataxClient.setCredentials(accountId, licenseKey, environment, companyCode);
      
      return {
        content: [{
          type: 'text',
          text: `Credentials updated successfully!
Account ID: ${accountId}
Environment: ${environment}
${companyCode ? `Default Company Code: ${companyCode}` : 'No default company code set'}`
        }]
      };
    }

    case 'switch_account': {
      const { accountName } = args;
      
      try {
        avataxClient.switchAccount(accountName);
        const currentInfo = avataxClient.getCurrentAccountInfo();
        
        return {
          content: [{
            type: 'text',
            text: `Successfully switched to account: ${accountName}
Account ID: ${currentInfo.accountId}
Environment: ${currentInfo.environment}
Default Company Code: ${currentInfo.companyCode || 'Not set'}`
          }]
        };
      } catch (error: any) {
        throw new Error(`Failed to switch account: ${error?.message || 'Unknown error'}`);
      }
    }

    case 'list_accounts': {
      const accounts = avataxClient.getAvailableAccounts();
      const currentInfo = avataxClient.getCurrentAccountInfo();
      
      if (accounts.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No pre-configured accounts found. 
You can use 'set_credentials' to add credentials for the current session, or create a credentials file at ~/.avatax/credentials.json`
          }]
        };
      }
      
      const accountList = accounts.map(name => 
        `- ${name}${name === currentInfo.accountName ? ' (current)' : ''}`
      ).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `Available pre-configured accounts:\n${accountList}\n\nUse 'switch_account' to change to a different account.`
        }]
      };
    }

    // Transaction Management Handlers
    case 'list_transactions': {
      const result = await avataxClient.listTransactions(args.companyCode, {
        filter: args.filter,
        include: args.include,
        top: args.top,
        skip: args.skip,
        orderBy: args.orderBy
      });
      return {
        content: [{
          type: 'text',
          text: `Found ${result.count} transactions:\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_transaction': {
      const result = await avataxClient.getTransaction(args.companyCode, args.transactionCode, {
        documentType: args.documentType,
        include: args.include
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction details:\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'commit_transaction': {
      const result = await avataxClient.commitTransaction(args.companyCode, args.transactionCode, {
        documentType: args.documentType,
        commit: args.commit
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction committed successfully!\n\nStatus: ${result.status}\nCommitted: ${result.committed}\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'void_transaction': {
      const result = await avataxClient.voidTransaction(args.companyCode, args.transactionCode, {
        documentType: args.documentType,
        code: args.code
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction voided successfully!\n\nStatus: ${result.status}\nVoided: ${result.voided}\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'adjust_transaction': {
      const result = await avataxClient.adjustTransaction(args.companyCode, args.transactionCode, args.newTransaction, {
        documentType: args.documentType
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction adjusted successfully!\n\nNew Status: ${result.status}\nAdjusted: ${result.adjusted}\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'uncommit_transaction': {
      const result = await avataxClient.uncommitTransaction(args.companyCode, args.transactionCode, {
        documentType: args.documentType
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction uncommitted successfully!\n\nStatus: ${result.status}\nUncommitted: ${result.uncommitted}\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_transaction_audit': {
      const result = await avataxClient.getTransactionAudit(args.companyCode, args.transactionCode);
      return {
        content: [{
          type: 'text',
          text: `Transaction audit information:\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'change_transaction_code': {
      const result = await avataxClient.changeTransactionCode(args.companyCode, args.transactionCode, args.newCode, {
        documentType: args.documentType
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction code changed successfully!\n\nNew Code: ${result.code}\nStatus: ${result.status}\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'verify_transaction': {
      const result = await avataxClient.verifyTransaction(args.companyCode, args.transactionCode, {
        documentType: args.documentType
      });
      return {
        content: [{
          type: 'text',
          text: `Transaction verified successfully!\n\nStatus: ${result.status}\nVerified: ${result.verified}\nMessages: ${result.messages.length}\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
