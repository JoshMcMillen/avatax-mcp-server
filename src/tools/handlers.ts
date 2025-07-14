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
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
