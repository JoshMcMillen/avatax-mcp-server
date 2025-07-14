import { AvaTaxConfig } from './config.js';
import Avatax from 'avatax';

class AvataxClient {
    private client: any;
    private config: AvaTaxConfig;

    constructor(config: AvaTaxConfig) {
        this.config = config;
        
        this.client = new Avatax({
            appName: config.appName || 'AvaTax-MCP-Server',
            appVersion: config.appVersion || '1.0.0',
            environment: config.environment,
            machineName: config.machineName || 'MCP-Server',
            timeout: config.timeout || 30000
        }).withSecurity({
            username: config.accountId,
            password: config.licenseKey
        });
    }

    private handleError(error: any): never {
        let errorMessage = `AvaTax API Error: ${error.message || 'Unknown error'}`;
        
        // The Avatax SDK error structure is different
        if (error.response?.data) {
            const errorData = error.response.data;
            
            // Check for the standard AvaTax error response format
            if (errorData.error) {
                const err = errorData.error;
                errorMessage = `AvaTax Error [${err.code || 'Unknown'}]: ${err.message || 'Unknown error'}`;
                
                // Include detailed error information if available
                if (err.details && Array.isArray(err.details)) {
                    const details = err.details.map((d: any) => 
                        `  - ${d.message || d.description} ${d.code ? `(${d.code})` : ''}`
                    ).join('\n');
                    errorMessage += '\nDetails:\n' + details;
                }
            } else if (errorData.message) {
                // Sometimes the error is directly in the data
                errorMessage = `AvaTax Error: ${errorData.message}`;
            }
        }
        
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers?.['retry-after'];
            errorMessage = `AvaTax API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`;
        } else if (error.response?.status === 401) {
            errorMessage = 'AvaTax Authentication failed. Please check your Account ID and License Key.';
        } else if (error.response?.status === 403) {
            errorMessage = 'AvaTax Authorization failed. Your account may not have access to this feature.';
        }
        
        throw new Error(errorMessage);
    }

    private validateTransactionData(data: any): void {
        // Validate required fields
        if (!data.date || !data.customerCode || !data.lines) {
            throw new Error('Missing required transaction fields');
        }
        
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            throw new Error('Invalid date format. Use YYYY-MM-DD');
        }
        
        // Validate lines
        if (!Array.isArray(data.lines) || data.lines.length === 0) {
            throw new Error('Transaction must have at least one line item');
        }
        
        // Sanitize string inputs
        if (data.customerCode) data.customerCode = this.sanitizeString(data.customerCode);
        data.lines.forEach((line: any) => {
            if (line.description) line.description = this.sanitizeString(line.description);
            if (line.itemCode) line.itemCode = this.sanitizeString(line.itemCode);
        });
    }

    private sanitizeString(input: string): string {
        return input.replace(/[<>'"]/g, '');
    }

    public async calculateTax(transactionData: any) {
        try {
            // Determine company code - require it for transactions
            const companyCode = transactionData.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for tax calculations. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
            }

            // Prepare the transaction model
            const model = {
                type: transactionData.type || 'SalesOrder',
                companyCode: companyCode,
                date: transactionData.date,
                customerCode: transactionData.customerCode,
                lines: transactionData.lines.map((line: any, index: number) => ({
                    number: line.number || `${index + 1}`,
                    quantity: line.quantity || 1,
                    amount: line.amount,
                    itemCode: line.itemCode,
                    description: line.description,
                    taxCode: line.taxCode || 'P0000000'
                })),
                // Addresses should be at the transaction level, not line level
                addresses: {
                    shipFrom: transactionData.lines[0]?.addresses?.shipFrom || transactionData.shipFrom,
                    shipTo: transactionData.lines[0]?.addresses?.shipTo || transactionData.shipTo
                },
                commit: false
            };

            // Validate before sending
            this.validateTransactionData(model);
            
            const result = await this.client.createTransaction({ model });
            return {
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                totalTaxable: result.totalTaxable,
                lines: result.lines,
                taxDate: result.taxDate,
                status: result.status
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async validateAddress(addressData: any) {
        try {
            // Prepare the address model for the SDK
            const model = {
                line1: addressData.line1,
                line2: addressData.line2 || undefined,
                line3: addressData.line3 || undefined,
                city: addressData.city,
                region: addressData.region,
                postalCode: addressData.postalCode,
                country: addressData.country || 'US'
            };

            // Use the AvaTax SDK's resolveAddress method
            const result = await this.client.resolveAddress(model);
            
            // Check if address validation was successful
            if (result && result.validatedAddresses && result.validatedAddresses.length > 0) {
                const validatedAddress = result.validatedAddresses[0];
                return {
                    valid: true,
                    normalized: {
                        line1: validatedAddress.line1,
                        line2: validatedAddress.line2,
                        line3: validatedAddress.line3,
                        city: validatedAddress.city,
                        region: validatedAddress.region,
                        postalCode: validatedAddress.postalCode,
                        country: validatedAddress.country
                    },
                    coordinates: validatedAddress.latitude && validatedAddress.longitude ? {
                        latitude: validatedAddress.latitude,
                        longitude: validatedAddress.longitude
                    } : undefined,
                    messages: result.messages || []
                };
            }
            
            // Return validation failure with any available messages
            return {
                valid: false,
                messages: result?.messages || [],
                errors: result?.errors || ['Address could not be validated']
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createTransaction(transactionData: any) {
        try {
            // Determine company code - require it for transactions
            const companyCode = transactionData.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for creating transactions. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
            }

            // Prepare the transaction model
            const model = {
                type: transactionData.type || 'SalesInvoice',
                companyCode: companyCode,
                date: transactionData.date,
                customerCode: transactionData.customerCode,
                lines: transactionData.lines.map((line: any, index: number) => ({
                    number: line.number || `${index + 1}`,
                    quantity: line.quantity || 1,
                    amount: line.amount,
                    itemCode: line.itemCode,
                    description: line.description,
                    taxCode: line.taxCode || 'P0000000'
                })),
                // Addresses should be at the transaction level
                addresses: {
                    shipFrom: transactionData.lines[0]?.addresses?.shipFrom || transactionData.shipFrom,
                    shipTo: transactionData.lines[0]?.addresses?.shipTo || transactionData.shipTo
                },
                commit: transactionData.commit !== false // Default to true for createTransaction
            };

            // Validate before sending
            this.validateTransactionData(model);
            
            const result = await this.client.createTransaction({ model });
            return {
                id: result.id,
                code: result.code,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                status: result.status,
                committed: result.status === 'Committed'
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async ping() {
        try {
            const result = await this.client.ping();
            return {
                authenticated: result.authenticated,
                version: result.version,
                environment: this.config.environment
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getCompanies(filter?: string) {
        try {
            const params: any = {};
            
            // Add search filter if provided
            if (filter) {
                params.$filter = `companyCode contains '${this.sanitizeString(filter)}' or name contains '${this.sanitizeString(filter)}'`;
            }
            
            // Limit results to make the response manageable
            params.$top = 50;
            params.$orderby = 'companyCode';
            
            const result = await this.client.queryCompanies(params);
            
            // Return simplified company information
            return {
                companies: result.value?.map((company: any) => ({
                    id: company.id,
                    companyCode: company.companyCode,
                    name: company.name,
                    isActive: company.isActive,
                    isDefault: company.isDefault,
                    defaultCountry: company.defaultCountry
                })) || [],
                count: result['@recordsetCount'] || result.value?.length || 0
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }
}

export default AvataxClient;