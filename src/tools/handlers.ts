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

      const result = await avataxClient.updateNexus(args.id, nexusData, args.companyCode);
      return {
        content: [{
          type: 'text',
          text: `Nexus declaration updated successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
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
      const result = await avataxClient.getNexusByFormCode(args.formCode, args.companyCode, {
        include: args.include,
        filter: args.filter,
        top: args.top,
        skip: args.skip,
        orderBy: args.orderBy
      });
      return {
        content: [{
          type: 'text',
          text: `Found ${result.count || 0} nexus declarations for form code "${args.formCode}":\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
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
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
