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

    // Phase 1: Core Transaction Operations
    public async voidTransaction(companyCode: string, transactionCode: string, voidType: string = 'DocVoided') {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for voiding transactions. Please specify a companyCode parameter or ask the user which company to use.');
            }

            const model = {
                code: voidType
            };

            const result = await this.client.voidTransaction(finalCompanyCode, transactionCode, model);
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                voided: result.status === 'Cancelled'
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async refundTransaction(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for refunding transactions. Please specify a companyCode parameter.');
            }

            // Create a return invoice based on the original transaction
            const model = {
                type: 'ReturnInvoice',
                companyCode: companyCode,
                date: params.refundDate,
                customerCode: `REFUND-${params.originalTransactionCode}`,
                code: params.refundTransactionCode,
                lines: params.lines || [],
                commit: true
            };

            // If no specific lines provided, this will be a full refund
            if (!params.lines || params.lines.length === 0) {
                // Get original transaction first to create proper refund
                const originalTx = await this.verifyTransaction(companyCode, params.originalTransactionCode);
                if (originalTx && originalTx.lines) {
                    model.lines = originalTx.lines.map((line: any) => ({
                        number: line.lineNumber,
                        quantity: -Math.abs(line.quantity || 1), // Negative for refund
                        amount: -Math.abs(line.lineAmount || 0), // Negative for refund
                        description: `REFUND: ${line.description || ''}`,
                        itemCode: line.itemCode,
                        taxCode: line.taxCode
                    }));
                }
            }

            const result = await this.client.createTransaction({ model });
            return {
                id: result.id,
                code: result.code,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                status: result.status,
                refunded: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async adjustTransaction(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for adjusting transactions. Please specify a companyCode parameter.');
            }

            const model = {
                description: params.adjustmentDescription,
                reason: params.adjustmentReason || 'Other',
                newTransaction: params.newTransaction
            };

            const result = await this.client.adjustTransaction(companyCode, params.transactionCode, model);
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                adjusted: true,
                adjustmentReason: params.adjustmentReason
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async settleTransaction(companyCode: string, transactionCode: string, paymentDate?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for settling transactions. Please specify a companyCode parameter.');
            }

            const model = {
                paymentDate: paymentDate || new Date().toISOString().split('T')[0]
            };

            const result = await this.client.settleTransaction(finalCompanyCode, transactionCode, model);
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                settled: true,
                paymentDate: model.paymentDate
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async verifyTransaction(companyCode: string, transactionCode: string, documentType: string = 'SalesInvoice', include: string = 'Lines') {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for verifying transactions. Please specify a companyCode parameter.');
            }

            const result = await this.client.getTransactionByCode(finalCompanyCode, transactionCode, documentType, include);
            return {
                id: result.id,
                code: result.code,
                date: result.date,
                status: result.status,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                lines: result.lines,
                addresses: result.addresses,
                customerCode: result.customerCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async lockTransaction(companyCode: string, transactionCode: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for locking transactions. Please specify a companyCode parameter.');
            }

            const result = await this.client.lockTransaction(finalCompanyCode, transactionCode);
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                locked: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async unlockTransaction(companyCode: string, transactionCode: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for unlocking transactions. Please specify a companyCode parameter.');
            }

            const result = await this.client.uncommitTransaction(finalCompanyCode, transactionCode);
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                locked: false
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 2: Batch Operations
    public async createBatch(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for creating batches. Please specify a companyCode parameter.');
            }

            const model = {
                name: params.batchName,
                type: 'TransactionImport',
                batchAgent: 'AvaTax-MCP',
                options: '',
                files: [{
                    name: `${params.batchName}.json`,
                    content: btoa(JSON.stringify({
                        transactions: params.transactions
                    }))
                }]
            };

            const result = await this.client.createBatches(companyCode, [model]);
            return {
                id: result[0]?.id,
                name: result[0]?.name,
                status: result[0]?.status,
                recordCount: result[0]?.recordCount
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getBatchStatus(companyCode: string, batchId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for checking batch status. Please specify a companyCode parameter.');
            }

            const result = await this.client.getBatch(finalCompanyCode, batchId);
            return {
                id: result.id,
                name: result.name,
                status: result.status,
                recordCount: result.recordCount,
                currentRecord: result.currentRecord,
                completedDate: result.completedDate
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async downloadBatch(companyCode: string, batchId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for downloading batch results. Please specify a companyCode parameter.');
            }

            const result = await this.client.downloadBatch(finalCompanyCode, batchId);
            return {
                batchId: batchId,
                downloadUrl: result.downloadUrl || 'Results available via API',
                content: result.content || result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async cancelBatch(companyCode: string, batchId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for canceling batches. Please specify a companyCode parameter.');
            }

            const result = await this.client.cancelBatch(finalCompanyCode, batchId);
            return {
                id: result.id,
                name: result.name,
                status: result.status,
                cancelled: result.status === 'Cancelled'
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 3: Company & Configuration Management
    public async createCompany(params: any) {
        try {
            const model = {
                companyCode: params.companyCode,
                name: params.name,
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                taxpayerIdNumber: params.taxpayerIdNumber,
                companyClassification: params.companyClassification
            };

            const result = await this.client.createCompanies([model]);
            return {
                id: result[0]?.id,
                companyCode: result[0]?.companyCode,
                name: result[0]?.name,
                isActive: result[0]?.isActive
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateCompany(params: any) {
        try {
            const model = {
                name: params.name,
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                taxpayerIdNumber: params.taxpayerIdNumber
            };

            const result = await this.client.updateCompany(params.companyId, model);
            return {
                id: result.id,
                companyCode: result.companyCode,
                name: result.name,
                isActive: result.isActive
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getCompanyConfiguration(companyCode?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting company configuration. Please specify a companyCode parameter.');
            }

            const result = await this.client.listCompanyConfigurations(finalCompanyCode);
            return {
                companyCode: finalCompanyCode,
                configurations: result.value || result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async setCompanyConfiguration(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for setting company configuration. Please specify a companyCode parameter.');
            }

            const model = [{
                category: params.category,
                name: params.name,
                value: params.value
            }];

            const result = await this.client.createCompanyConfigurations(companyCode, model);
            return {
                companyCode: companyCode,
                category: params.category,
                name: params.name,
                value: params.value,
                created: result.length > 0
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async listCompanyLocations(companyCode?: string, filter?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing company locations. Please specify a companyCode parameter.');
            }

            const result = await this.client.listLocationsByCompany(finalCompanyCode, filter);
            return {
                companyCode: finalCompanyCode,
                locations: result.value || result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createCompanyLocation(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for creating company locations. Please specify a companyCode parameter.');
            }

            const model = {
                locationCode: params.locationCode,
                description: params.description,
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                isDefault: params.isDefault || false
            };

            const result = await this.client.createLocations(companyCode, [model]);
            return {
                id: result[0]?.id,
                locationCode: result[0]?.locationCode,
                description: result[0]?.description,
                isDefault: result[0]?.isDefault
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateCompanyLocation(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for updating company locations. Please specify a companyCode parameter.');
            }

            const model = {
                description: params.description,
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                isDefault: params.isDefault
            };

            const result = await this.client.updateLocation(companyCode, params.locationId, model);
            return {
                id: result.id,
                locationCode: result.locationCode,
                description: result.description,
                isDefault: result.isDefault
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteCompanyLocation(companyCode: string, locationId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for deleting company locations. Please specify a companyCode parameter.');
            }

            const result = await this.client.deleteLocation(finalCompanyCode, locationId);
            return {
                deleted: true,
                locationId: locationId,
                companyCode: finalCompanyCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 4: Nexus Management
    public async listNexus(companyCode?: string, filter?: string, include?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing nexus. Please specify a companyCode parameter.');
            }

            const result = await this.client.listNexusByCompany(finalCompanyCode, filter, include);
            return {
                companyCode: finalCompanyCode,
                nexusDeclarations: result.value || result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createNexus(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for creating nexus. Please specify a companyCode parameter.');
            }

            const model = {
                country: params.country,
                region: params.region,
                jurisTypeId: params.jurisTypeId || 'STA',
                jurisName: params.jurisName,
                effectiveDate: params.effectiveDate,
                endDate: params.endDate,
                nexusTypeId: params.nexusTypeId || 'SalesOrSellersUseTax',
                hasLocalNexus: params.hasLocalNexus || false
            };

            const result = await this.client.createNexus(companyCode, [model]);
            return {
                id: result[0]?.id,
                country: result[0]?.country,
                region: result[0]?.region,
                jurisName: result[0]?.jurisName,
                nexusTypeId: result[0]?.nexusTypeId
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateNexus(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for updating nexus. Please specify a companyCode parameter.');
            }

            const model = {
                effectiveDate: params.effectiveDate,
                endDate: params.endDate,
                nexusTypeId: params.nexusTypeId,
                hasLocalNexus: params.hasLocalNexus
            };

            const result = await this.client.updateNexus(companyCode, params.nexusId, model);
            return {
                id: result.id,
                country: result.country,
                region: result.region,
                jurisName: result.jurisName,
                nexusTypeId: result.nexusTypeId
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteNexus(companyCode: string, nexusId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for deleting nexus. Please specify a companyCode parameter.');
            }

            const result = await this.client.deleteNexus(finalCompanyCode, nexusId);
            return {
                deleted: true,
                nexusId: nexusId,
                companyCode: finalCompanyCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getNexusByAddress(params: any) {
        try {
            const model = {
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country
            };

            const result = await this.client.getNexusByAddress(model.line1, model.line2, model.city, model.region, model.postalCode, model.country, params.taxTypeId);
            return {
                address: model,
                nexusObligations: result.value || result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async declareNexusByAddress(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for declaring nexus by address. Please specify a companyCode parameter.');
            }

            const nexusDeclarations = params.addresses.map((address: any) => ({
                country: address.country,
                region: address.region,
                jurisTypeId: 'STA',
                jurisName: address.region,
                effectiveDate: params.effectiveDate,
                nexusTypeId: params.nexusTypeId || 'SalesOrSellersUseTax',
                hasLocalNexus: false
            }));

            const result = await this.client.createNexus(companyCode, nexusDeclarations);
            return {
                companyCode: companyCode,
                declarationsCreated: result.length,
                nexusDeclarations: result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 5: Tax Code & Item Management
    public async listTaxCodes(companyCode?: string, filter?: string, include?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                // List system tax codes if no company specified
                const result = await this.client.listTaxCodes(filter, include);
                return {
                    taxCodes: result.value || result,
                    isSystemTaxCodes: true
                };
            }

            const result = await this.client.listTaxCodesByCompany(finalCompanyCode, filter, include);
            return {
                companyCode: finalCompanyCode,
                taxCodes: result.value || result,
                isSystemTaxCodes: false
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createTaxCode(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for creating tax codes. Please specify a companyCode parameter.');
            }

            const model = {
                taxCode: params.taxCode,
                description: params.description,
                taxCodeTypeId: params.taxCodeTypeId || 'Product',
                isPhysical: params.isPhysical !== false,
                goodsServiceCode: params.goodsServiceCode
            };

            const result = await this.client.createTaxCodes(companyCode, [model]);
            return {
                id: result[0]?.id,
                taxCode: result[0]?.taxCode,
                description: result[0]?.description,
                taxCodeTypeId: result[0]?.taxCodeTypeId
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateTaxCode(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for updating tax codes. Please specify a companyCode parameter.');
            }

            const model = {
                description: params.description,
                taxCodeTypeId: params.taxCodeTypeId,
                isPhysical: params.isPhysical,
                goodsServiceCode: params.goodsServiceCode
            };

            const result = await this.client.updateTaxCode(companyCode, params.taxCodeId, model);
            return {
                id: result.id,
                taxCode: result.taxCode,
                description: result.description,
                taxCodeTypeId: result.taxCodeTypeId
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteTaxCode(companyCode: string, taxCodeId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for deleting tax codes. Please specify a companyCode parameter.');
            }

            const result = await this.client.deleteTaxCode(finalCompanyCode, taxCodeId);
            return {
                deleted: true,
                taxCodeId: taxCodeId,
                companyCode: finalCompanyCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async listItems(companyCode?: string, filter?: string, include?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing items. Please specify a companyCode parameter.');
            }

            const result = await this.client.listItemsByCompany(finalCompanyCode, filter, include);
            return {
                companyCode: finalCompanyCode,
                items: result.value || result
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createItem(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for creating items. Please specify a companyCode parameter.');
            }

            const model = {
                itemCode: params.itemCode,
                description: params.description,
                taxCode: params.taxCode || 'P0000000',
                itemGroup: params.itemGroup,
                category: params.category,
                upc: params.upc
            };

            const result = await this.client.createItems(companyCode, [model]);
            return {
                id: result[0]?.id,
                itemCode: result[0]?.itemCode,
                description: result[0]?.description,
                taxCode: result[0]?.taxCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateItem(params: any) {
        try {
            const companyCode = params.companyCode || this.config.companyCode;
            if (!companyCode) {
                throw new Error('Company code is required for updating items. Please specify a companyCode parameter.');
            }

            const model = {
                description: params.description,
                taxCode: params.taxCode,
                itemGroup: params.itemGroup,
                category: params.category,
                upc: params.upc
            };

            const result = await this.client.updateItem(companyCode, params.itemId, model);
            return {
                id: result.id,
                itemCode: result.itemCode,
                description: result.description,
                taxCode: result.taxCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteItem(companyCode: string, itemId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for deleting items. Please specify a companyCode parameter.');
            }

            const result = await this.client.deleteItem(finalCompanyCode, itemId);
            return {
                deleted: true,
                itemId: itemId,
                companyCode: finalCompanyCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 6: Location Management

    public async resolveAddress(params: {
        line1: string;
        line2?: string;
        line3?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        textCase?: string;
    }) {
        try {
            const result = await this.client.resolveAddress({
                line1: params.line1,
                line2: params.line2,
                line3: params.line3,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                textCase: params.textCase
            });
            return {
                address: result.address,
                validatedAddresses: result.validatedAddresses,
                coordinates: result.coordinates,
                resolutionQuality: result.resolutionQuality,
                taxAuthorities: result.taxAuthorities
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async resolveAddressPost(params: {
        line1: string;
        line2?: string;
        line3?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        textCase?: string;
    }) {
        try {
            const model = {
                line1: params.line1,
                line2: params.line2,
                line3: params.line3,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                textCase: params.textCase
            };

            const result = await this.client.resolveAddressPost(model);
            return {
                address: result.address,
                validatedAddresses: result.validatedAddresses,
                coordinates: result.coordinates,
                resolutionQuality: result.resolutionQuality,
                taxAuthorities: result.taxAuthorities
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async listLocationsByCompany(companyCode?: string, params?: {
        filter?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing locations. Please specify a companyCode parameter.');
            }

            const options = params ? {
                $filter: params.filter,
                $top: params.top,
                $skip: params.skip,
                $orderBy: params.orderBy
            } : undefined;

            const result = await this.client.listLocationsByCompany(finalCompanyCode, options);
            return {
                count: result['@recordsetCount'],
                locations: result.value?.map((location: any) => ({
                    id: location.id,
                    companyId: location.companyId,
                    locationCode: location.locationCode,
                    description: location.description,
                    addressTypeId: location.addressTypeId,
                    addressCategoryId: location.addressCategoryId,
                    line1: location.line1,
                    line2: location.line2,
                    line3: location.line3,
                    city: location.city,
                    county: location.county,
                    region: location.region,
                    postalCode: location.postalCode,
                    country: location.country,
                    isDefault: location.isDefault
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createLocation(companyCode: string, params: {
        locationCode: string;
        description: string;
        addressTypeId: string;
        addressCategoryId: string;
        line1: string;
        line2?: string;
        line3?: string;
        city: string;
        county?: string;
        region: string;
        postalCode: string;
        country: string;
        isDefault?: boolean;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for creating locations. Please specify a companyCode parameter.');
            }

            const model = {
                locationCode: params.locationCode,
                description: params.description,
                addressTypeId: params.addressTypeId,
                addressCategoryId: params.addressCategoryId,
                line1: params.line1,
                line2: params.line2,
                line3: params.line3,
                city: params.city,
                county: params.county,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                isDefault: params.isDefault
            };

            const result = await this.client.createLocations(finalCompanyCode, [model]);
            const location = result[0];
            return {
                id: location.id,
                companyId: location.companyId,
                locationCode: location.locationCode,
                description: location.description,
                addressTypeId: location.addressTypeId,
                addressCategoryId: location.addressCategoryId,
                line1: location.line1,
                line2: location.line2,
                line3: location.line3,
                city: location.city,
                county: location.county,
                region: location.region,
                postalCode: location.postalCode,
                country: location.country,
                isDefault: location.isDefault
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateLocation(companyCode: string, locationId: string, params: {
        locationCode?: string;
        description?: string;
        addressTypeId?: string;
        addressCategoryId?: string;
        line1?: string;
        line2?: string;
        line3?: string;
        city?: string;
        county?: string;
        region?: string;
        postalCode?: string;
        country?: string;
        isDefault?: boolean;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for updating locations. Please specify a companyCode parameter.');
            }

            const model = {
                locationCode: params.locationCode,
                description: params.description,
                addressTypeId: params.addressTypeId,
                addressCategoryId: params.addressCategoryId,
                line1: params.line1,
                line2: params.line2,
                line3: params.line3,
                city: params.city,
                county: params.county,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country,
                isDefault: params.isDefault
            };

            const result = await this.client.updateLocation(finalCompanyCode, locationId, model);
            return {
                id: result.id,
                companyId: result.companyId,
                locationCode: result.locationCode,
                description: result.description,
                addressTypeId: result.addressTypeId,
                addressCategoryId: result.addressCategoryId,
                line1: result.line1,
                line2: result.line2,
                line3: result.line3,
                city: result.city,
                county: result.county,
                region: result.region,
                postalCode: result.postalCode,
                country: result.country,
                isDefault: result.isDefault
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteLocation(companyCode: string, locationId: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for deleting locations. Please specify a companyCode parameter.');
            }

            const result = await this.client.deleteLocation(finalCompanyCode, locationId);
            return {
                deleted: true,
                locationId: locationId,
                companyCode: finalCompanyCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 7: Customer Management

    public async listCustomers(companyCode?: string, params?: {
        filter?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing customers. Please specify a companyCode parameter.');
            }

            const options = params ? {
                $filter: params.filter,
                $top: params.top,
                $skip: params.skip,
                $orderBy: params.orderBy
            } : undefined;

            const result = await this.client.listCustomersByCompany(finalCompanyCode, options);
            return {
                count: result['@recordsetCount'],
                customers: result.value?.map((customer: any) => ({
                    id: customer.id,
                    companyId: customer.companyId,
                    customerCode: customer.customerCode,
                    name: customer.name,
                    attnName: customer.attnName,
                    line1: customer.line1,
                    line2: customer.line2,
                    city: customer.city,
                    region: customer.region,
                    postalCode: customer.postalCode,
                    country: customer.country,
                    phoneNumber: customer.phoneNumber,
                    emailAddress: customer.emailAddress,
                    isActive: customer.isActive
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createCustomer(companyCode?: string, params?: {
        customerCode: string;
        name: string;
        attnName?: string;
        line1: string;
        line2?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        phoneNumber?: string;
        emailAddress?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for creating customers. Please specify a companyCode parameter.');
            }

            const model = {
                customerCode: params?.customerCode,
                name: params?.name,
                attnName: params?.attnName,
                line1: params?.line1,
                line2: params?.line2,
                city: params?.city,
                region: params?.region,
                postalCode: params?.postalCode,
                country: params?.country,
                phoneNumber: params?.phoneNumber,
                emailAddress: params?.emailAddress
            };

            const result = await this.client.createCustomers(finalCompanyCode, [model]);
            const customer = result[0];
            return {
                id: customer.id,
                companyId: customer.companyId,
                customerCode: customer.customerCode,
                name: customer.name,
                attnName: customer.attnName,
                line1: customer.line1,
                line2: customer.line2,
                city: customer.city,
                region: customer.region,
                postalCode: customer.postalCode,
                country: customer.country,
                phoneNumber: customer.phoneNumber,
                emailAddress: customer.emailAddress,
                isActive: customer.isActive
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getCustomer(companyCode?: string, customerCode?: string, include?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting customer details. Please specify a companyCode parameter.');
            }

            if (!customerCode) {
                throw new Error('Customer code is required for getting customer details.');
            }

            const result = await this.client.getCustomer(finalCompanyCode, customerCode, include);
            return {
                id: result.id,
                companyId: result.companyId,
                customerCode: result.customerCode,
                name: result.name,
                attnName: result.attnName,
                line1: result.line1,
                line2: result.line2,
                city: result.city,
                region: result.region,
                postalCode: result.postalCode,
                country: result.country,
                phoneNumber: result.phoneNumber,
                emailAddress: result.emailAddress,
                isActive: result.isActive,
                certificates: result.certificates
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateCustomer(companyCode?: string, customerCode?: string, params?: {
        name?: string;
        attnName?: string;
        line1?: string;
        line2?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        country?: string;
        phoneNumber?: string;
        emailAddress?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for updating customers. Please specify a companyCode parameter.');
            }

            if (!customerCode) {
                throw new Error('Customer code is required for updating customers.');
            }

            const model = {
                name: params?.name,
                attnName: params?.attnName,
                line1: params?.line1,
                line2: params?.line2,
                city: params?.city,
                region: params?.region,
                postalCode: params?.postalCode,
                country: params?.country,
                phoneNumber: params?.phoneNumber,
                emailAddress: params?.emailAddress
            };

            const result = await this.client.updateCustomer(finalCompanyCode, customerCode, model);
            return {
                id: result.id,
                companyId: result.companyId,
                customerCode: result.customerCode,
                name: result.name,
                attnName: result.attnName,
                line1: result.line1,
                line2: result.line2,
                city: result.city,
                region: result.region,
                postalCode: result.postalCode,
                country: result.country,
                phoneNumber: result.phoneNumber,
                emailAddress: result.emailAddress,
                isActive: result.isActive
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteCustomer(companyCode?: string, customerCode?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for deleting customers. Please specify a companyCode parameter.');
            }

            if (!customerCode) {
                throw new Error('Customer code is required for deleting customers.');
            }

            const result = await this.client.deleteCustomer(finalCompanyCode, customerCode);
            return {
                deleted: true,
                customerCode: customerCode,
                companyCode: finalCompanyCode
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async listCustomerCertificates(companyCode?: string, customerCode?: string, params?: {
        filter?: string;
        include?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing customer certificates. Please specify a companyCode parameter.');
            }

            if (!customerCode) {
                throw new Error('Customer code is required for listing customer certificates.');
            }

            const options = params ? {
                $filter: params.filter,
                $include: params.include
            } : undefined;

            const result = await this.client.listCertificatesForCustomer(finalCompanyCode, customerCode, options);
            return {
                count: result['@recordsetCount'],
                certificates: result.value?.map((cert: any) => ({
                    id: cert.id,
                    companyId: cert.companyId,
                    customerId: cert.customerId,
                    exemptionNumber: cert.exemptionNumber,
                    exemptionReasonId: cert.exemptionReasonId,
                    exemptionType: cert.exemptionType,
                    effectiveDate: cert.effectiveDate,
                    expirationDate: cert.expirationDate,
                    signedDate: cert.signedDate,
                    filename: cert.filename,
                    isValid: cert.isValid,
                    exemptionReason: cert.exemptionReason
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createCustomerCertificate(companyCode?: string, customerCode?: string, params?: {
        exemptionNumber: string;
        exemptionReasonId: number;
        exemptionType: string;
        effectiveDate: string;
        expirationDate?: string;
        signedDate: string;
        filename?: string;
        documentExists?: boolean;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for creating customer certificates. Please specify a companyCode parameter.');
            }

            if (!customerCode) {
                throw new Error('Customer code is required for creating customer certificates.');
            }

            const model = {
                exemptionNumber: params?.exemptionNumber,
                exemptionReasonId: params?.exemptionReasonId,
                exemptionType: params?.exemptionType,
                effectiveDate: params?.effectiveDate,
                expirationDate: params?.expirationDate,
                signedDate: params?.signedDate,
                filename: params?.filename,
                documentExists: params?.documentExists || false
            };

            const result = await this.client.createCertificatesForCustomer(finalCompanyCode, customerCode, [model]);
            const certificate = result[0];
            return {
                id: certificate.id,
                companyId: certificate.companyId,
                customerId: certificate.customerId,
                exemptionNumber: certificate.exemptionNumber,
                exemptionReasonId: certificate.exemptionReasonId,
                exemptionType: certificate.exemptionType,
                effectiveDate: certificate.effectiveDate,
                expirationDate: certificate.expirationDate,
                signedDate: certificate.signedDate,
                filename: certificate.filename,
                isValid: certificate.isValid,
                exemptionReason: certificate.exemptionReason
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 8: Reporting & Compliance

    public async listTransactions(companyCode?: string, params?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for listing transactions. Please specify a companyCode parameter.');
            }

            const options = params ? {
                $filter: params.filter,
                $include: params.include,
                $top: params.top,
                $skip: params.skip,
                $orderBy: params.orderBy
            } : undefined;

            const result = await this.client.listTransactionsByCompany(finalCompanyCode, options);
            return {
                count: result['@recordsetCount'],
                transactions: result.value?.map((transaction: any) => ({
                    id: transaction.id,
                    code: transaction.code,
                    date: transaction.date,
                    status: transaction.status,
                    type: transaction.type,
                    customerCode: transaction.customerCode,
                    totalAmount: transaction.totalAmount,
                    totalTax: transaction.totalTax,
                    totalExempt: transaction.totalExempt,
                    reconciled: transaction.reconciled,
                    locationCode: transaction.locationCode,
                    reportingLocationCode: transaction.reportingLocationCode
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async exportTransactions(companyCode?: string, params?: {
        startDate: string;
        endDate: string;
        format: string;
        compressionType?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for exporting transactions. Please specify a companyCode parameter.');
            }

            const model = {
                startDate: params?.startDate,
                endDate: params?.endDate,
                format: params?.format || 'Json',
                compressionType: params?.compressionType || 'None'
            };

            const result = await this.client.createTransactionExportRequest(finalCompanyCode, model);
            return {
                id: result.id,
                format: result.format,
                status: result.status,
                startDate: result.startDate,
                endDate: result.endDate,
                downloadUrl: result.downloadUrl,
                recordCount: result.recordCount
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getFilingCalendar(companyCode?: string, returnName?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting filing calendar. Please specify a companyCode parameter.');
            }

            const options = returnName ? { $filter: `returnName eq '${returnName}'` } : undefined;
            const result = await this.client.getFilingCalendar(finalCompanyCode, options);
            return {
                companyCode: finalCompanyCode,
                filingCalendars: result.value?.map((calendar: any) => ({
                    id: calendar.id,
                    companyId: calendar.companyId,
                    returnName: calendar.returnName,
                    filingFrequency: calendar.filingFrequency,
                    months: calendar.months,
                    effectiveDate: calendar.effectiveDate,
                    endDate: calendar.endDate,
                    country: calendar.country,
                    region: calendar.region
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getFilingStatus(companyCode?: string, params?: {
        endPeriodMonth?: number;
        endPeriodYear?: number;
        frequency?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting filing status. Please specify a companyCode parameter.');
            }

            const options = params ? {
                endPeriodMonth: params.endPeriodMonth,
                endPeriodYear: params.endPeriodYear,
                frequency: params.frequency
            } : undefined;

            const result = await this.client.getFilingStatus(finalCompanyCode, options);
            return {
                companyCode: finalCompanyCode,
                filingReturns: result.value?.map((filing: any) => ({
                    id: filing.id,
                    returnName: filing.returnName,
                    status: filing.status,
                    filingFrequency: filing.filingFrequency,
                    endPeriodMonth: filing.endPeriodMonth,
                    endPeriodYear: filing.endPeriodYear,
                    country: filing.country,
                    region: filing.region,
                    totalSales: filing.totalSales,
                    totalTax: filing.totalTax,
                    totalTaxDue: filing.totalTaxDue
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async approveFiling(companyCode?: string, filingReturnId?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for approving filings. Please specify a companyCode parameter.');
            }

            if (!filingReturnId) {
                throw new Error('Filing return ID is required for approving filings.');
            }

            const result = await this.client.approveFiling(finalCompanyCode, filingReturnId);
            return {
                id: result.id,
                status: result.status,
                approved: result.status === 'Approved',
                approvedDate: result.approvedDate,
                approvedByUserId: result.approvedByUserId
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getWorksheet(companyCode?: string, filingReturnId?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting worksheets. Please specify a companyCode parameter.');
            }

            if (!filingReturnId) {
                throw new Error('Filing return ID is required for getting worksheets.');
            }

            const result = await this.client.getWorksheet(finalCompanyCode, filingReturnId);
            return {
                id: result.id,
                returnName: result.returnName,
                worksheetType: result.worksheetType,
                country: result.country,
                region: result.region,
                worksheetLines: result.worksheetLines?.map((line: any) => ({
                    lineNumber: line.lineNumber,
                    description: line.description,
                    taxableAmount: line.taxableAmount,
                    taxAmount: line.taxAmount,
                    exemptAmount: line.exemptAmount
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getNotices(companyCode?: string, params?: {
        filter?: string;
        top?: number;
        skip?: number;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting notices. Please specify a companyCode parameter.');
            }

            const options = params ? {
                $filter: params.filter,
                $top: params.top,
                $skip: params.skip
            } : undefined;

            const result = await this.client.getNotices(finalCompanyCode, options);
            return {
                count: result['@recordsetCount'],
                notices: result.value?.map((notice: any) => ({
                    id: notice.id,
                    companyId: notice.companyId,
                    status: notice.status,
                    receivedDate: notice.receivedDate,
                    closedDate: notice.closedDate,
                    totalRemit: notice.totalRemit,
                    customerDueDate: notice.customerDueDate,
                    reason: notice.reason,
                    type: notice.type,
                    customerComment: notice.customerComment,
                    hideFromCustomer: notice.hideFromCustomer,
                    expectedResolution: notice.expectedResolution
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createNoticeResponsibility(companyCode?: string, params?: {
        noticeId: string;
        responsiblePersonId: string;
        description?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for creating notice responsibilities. Please specify a companyCode parameter.');
            }

            if (!params?.noticeId || !params?.responsiblePersonId) {
                throw new Error('Notice ID and responsible person ID are required for creating notice responsibilities.');
            }

            const model = {
                noticeId: params.noticeId,
                responsiblePersonId: params.responsiblePersonId,
                description: params.description || 'Notice responsibility assignment'
            };

            const result = await this.client.createNoticeResponsibilities(finalCompanyCode, [model]);
            const responsibility = result[0];
            return {
                id: responsibility.id,
                noticeId: responsibility.noticeId,
                responsiblePersonId: responsibility.responsiblePersonId,
                description: responsibility.description,
                isActive: responsibility.isActive
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getMultiDocument(companyCode?: string, params?: {
        code: string;
        type?: string;
        include?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting multi-document transactions. Please specify a companyCode parameter.');
            }

            if (!params?.code) {
                throw new Error('Multi-document code is required for getting multi-document transactions.');
            }

            const result = await this.client.getMultiDocumentByCode(finalCompanyCode, params.code, params.type, params.include);
            return {
                id: result.id,
                code: result.code,
                type: result.type,
                status: result.status,
                date: result.date,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                totalExempt: result.totalExempt,
                documents: result.documents?.map((doc: any) => ({
                    id: doc.id,
                    code: doc.code,
                    type: doc.type,
                    status: doc.status,
                    totalAmount: doc.totalAmount,
                    totalTax: doc.totalTax
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getAuditTrail(companyCode?: string, params?: {
        transactionId?: string;
        startDate?: string;
        endDate?: string;
        top?: number;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting audit trail. Please specify a companyCode parameter.');
            }

            const options: any = {};
            if (params?.transactionId) {
                options.$filter = `transactionId eq ${params.transactionId}`;
            }
            if (params?.startDate && params?.endDate) {
                const dateFilter = `modifiedDate gte ${params.startDate} and modifiedDate lte ${params.endDate}`;
                options.$filter = options.$filter ? `${options.$filter} and ${dateFilter}` : dateFilter;
            }
            if (params?.top) {
                options.$top = params.top;
            }

            const result = await this.client.getAuditTrail(finalCompanyCode, options);
            return {
                count: result['@recordsetCount'],
                auditTrail: result.value?.map((audit: any) => ({
                    id: audit.id,
                    transactionId: audit.transactionId,
                    fieldName: audit.fieldName,
                    oldValue: audit.oldValue,
                    newValue: audit.newValue,
                    modifiedDate: audit.modifiedDate,
                    modifiedUserId: audit.modifiedUserId,
                    modifiedUserName: audit.modifiedUserName,
                    changeReason: audit.changeReason
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 9: Advanced Features

    public async getTaxRates(params: {
        line1: string;
        line2?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        date?: string;
    }) {
        try {
            const address = {
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country
            };

            const effectiveDate = params.date || new Date().toISOString().split('T')[0];
            const result = await this.client.taxRatesByAddress(
                address.line1,
                address.line2,
                address.city,
                address.region,
                address.postalCode,
                address.country,
                effectiveDate
            );

            return {
                address: address,
                effectiveDate: effectiveDate,
                totalRate: result.totalRate,
                rates: result.rates?.map((rate: any) => ({
                    rate: rate.rate,
                    name: rate.name,
                    type: rate.type,
                    country: rate.country,
                    region: rate.region,
                    jurisdiction: rate.jurisdiction
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getJurisdictions(params: {
        line1: string;
        line2?: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        date?: string;
    }) {
        try {
            const address = {
                line1: params.line1,
                line2: params.line2,
                city: params.city,
                region: params.region,
                postalCode: params.postalCode,
                country: params.country
            };

            const effectiveDate = params.date || new Date().toISOString().split('T')[0];
            const result = await this.client.jurisdictionsByAddress(
                address.line1,
                address.line2,
                address.city,
                address.region,
                address.postalCode,
                address.country,
                effectiveDate
            );

            return {
                address: address,
                effectiveDate: effectiveDate,
                jurisdictions: result.value?.map((jurisdiction: any) => ({
                    jurisdictionId: jurisdiction.jurisdictionId,
                    name: jurisdiction.name,
                    type: jurisdiction.type,
                    rate: jurisdiction.rate,
                    salesRate: jurisdiction.salesRate,
                    useRate: jurisdiction.useRate,
                    country: jurisdiction.country,
                    region: jurisdiction.region,
                    effectiveDate: jurisdiction.effectiveDate,
                    endDate: jurisdiction.endDate
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createCertificateRequest(companyCode?: string, params?: {
        customerCode: string;
        recipientEmail: string;
        requestType: string;
        exposureZones: Array<{ region: string; country: string }>;
        exemptionReason?: string;
    }) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for creating certificate requests. Please specify a companyCode parameter.');
            }

            const model = {
                companyId: finalCompanyCode,
                recipientIds: [params?.customerCode],
                recipient: {
                    email: params?.recipientEmail
                },
                requestType: params?.requestType || 'Blanket',
                exposureZones: params?.exposureZones?.map((zone: any) => ({
                    region: zone.region,
                    country: zone.country
                })) || [],
                exemptionReason: params?.exemptionReason || 'Standard exemption request'
            };

            const result = await this.client.createCertExpressInvitation(finalCompanyCode, [model]);
            const request = result[0];
            return {
                id: request.id,
                companyId: request.companyId,
                coverLetterTitle: request.coverLetterTitle,
                exposureZones: request.exposureZones,
                exemptionReason: request.exemptionReason,
                requestStatus: request.requestStatus,
                requestDate: request.requestDate
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getCertificateSetup(companyCode?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for getting certificate setup. Please specify a companyCode parameter.');
            }

            const result = await this.client.getCertExpressSetup(finalCompanyCode);
            return {
                companyCode: finalCompanyCode,
                isProvisioned: result.isProvisioned,
                isEnabled: result.isEnabled,
                companyName: result.companyName,
                logoUrl: result.logoUrl,
                supportEmailAddress: result.supportEmailAddress,
                availableExposureZones: result.availableExposureZones?.map((zone: any) => ({
                    region: zone.region,
                    country: zone.country,
                    name: zone.name
                })) || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async testConnectivity(testType: string = 'Basic') {
        try {
            const diagnostics: any = {
                testType: testType,
                timestamp: new Date().toISOString(),
                results: []
            };

            // Basic connectivity test
            try {
                const pingResult = await this.client.ping();
                diagnostics.results.push({
                    test: 'API Connectivity',
                    status: 'PASS',
                    authenticated: pingResult.authenticated,
                    version: pingResult.version
                });                } catch (error) {
                    diagnostics.results.push({
                        test: 'API Connectivity',
                        status: 'FAIL',
                        error: (error as any).message
                    });
                }

            if (testType === 'Full' || testType === 'Transaction') {
                // Test company access
                try {
                    const companies = await this.getCompanies();
                    diagnostics.results.push({
                        test: 'Company Access',
                        status: 'PASS',
                        companyCount: companies.count
                    });
                } catch (error) {
                    diagnostics.results.push({
                        test: 'Company Access',
                        status: 'FAIL',
                        error: (error as any).message
                    });
                }
            }

            if (testType === 'Full' || testType === 'Address') {
                // Test address validation
                try {
                    const addressTest = await this.validateAddress({
                        line1: '123 Main St',
                        city: 'Seattle',
                        region: 'WA',
                        postalCode: '98101',
                        country: 'US'
                    });
                    diagnostics.results.push({
                        test: 'Address Validation',
                        status: 'PASS',
                        valid: addressTest.valid
                    });
                } catch (error) {
                    diagnostics.results.push({
                        test: 'Address Validation',
                        status: 'FAIL',
                        error: (error as any).message
                    });
                }
            }

            const passedTests = diagnostics.results.filter((r: any) => r.status === 'PASS').length;
            const totalTests = diagnostics.results.length;

            return {
                ...diagnostics,
                summary: {
                    overall: passedTests === totalTests ? 'PASS' : 'FAIL',
                    passed: passedTests,
                    total: totalTests,
                    environment: this.config.environment
                }
            };
        } catch (error: any) {
            return {
                testType: testType,
                timestamp: new Date().toISOString(),
                summary: {
                    overall: 'FAIL',
                    passed: 0,
                    total: 1,
                    environment: this.config.environment
                },
                results: [{
                    test: 'Connection Test',
                    status: 'FAIL',
                    error: error.message
                }]
            };
        }
    }

    public async getSettings(companyCode?: string) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            
            // Get account settings
            const accountResult = await this.client.getAccount();
            
            let companySettings = null;
            if (finalCompanyCode) {
                try {
                    companySettings = await this.client.getCompany(finalCompanyCode);
                } catch (error) {
                    // Company settings optional if no company code provided
                }
            }

            return {
                account: {
                    id: accountResult.id,
                    name: accountResult.name,
                    effectiveDate: accountResult.effectiveDate,
                    endDate: accountResult.endDate,
                    accountStatusId: accountResult.accountStatusId,
                    subscriptions: accountResult.subscriptions?.map((sub: any) => ({
                        subscriptionTypeId: sub.subscriptionTypeId,
                        subscriptionDescription: sub.subscriptionDescription,
                        effectiveDate: sub.effectiveDate,
                        endDate: sub.endDate
                    })) || []
                },
                company: companySettings ? {
                    id: companySettings.id,
                    companyCode: companySettings.companyCode,
                    name: companySettings.name,
                    isActive: companySettings.isActive,
                    taxProfile: companySettings.taxProfile,
                    defaultCountry: companySettings.defaultCountry
                } : null,
                environment: this.config.environment
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async bulkTaxCalculation(companyCode?: string, transactions?: any[]) {
        try {
            const finalCompanyCode = companyCode || this.config.companyCode;
            if (!finalCompanyCode) {
                throw new Error('Company code is required for bulk tax calculations. Please specify a companyCode parameter.');
            }

            if (!transactions || transactions.length === 0) {
                throw new Error('At least one transaction is required for bulk tax calculations.');
            }

            const results: any[] = [];
            const errors: any[] = [];

            // Process transactions in batches for better performance
            const batchSize = 10;
            for (let i = 0; i < transactions.length; i += batchSize) {
                const batch = transactions.slice(i, i + batchSize);
                const batchPromises = batch.map(async (transaction: any, index: number) => {
                    try {
                        const model = {
                            type: 'SalesOrder',
                            companyCode: finalCompanyCode,
                            code: transaction.code || `BULK-${i + index + 1}`,
                            date: transaction.date,
                            customerCode: transaction.customerCode,
                            lines: transaction.lines.map((line: any, lineIndex: number) => ({
                                number: `${lineIndex + 1}`,
                                quantity: line.quantity || 1,
                                amount: line.amount,
                                description: line.description || `Line ${lineIndex + 1}`
                            })),
                            addresses: {
                                shipFrom: transaction.shipFrom,
                               
                                shipTo: transaction.shipTo
                            },
                            commit: false
                        };

                        const result = await this.client.createTransaction({ model });
                                               return {
                            success: true,
                            transactionCode: transaction.code,
                            result: {
                                id: result.id,
                                code: result.code,
                                totalAmount: result.totalAmount,
                                totalTax: result.totalTax,
                                status: result.status
                            }
                        };
                    } catch (error: any) {
                        return {
                            success: false,
                            transactionCode: transaction.code,
                            error: error.message
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(result => {
                    if (result.success) {
                        results.push(result.result);
                    } else {
                        errors.push({
                            transactionCode: result.transactionCode,
                            error: result.error
                        });
                    }
                });
            }

            return {
                summary: {
                    totalTransactions: transactions.length,
                    successful: results.length,
                    failed: errors.length,
                    totalTax: results.reduce((sum: number, r: any) => sum + (r.totalTax || 0), 0),
                    totalAmount: results.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0)
                },
                results: results,
                errors: errors
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getTaxContent(params?: {
        filter?: string;
        country?: string;
        region?: string;
        taxType?: string;
        effectiveDate?: string;
    }) {
        try {
            const queryParams: any = {};
            
            if (params?.filter) {
                queryParams.$filter = params.filter;
            } else {
                // Build filter from individual parameters
                const filters: any[] = [];
                if (params?.country) filters.push(`country eq '${params.country}'`);
                if (params?.region) filters.push(`region eq '${params.region}'`);
                if (params?.taxType) filters.push(`taxType eq '${params.taxType}'`);
                if (params?.effectiveDate) filters.push(`effectiveDate eq datetime'${params.effectiveDate}'`);
                
                if (filters.length > 0) {
                    queryParams.$filter = filters.join(' and ');
                }
            }

            const result = await this.client.queryTaxAuthorities(queryParams);
            return {
                taxContent: result.value || result,
                count: result['@recordsetCount'] || result.length || 0
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // Phase 10: User & Account Management
    public async listUsers(accountId?: string, params?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
    }) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for listing users. Please specify an accountId parameter.');
            }

            const queryParams: any = {};
            if (params?.filter) queryParams.$filter = params.filter;
            if (params?.include) queryParams.$include = params.include;
            if (params?.top) queryParams.$top = params.top;
            if (params?.skip) queryParams.$skip = params.skip;

            const result = await this.client.listUsersByAccount(finalAccountId, queryParams);
            return {
                accountId: finalAccountId,
                users: result.value?.map((user: any) => ({
                    id: user.id,
                    accountId: user.accountId,
                    userName: user.userName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    isActive: user.isActive,
                    securityRoleId: user.securityRoleId,
                    passwordStatusId: user.passwordStatusId,
                    createdDate: user.createdDate,
                    modifiedDate: user.modifiedDate
                })) || [],
                count: result['@recordsetCount'] || result.value?.length || 0
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async createUser(accountId?: string, params?: {
        userName: string;
        firstName: string;
        lastName: string;
        email: string;
        passwordHash?: string;
        isActive?: boolean;
    }) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for creating users. Please specify an accountId parameter.');
            }

            if (!params) {
                throw new Error('User parameters are required for creating users.');
            }

            const model = {
                userName: params.userName,
                firstName: params.firstName,
                lastName: params.lastName,
                email: params.email,
                passwordHash: params.passwordHash,
                isActive: params.isActive !== false
            };

            const result = await this.client.createUsers(finalAccountId, [model]);
            const user = result[0];
            return {
                id: user.id,
                accountId: user.accountId,
                userName: user.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isActive: user.isActive,
                created: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getUser(accountId?: string, userId?: string, include?: string) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for getting user details. Please specify an accountId parameter.');
            }

            if (!userId) {
                throw new Error('User ID is required for getting user details.');
            }

            const result = await this.client.getUser(finalAccountId, userId, include);
            return {
                id: result.id,
                accountId: result.accountId,
                userName: result.userName,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
                isActive: result.isActive,
                securityRoleId: result.securityRoleId,
                passwordStatusId: result.passwordStatusId,
                createdDate: result.createdDate,
                modifiedDate: result.modifiedDate,
                companyRoles: result.companyRoles,
                subscriptions: result.subscriptions
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateUser(accountId?: string, userId?: string, params?: {
        userName?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        isActive?: boolean;
    }) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for updating users. Please specify an accountId parameter.');
            }

            if (!userId) {
                throw new Error('User ID is required for updating users.');
            }

            const model = {
                userName: params?.userName,
                firstName: params?.firstName,
                lastName: params?.lastName,
                email: params?.email,
                isActive: params?.isActive
            };

            // Remove undefined properties
            Object.keys(model).forEach(key => {
                if (model[key as keyof typeof model] === undefined) {
                    delete model[key as keyof typeof model];
                }
            });

            const result = await this.client.updateUser(finalAccountId, userId, model);
            return {
                id: result.id,
                accountId: result.accountId,
                userName: result.userName,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
                isActive: result.isActive,
                updated: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async deleteUser(accountId?: string, userId?: string) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for deleting users. Please specify an accountId parameter.');
            }

            if (!userId) {
                throw new Error('User ID is required for deleting users.');
            }

            const result = await this.client.deleteUser(finalAccountId, userId);
            return {
                deleted: true,
                userId: userId,
                accountId: finalAccountId
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getAccount(accountId?: string, include?: string) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for getting account details. Please specify an accountId parameter.');
            }

            const result = await this.client.getAccount(finalAccountId, include);
            return {
                id: result.id,
                name: result.name,
                effectiveDate: result.effectiveDate,
                endDate: result.endDate,
                accountStatusId: result.accountStatusId,
                accountTypeId: result.accountTypeId,
                crmid: result.crmid,
                parentAccountId: result.parentAccountId,
                createdDate: result.createdDate,
                modifiedDate: result.modifiedDate,
                users: result.users,
                subscriptions: result.subscriptions,
                companies: result.companies
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async updateAccount(accountId?: string, params?: {
        name?: string;
        effectiveDate?: string;
        endDate?: string;
        accountStatusId?: string;
    }) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for updating account. Please specify an accountId parameter.');
            }

            const model = {
                name: params?.name,
                effectiveDate: params?.effectiveDate,
                endDate: params?.endDate,
                accountStatusId: params?.accountStatusId
            };

            // Remove undefined properties
            Object.keys(model).forEach(key => {
                if (model[key as keyof typeof model] === undefined) {
                    delete model[key as keyof typeof model];
                }
            });

            const result = await this.client.updateAccount(finalAccountId, model);
            return {
                id: result.id,
                name: result.name,
                effectiveDate: result.effectiveDate,
                endDate: result.endDate,
                accountStatusId: result.accountStatusId,
                updated: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async getSubscriptions(accountId?: string, filter?: string) {
        try {
            const finalAccountId = accountId || this.config.accountId;
            if (!finalAccountId) {
                throw new Error('Account ID is required for getting subscriptions. Please specify an accountId parameter.');
            }

            const queryParams: any = {};
            if (filter) queryParams.$filter = filter;

            const result = await this.client.listSubscriptionsByAccount(finalAccountId, queryParams);
            return {
                accountId: finalAccountId,
                subscriptions: result.value?.map((subscription: any) => ({
                    id: subscription.id,
                    accountId: subscription.accountId,
                    subscriptionTypeId: subscription.subscriptionTypeId,
                    subscriptionDescription: subscription.subscriptionDescription,
                    effectiveDate: subscription.effectiveDate,
                    endDate: subscription.endDate,
                    serviceTypeId: subscription.serviceTypeId,
                    serviceVersion: subscription.serviceVersion,
                    isActive: subscription.isActive
                })) || [],
                count: result['@recordsetCount'] || result.value?.length || 0
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }
}

export default AvataxClient;