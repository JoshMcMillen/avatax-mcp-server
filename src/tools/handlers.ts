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
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
