import AvaTaxClient from '../avatax/client.js';
import { AvaTaxConfig } from '../avatax/config.js';

export async function handleToolCall(name: string, args: any, avataxClient: AvaTaxClient, config: AvaTaxConfig) {
  switch (name) {
    case 'calculate_tax': {
      // Inject default origin address if shipFrom is not provided
      if (!args.shipFrom && config.originAddress) {
        args.shipFrom = config.originAddress;
      }
      
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
      // Inject default origin address if shipFrom is not provided
      if (!args.shipFrom && config.originAddress) {
        args.shipFrom = config.originAddress;
      }
      
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
    
    // Phase 1: Core Transaction Operations
    case 'void_transaction': {
      const result = await avataxClient.voidTransaction(args.companyCode, args.transactionCode, args.voidType);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction voided successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'refund_transaction': {
      const result = await avataxClient.refundTransaction(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Refund transaction created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'adjust_transaction': {
      const result = await avataxClient.adjustTransaction(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction adjusted successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'settle_transaction': {
      const result = await avataxClient.settleTransaction(args.companyCode, args.transactionCode, args.paymentDate);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction settled successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'verify_transaction': {
      const result = await avataxClient.verifyTransaction(args.companyCode, args.transactionCode, args.documentType, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction verification completed!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'lock_transaction': {
      const result = await avataxClient.lockTransaction(args.companyCode, args.transactionCode);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction locked successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'unlock_transaction': {
      const result = await avataxClient.unlockTransaction(args.companyCode, args.transactionCode);
      return { 
        content: [{ 
          type: 'text', 
          text: `Transaction unlocked successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 2: Batch Operations
    case 'create_batch': {
      const result = await avataxClient.createBatch(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Batch created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_batch_status': {
      const result = await avataxClient.getBatchStatus(args.companyCode, args.batchId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Batch status retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'download_batch': {
      const result = await avataxClient.downloadBatch(args.companyCode, args.batchId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Batch download completed!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'cancel_batch': {
      const result = await avataxClient.cancelBatch(args.companyCode, args.batchId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Batch cancelled successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 3: Company & Configuration Management
    case 'create_company': {
      const result = await avataxClient.createCompany(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_company': {
      const result = await avataxClient.updateCompany(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company updated successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_company_configuration': {
      const result = await avataxClient.getCompanyConfiguration(args.companyCode);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company configuration retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'set_company_configuration': {
      const result = await avataxClient.setCompanyConfiguration(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company configuration updated!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_company_locations': {
      const result = await avataxClient.listCompanyLocations(args.companyCode, args.filter);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company locations retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_company_location': {
      const result = await avataxClient.createCompanyLocation(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company location created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_company_location': {
      const result = await avataxClient.updateCompanyLocation(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company location updated successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_company_location': {
      const result = await avataxClient.deleteCompanyLocation(args.companyCode, args.locationId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Company location deleted successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 4: Nexus Management
    case 'list_nexus': {
      const result = await avataxClient.listNexus(args.companyCode, args.filter, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `Nexus declarations retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_nexus': {
      const result = await avataxClient.createNexus(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Nexus declaration created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_nexus': {
      const result = await avataxClient.updateNexus(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Nexus declaration updated successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_nexus': {
      const result = await avataxClient.deleteNexus(args.companyCode, args.nexusId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Nexus declaration deleted successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'get_nexus_by_address': {
      const result = await avataxClient.getNexusByAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Nexus obligations by address retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'declare_nexus_by_address': {
      const result = await avataxClient.declareNexusByAddress(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Nexus declarations created by address!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    // Phase 5: Tax Code & Item Management
    case 'list_tax_codes': {
      const result = await avataxClient.listTaxCodes(args.companyCode, args.filter, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `Tax codes retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_tax_code': {
      const result = await avataxClient.createTaxCode(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Tax code created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_tax_code': {
      const result = await avataxClient.updateTaxCode(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Tax code updated successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_tax_code': {
      const result = await avataxClient.deleteTaxCode(args.companyCode, args.taxCodeId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Tax code deleted successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'list_items': {
      const result = await avataxClient.listItems(args.companyCode, args.filter, args.include);
      return { 
        content: [{ 
          type: 'text', 
          text: `Items retrieved!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'create_item': {
      const result = await avataxClient.createItem(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Item created successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'update_item': {
      const result = await avataxClient.updateItem(args);
      return { 
        content: [{ 
          type: 'text', 
          text: `Item updated successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }
    
    case 'delete_item': {
      const result = await avataxClient.deleteItem(args.companyCode, args.itemId);
      return { 
        content: [{ 
          type: 'text', 
          text: `Item deleted successfully!\n\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    }

    // Phase 6: Location Management
    case 'resolve_address': {
      const result = await avataxClient.resolveAddress(args);
      return {
        content: [{
          type: 'text',
          text: `Address resolved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'resolve_address_post': {
      const result = await avataxClient.resolveAddressPost(args);
      return {
        content: [{
          type: 'text',
          text: `Address resolved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'list_locations_by_company': {
      const result = await avataxClient.listLocationsByCompany(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Company locations retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_location': {
      const result = await avataxClient.createLocation(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Location created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'update_location': {
      const result = await avataxClient.updateLocation(args.companyCode, args.locationId, args);
      return {
        content: [{
          type: 'text',
          text: `Location updated successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'delete_location': {
      const result = await avataxClient.deleteLocation(args.companyCode, args.locationId);
      return {
        content: [{
          type: 'text',
          text: `Location deleted successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    // Phase 7: Customer Management
    case 'list_customers': {
      const result = await avataxClient.listCustomers(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Customers retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_customer': {
      const result = await avataxClient.createCustomer(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Customer created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_customer': {
      const result = await avataxClient.getCustomer(args.companyCode, args.customerCode, args.include);
      return {
        content: [{
          type: 'text',
          text: `Customer details retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'update_customer': {
      const result = await avataxClient.updateCustomer(args.companyCode, args.customerCode, args);
      return {
        content: [{
          type: 'text',
          text: `Customer updated successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'delete_customer': {
      const result = await avataxClient.deleteCustomer(args.companyCode, args.customerCode);
      return {
        content: [{
          type: 'text',
          text: `Customer deleted successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'list_customer_certificates': {
      const result = await avataxClient.listCustomerCertificates(args.companyCode, args.customerCode, args);
      return {
        content: [{
          type: 'text',
          text: `Customer certificates retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_customer_certificate': {
      const result = await avataxClient.createCustomerCertificate(args.companyCode, args.customerCode, args);
      return {
        content: [{
          type: 'text',
          text: `Customer certificate created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    // Phase 8: Reporting & Compliance
    case 'list_transactions': {
      const result = await avataxClient.listTransactions(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Transactions retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'export_transactions': {
      const result = await avataxClient.exportTransactions(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Transaction export initiated successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_filing_calendar': {
      const result = await avataxClient.getFilingCalendar(args.companyCode, args.returnName);
      return {
        content: [{
          type: 'text',
          text: `Filing calendar retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_filing_status': {
      const result = await avataxClient.getFilingStatus(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Filing status retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'approve_filing': {
      const result = await avataxClient.approveFiling(args.companyCode, args.filingReturnId);
      return {
        content: [{
          type: 'text',
          text: `Filing approved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_worksheet': {
      const result = await avataxClient.getWorksheet(args.companyCode, args.filingReturnId);
      return {
        content: [{
          type: 'text',
          text: `Worksheet retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_notices': {
      const result = await avataxClient.getNotices(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Notices retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_notice_responsibility': {
      const result = await avataxClient.createNoticeResponsibility(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Notice responsibility created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_multi_document': {
      const result = await avataxClient.getMultiDocument(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Multi-document transaction retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_audit_trail': {
      const result = await avataxClient.getAuditTrail(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Audit trail retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    // Phase 9: Advanced Features
    case 'get_tax_rates': {
      const result = await avataxClient.getTaxRates(args);
      return {
        content: [{
          type: 'text',
          text: `Tax rates retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_jurisdictions': {
      const result = await avataxClient.getJurisdictions(args);
      return {
        content: [{
          type: 'text',
          text: `Jurisdictions retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_certificate_request': {
      const result = await avataxClient.createCertificateRequest(args.companyCode, args);
      return {
        content: [{
          type: 'text',
          text: `Certificate request created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_certificate_setup': {
      const result = await avataxClient.getCertificateSetup(args.companyCode);
      return {
        content: [{
          type: 'text',
          text: `Certificate setup retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'test_connectivity': {
      const result = await avataxClient.testConnectivity(args.testType);
      return {
        content: [{
          type: 'text',
          text: `Connectivity test completed!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_settings': {
      const result = await avataxClient.getSettings(args.companyCode);
      return {
        content: [{
          type: 'text',
          text: `Settings retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'bulk_tax_calculation': {
      const result = await avataxClient.bulkTaxCalculation(args.companyCode, args.transactions);
      return {
        content: [{
          type: 'text',
          text: `Bulk tax calculation completed!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_tax_content': {
      const result = await avataxClient.getTaxContent(args);
      return {
        content: [{
          type: 'text',
          text: `Tax content retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    // Phase 10: User & Account Management
    case 'list_users': {
      const result = await avataxClient.listUsers(args.accountId, {
        filter: args.filter,
        include: args.include,
        top: args.top,
        skip: args.skip
      });
      return {
        content: [{
          type: 'text',
          text: `Users listed successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'create_user': {
      const result = await avataxClient.createUser(args.accountId, {
        userName: args.userName,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        passwordHash: args.passwordHash,
        isActive: args.isActive
      });
      return {
        content: [{
          type: 'text',
          text: `User created successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_user': {
      const result = await avataxClient.getUser(args.accountId, args.userId, args.include);
      return {
        content: [{
          type: 'text',
          text: `User details retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'update_user': {
      const result = await avataxClient.updateUser(args.accountId, args.userId, {
        userName: args.userName,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        isActive: args.isActive
      });
      return {
        content: [{
          type: 'text',
          text: `User updated successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'delete_user': {
      const result = await avataxClient.deleteUser(args.accountId, args.userId);
      return {
        content: [{
          type: 'text',
          text: `User deleted successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_account': {
      const result = await avataxClient.getAccount(args.accountId, args.include);
      return {
        content: [{
          type: 'text',
          text: `Account details retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'update_account': {
      const result = await avataxClient.updateAccount(args.accountId, {
        name: args.name,
        effectiveDate: args.effectiveDate,
        endDate: args.endDate,
        accountStatusId: args.accountStatusId
      });
      return {
        content: [{
          type: 'text',
          text: `Account updated successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }

    case 'get_subscriptions': {
      const result = await avataxClient.getSubscriptions(args.accountId, args.filter);
      return {
        content: [{
          type: 'text',
          text: `Subscriptions retrieved successfully!\n\n${JSON.stringify(result, null, 2)}`
        }]
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
