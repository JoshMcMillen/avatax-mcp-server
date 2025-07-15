import AvaTaxClient from '../avatax/client.js';
import { AvaTaxConfig } from '../avatax/config.js';
import { getToolHelp, getErrorSolution } from './guidance.js';

export async function handleToolCall(name: string, args: any, avataxClient: AvaTaxClient, config: AvaTaxConfig) {
  try {
    // Pre-execution guidance for common issues
    switch (name) {
      case 'list_nexus':
        if (args.companyCode) {
          try {
            const companies = await avataxClient.getCompanies();
            const companyExists = companies.companies?.some((c: any) => c.companyCode === args.companyCode);
            if (!companyExists) {
              return {
                content: [{
                  type: 'text',
                  text: `❌ Company code "${args.companyCode}" not found.\n\nSOLUTION: Use 'get_companies' first to find valid company codes.\n\nAvailable: ${companies.companies?.map((c: any) => c.companyCode).join(', ') || 'None'}`
                }]
              };
            }
          } catch (error) {
            // Continue if validation fails
          }
        } else if (!config.companyCode) {
          return {
            content: [{
              type: 'text',
              text: `⚠️ No company code provided.\n\nSOLUTION:\n1. Use 'get_companies' to see available companies\n2. Specify companyCode parameter\n\nEXAMPLE: list_nexus with companyCode: "YOUR_CODE"`
            }]
          };
        }
        break;
        
      case 'list_certificates':
        return {
          content: [{
            type: 'text',
            text: `📋 Certificate management requires additional permissions.\n\nTO VIEW CERTIFICATES:\n1. AvaTax web portal: https://app.avalara.com\n2. Enable CertCapture module\n3. Use 'list_customers' for associations\n\nAlternative: 'get_account' for features`
          }]
        };
        
      case 'calculate_tax':
        if (args.shipTo && (!args.shipTo.region || !args.shipTo.postalCode)) {
          return {
            content: [{
              type: 'text',
              text: `⚠️ Incomplete address detected.\n\nRECOMMENDATION: Use 'validate_address' first for accurate results.\n\nWorkflow: validate_address → calculate_tax`
            }]
          };
        }
        break;
    }

    // Execute the actual tool
    return await executeToolCore(name, args, avataxClient, config);
    
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const solution = getErrorSolution(errorMessage);
    
    return {
      content: [{
        type: 'text',
        text: `❌ Error with ${name}: ${errorMessage}\n\n🔧 TROUBLESHOOTING:\n${solution}\n\nHelp: Use 'get_tool_help' for guidance.`
      }]
    };
  }
}

async function executeToolCore(name: string, args: any, avataxClient: AvaTaxClient, config: AvaTaxConfig) {
  switch (name) {
    case 'get_tool_help': {
      const helpText = getToolHelp(args.task);
      const additionalInfo = args.details ? `\n\nContext: "${args.details}" - Apply the workflow above.` : '';
      
      return {
        content: [{
          type: 'text',
          text: `📚 TOOL GUIDANCE for "${args.task}":\n\n${helpText}${additionalInfo}\n\n💡 TIP: Start with basic tools (ping_service, get_companies) first.`
        }]
      };
    }
    
    case 'calculate_tax': {
      // Inject default origin address if shipFrom is not provided
      if (!args.shipFrom && config.originAddress) {
        args.shipFrom = config.originAddress;
      }
      
      const result = await avataxClient.calculateTax(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Tax calculation completed!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'validate_address': {
      const result = await avataxClient.validateAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Address validation completed!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_transaction': {
      // Inject default origin address if shipFrom is not provided
      if (!args.shipFrom && config.originAddress) {
        args.shipFrom = config.originAddress;
      }
      
      const result = await avataxClient.createTransaction(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Transaction created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_companies': {
      const result = await avataxClient.getCompanies(args.filter);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Found ${result.count} companies:\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'ping_service': {
      const result = await avataxClient.ping();
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ AvaTax service is ${result.authenticated ? 'accessible and authenticated' : 'not accessible'}\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 1: Core Transaction Operations
    case 'void_transaction': {
      const result = await avataxClient.voidTransaction(args.companyCode, args.transactionCode, args.voidType);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Transaction voided successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'refund_transaction': {
      const result = await avataxClient.refundTransaction(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Refund transaction created!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'adjust_transaction': {
      const result = await avataxClient.adjustTransaction(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Transaction adjusted successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'settle_transaction': {
      const result = await avataxClient.settleTransaction(args.companyCode, args.transactionCode, args.paymentDate);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Transaction settled successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_transactions': {
      const result = await avataxClient.listTransactions(args.companyCode, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Transactions retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 2: Address & Location Services
    case 'resolve_address': {
      const result = await avataxClient.resolveAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Address resolution completed!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_locations_by_company': {
      const result = await avataxClient.listLocationsByCompany(args.companyCode, args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company locations retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 3: Company & Configuration Management
    case 'create_company': {
      const result = await avataxClient.createCompany(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_company': {
      const result = await avataxClient.updateCompany(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company updated successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_company_configuration': {
      const result = await avataxClient.getCompanyConfiguration(args.companyCode);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company configuration retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'set_company_configuration': {
      const result = await avataxClient.setCompanyConfiguration(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company configuration updated!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_company_locations': {
      const result = await avataxClient.listCompanyLocations(args.companyCode, args.filter);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company locations retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_company_location': {
      const result = await avataxClient.createCompanyLocation(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company location created!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_company_location': {
      const result = await avataxClient.updateCompanyLocation(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company location updated!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_company_location': {
      const result = await avataxClient.deleteCompanyLocation(args.companyCode, args.locationId);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Company location deleted!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 4: Nexus Management
    case 'list_nexus': {
      const result = await avataxClient.listNexus(args.companyCode, args.filter, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Nexus declarations retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_nexus': {
      const result = await avataxClient.createNexus(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Nexus declaration created!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_nexus': {
      const result = await avataxClient.updateNexus(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Nexus declaration updated!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_nexus': {
      const result = await avataxClient.deleteNexus(args.companyCode, args.nexusId);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Nexus declaration deleted!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_nexus_by_address': {
      const result = await avataxClient.getNexusByAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Nexus obligations retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'declare_nexus_by_address': {
      const result = await avataxClient.declareNexusByAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Nexus declarations created!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 5: Tax Code & Item Management  
    case 'list_tax_codes': {
      const result = await avataxClient.listTaxCodes(args.companyCode, args.filter, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Tax codes retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_tax_code': {
      const result = await avataxClient.createTaxCode(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Tax code created!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_tax_code': {
      const result = await avataxClient.updateTaxCode(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Tax code updated!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_tax_code': {
      const result = await avataxClient.deleteTaxCode(args.companyCode, args.taxCodeId);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Tax code deleted!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_items': {
      const result = await avataxClient.listItems(args.companyCode, args.filter, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Items retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_item': {
      const result = await avataxClient.createItem(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Item created!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_item': {
      const result = await avataxClient.updateItem(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Item updated!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_item': {
      const result = await avataxClient.deleteItem(args.companyCode, args.itemId);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Item deleted!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // System tools
    case 'get_account': {
      const result = await avataxClient.getAccount(args.accountId, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Account details retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_settings': {
      const result = await avataxClient.getSettings(args.companyCode);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Settings retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_customers': {
      const result = await avataxClient.listCustomers(args.companyCode, args);
      return { 
        content: [{ 
          type: 'text', 
          text: `✅ Customers retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    default:
      throw new Error(`❌ Unknown tool: ${name}. Use 'get_tool_help' to see available tools and guidance.`);
  }
}
