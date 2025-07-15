import { AvaTaxConfig, StoredCredentials, loadCredentials, saveCredentials } from './config.js';

/**
 * AvaTax API Client
 * 
 * This client provides comprehensive access to the AvaTax REST API with proper handling
 * of company identification patterns. The AvaTax API uses two different ways to identify
 * companies in URLs:
 * 
 * 1. Company Code (string) - Used in endpoints like:
 *    - /companies/{companyCode}/transactions/{transactionCode}
 *    - Transaction operations that use companyCode in the request body
 * 
 * 2. Company ID (numeric) - Used in endpoints like:
 *    - /companies/{companyId}/certificates
 *    - /companies/{companyId}/parameters
 *    - /companies/{companyId}/userdefinedfields
 *    - /companies/{companyId}/batches
 * 
 * This client automatically handles both patterns:
 * - Resolves companyCode to companyId when needed for numeric ID endpoints
 * - Caches company ID lookups to minimize API calls
 * - Handles proper URL encoding for company codes with special characters
 */
class AvataxClient {
    private config: AvaTaxConfig;
    private baseUrl: string;
    private authHeader: string;
    private runtimeCompanyCode?: string;
    private storedCredentials?: StoredCredentials | null;

    constructor(config: AvaTaxConfig) {
        this.config = config;
        this.runtimeCompanyCode = config.companyCode;
        this.storedCredentials = loadCredentials();
        
        // Set base URL based on environment
        this.baseUrl = config.environment === 'production' 
            ? 'https://rest.avatax.com' 
            : 'https://sandbox-rest.avatax.com';
            
        // Create Basic Auth header
        const credentials = Buffer.from(`${config.accountId}:${config.licenseKey}`).toString('base64');
        this.authHeader = `Basic ${credentials}`;
    }

    /**
     * Set the default company code for the current session
     */
    setDefaultCompanyCode(companyCode: string): void {
        this.runtimeCompanyCode = companyCode;
    }

    /**
     * Get the current default company code
     */
    getDefaultCompanyCode(): string | undefined {
        return this.runtimeCompanyCode;
    }

    /**
     * Switch to a different pre-configured account
     */
    switchAccount(accountName: string): void {
        if (!this.storedCredentials?.accounts[accountName]) {
            throw new Error(`Account '${accountName}' not found in stored credentials`);
        }

        const account = this.storedCredentials.accounts[accountName];
        
        // Update configuration
        this.config.accountId = account.accountId;
        this.config.licenseKey = account.licenseKey;
        this.config.environment = account.environment;
        this.runtimeCompanyCode = account.defaultCompanyCode || '';

        // Update base URL and auth header
        this.baseUrl = account.environment === 'production' 
            ? 'https://rest.avatax.com' 
            : 'https://sandbox-rest.avatax.com';
            
        const credentials = Buffer.from(`${account.accountId}:${account.licenseKey}`).toString('base64');
        this.authHeader = `Basic ${credentials}`;

        // Update default account in stored credentials
        this.storedCredentials.defaultAccount = accountName;
        saveCredentials(this.storedCredentials);
    }

    /**
     * Get list of available pre-configured accounts
     */
    getAvailableAccounts(): string[] {
        return this.storedCredentials ? Object.keys(this.storedCredentials.accounts) : [];
    }

    /**
     * Get current account information (without sensitive data)
     */
    getCurrentAccountInfo(): { accountName?: string; accountId: string; environment: string; companyCode?: string } {
        const currentAccountName = this.storedCredentials?.defaultAccount;
        return {
            accountName: currentAccountName,
            accountId: this.config.accountId,
            environment: this.config.environment,
            companyCode: this.runtimeCompanyCode
        };
    }

    /**
     * Set runtime credentials (for session-based credential updates)
     */
    setCredentials(accountId: string, licenseKey: string, environment: 'sandbox' | 'production', companyCode?: string): void {
        this.config.accountId = accountId;
        this.config.licenseKey = licenseKey;
        this.config.environment = environment;
        this.runtimeCompanyCode = companyCode || '';

        // Update base URL and auth header
        this.baseUrl = environment === 'production' 
            ? 'https://rest.avatax.com' 
            : 'https://sandbox-rest.avatax.com';
            
        const credentials = Buffer.from(`${accountId}:${licenseKey}`).toString('base64');
        this.authHeader = `Basic ${credentials}`;
    }

    private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
        const url = `${this.baseUrl}/api/v2${endpoint}`;
        const timeout = this.config.timeout || 30000;

        const headers: Record<string, string> = {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'X-Avalara-Client': `${this.config.appName || 'AvaTax-MCP-Server'};${this.config.appVersion || '1.0.0'};${this.config.machineName || 'MCP-Server'};TypeScript`
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                (error as any).response = { 
                    status: response.status, 
                    data: errorData,
                    headers: Object.fromEntries(response.headers.entries())
                };
                throw error;
            }

            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
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

    /**
     * Resolves company information for API calls
     * Returns both companyCode (for request body) and companyId (for URL paths)
     */
    private async resolveCompanyInfo(requestedCompanyCode?: string): Promise<{ companyCode: string; companyId?: number }> {
        // Use runtime company code instead of config.companyCode
        const companyCode = requestedCompanyCode || this.runtimeCompanyCode;
        
        if (!companyCode || companyCode.trim() === '') {
            throw new Error('Company code is required. Please specify a companyCode parameter or use set_default_company to set a default, or ask the user which company to use. Use the get_companies tool to see available companies.');
        }

        // For endpoints that need companyId in the URL, we need to look it up
        // We'll cache this information to avoid repeated API calls
        return {
            companyCode: companyCode.trim(),
            companyId: undefined // Will be resolved when needed by specific methods
        };
    }

    /**
     * Gets the numeric company ID for a given company code
     * This is needed for API endpoints that use companyId in the URL path
     */
    private async getCompanyId(companyCode: string): Promise<number> {
        try {
            const params = new URLSearchParams();
            params.append('$filter', `companyCode eq '${this.sanitizeString(companyCode)}'`);
            params.append('$top', '1');
            
            const result = await this.makeRequest('GET', `/companies?${params.toString()}`);
            
            if (!result.value || result.value.length === 0) {
                throw new Error(`Company with code '${companyCode}' not found`);
            }
            
            return result.value[0].id;
        } catch (error: any) {
            throw new Error(`Failed to resolve company ID for code '${companyCode}': ${error.message}`);
        }
    }

    /**
     * Company ID vs Company Code Handling
     * 
     * AvaTax API endpoints use two different company identification patterns:
     * 
     * 1. Company Code (string) - Used in:
     *    - Transaction creation (/api/v2/transactions/create) - in request body
     *    - Most transaction operations that use companyCode in URL path
     *    - Example: /companies/{companyCode}/transactions/{transactionCode}
     * 
     * 2. Company ID (numeric) - Used in:
     *    - Company management endpoints
     *    - Certificate operations
     *    - User-defined fields
     *    - Company parameters
     *    - Batch operations
     *    - Example: /companies/{companyId}/certificates
     * 
     * This client handles both patterns automatically by:
     * - Using companyCode directly when the endpoint expects it
     * - Looking up companyId from companyCode when needed for URL-based endpoints
     * - Caching company ID lookups to minimize API calls
     */

    /**
     * Cache for company ID lookups to avoid repeated API calls
     */
    private companyIdCache: Map<string, number> = new Map();

    /**
     * Gets company ID with caching to minimize API calls
     */
    private async getCachedCompanyId(companyCode: string): Promise<number> {
        const cacheKey = companyCode.trim().toLowerCase();
        
        if (this.companyIdCache.has(cacheKey)) {
            return this.companyIdCache.get(cacheKey)!;
        }
        
        const companyId = await this.getCompanyId(companyCode);
        this.companyIdCache.set(cacheKey, companyId);
        return companyId;
    }

    /**
     * Helper method for endpoints that use companyId in the URL path
     * Pattern: /companies/{companyId}/...
     */
    private async makeCompanyIdRequest(method: string, pathAfterCompanyId: string, companyCode: string, data?: any): Promise<any> {
        const companyId = await this.getCachedCompanyId(companyCode);
        const endpoint = `/companies/${companyId}${pathAfterCompanyId}`;
        return this.makeRequest(method, endpoint, data);
    }

    /**
     * Helper method for endpoints that use companyCode in the URL path
     * Pattern: /companies/{companyCode}/...
     */
    private async makeCompanyCodeRequest(method: string, pathAfterCompanyCode: string, companyCode: string, data?: any): Promise<any> {
        // Encode company code for URL safety
        const encodedCompanyCode = this.encodeCompanyCode(companyCode);
        const endpoint = `/companies/${encodedCompanyCode}${pathAfterCompanyCode}`;
        return this.makeRequest(method, endpoint, data);
    }

    /**
     * Encodes company code for use in URL paths
     * Handles special characters as documented in AvaTax API
     */
    private encodeCompanyCode(companyCode: string): string {
        return companyCode
            .replace(/\//g, '_-ava2f-_')
            .replace(/\+/g, '_-ava2b-_')
            .replace(/\?/g, '_-ava3f-_')
            .replace(/%/g, '_-ava25-_')
            .replace(/#/g, '_-ava23-_')
            .replace(/ /g, '%20');
    }

    public async calculateTax(transactionData: any) {
        try {
            // Determine company code - require it for transactions
            // Note: AvaTax uses companyCode (string) not companyId (numeric) for API calls
            const companyCode = transactionData.companyCode || this.config.companyCode;
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for tax calculations. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
            }

            // Prepare the transaction model
            const model = {
                type: transactionData.type || 'SalesInvoice',
                companyCode: companyCode.trim(),
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
            
            const result = await this.makeRequest('POST', '/transactions/create', model);
            return {
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                totalTaxable: result.totalTaxable,
                lines: result.lines,
                taxDate: result.taxDate,
                status: result.status,
                // Include company information from response
                companyId: result.companyId,
                companyCode: model.companyCode
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

            // Use the AvaTax API's address resolution endpoint
            const result = await this.makeRequest('POST', '/addresses/resolve', model);
            
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
            // Note: AvaTax uses companyCode (string) not companyId (numeric) for API calls
            const companyCode = transactionData.companyCode || this.config.companyCode;
            if (!companyCode || companyCode.trim() === '') {
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
            
            const result = await this.makeRequest('POST', '/transactions/create', model);
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
            const result = await this.makeRequest('GET', '/utilities/ping');
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
            const params = new URLSearchParams();
            
            // Add search filter if provided
            if (filter) {
                params.append('$filter', `companyCode contains '${this.sanitizeString(filter)}' or name contains '${this.sanitizeString(filter)}'`);
            }
            
            // Limit results to make the response manageable
            params.append('$top', '50');
            params.append('$orderby', 'companyCode');
            
            const queryString = params.toString();
            const endpoint = queryString ? `/companies?${queryString}` : '/companies';
            const result = await this.makeRequest('GET', endpoint);
            
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

    /**
     * Get a specific company by company code
     * Pattern: /api/v2/companies?$filter=companyCode eq '{companyCode}'
     */
    public async getCompany(companyCode: string, options?: { include?: string }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            const params = new URLSearchParams();
            params.append('$filter', `companyCode eq '${this.sanitizeString(companyCode.trim())}'`);
            if (options?.include) {
                params.append('$include', options.include);
            }
            
            const queryString = params.toString();
            const endpoint = `/companies?${queryString}`;
            const result = await this.makeRequest('GET', endpoint);
            
            if (!result.value || result.value.length === 0) {
                throw new Error(`Company with code '${companyCode}' not found`);
            }
            
            return result.value[0];
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create a new company
     * Pattern: /api/v2/companies
     */
    public async createCompany(companyData: any) {
        try {
            if (!companyData || !companyData.companyCode || !companyData.name) {
                throw new Error('Company data with companyCode and name is required.');
            }

            // Clean up the data - remove undefined values
            const cleanData = { ...companyData };
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key] === undefined) {
                    delete cleanData[key];
                }
            });

            const result = await this.makeRequest('POST', '/companies', cleanData);
            return result;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Update an existing company
     * Pattern: /companies/{companyId}
     */
    public async updateCompany(companyCode: string, companyData: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!companyData) {
                throw new Error('Company data is required for update.');
            }

            // Get the company ID first
            const companyId = await this.getCachedCompanyId(companyCode.trim());
            
            // Clean up the data - remove undefined values
            const cleanData = { ...companyData };
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key] === undefined) {
                    delete cleanData[key];
                }
            });

            return await this.makeRequest('PUT', `/companies/${companyId}`, cleanData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete a company
     * Pattern: /companies/{companyId}
     */
    public async deleteCompany(companyCode: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            // Get the company ID first
            const companyId = await this.getCachedCompanyId(companyCode.trim());
            
            return await this.makeRequest('DELETE', `/companies/${companyId}`);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company configuration settings
     * Pattern: /companies/{companyId}/configuration
     */
    public async getCompanyConfiguration(companyCode: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            return await this.makeCompanyIdRequest('GET', '/configuration', companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Set company configuration settings
     * Pattern: /companies/{companyId}/configuration
     */
    public async setCompanyConfiguration(companyCode: string, settings: any[]) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!settings || !Array.isArray(settings)) {
                throw new Error('Settings array is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/configuration', companyCode.trim(), settings);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Initialize a company with default settings
     * Pattern: /companies/{companyId}/initialize
     */
    public async initializeCompany(companyCode: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/initialize', companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company filing status
     * Pattern: /companies/{companyId}/filings/status
     */
    public async getCompanyFilingStatus(companyCode: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            return await this.makeCompanyIdRequest('GET', '/filings/status', companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Approve company filing
     * Pattern: /companies/{companyId}/filings/{year}/{month}/approve
     */
    public async approveCompanyFiling(companyCode: string, year: number, month: number, model?: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!year || !month) {
                throw new Error('Year and month are required.');
            }

            return await this.makeCompanyIdRequest('POST', `/filings/${year}/${month}/approve`, companyCode.trim(), model || { approved: true });
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company parameters
     * Pattern: /companies/{companyId}/parameters
     */
    public async getCompanyParameters(companyCode: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            return await this.makeCompanyIdRequest('GET', '/parameters', companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Set company parameters
     * Pattern: /companies/{companyId}/parameters
     */
    public async setCompanyParameters(companyCode: string, parameters: any[]) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!parameters || !Array.isArray(parameters)) {
                throw new Error('Parameters array is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/parameters', companyCode.trim(), parameters);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company certificates
     * Pattern: /companies/{companyId}/certificates
     */
    public async getCompanyCertificates(companyCode: string, options?: { 
        include?: string; 
        filter?: string; 
        top?: number; 
        skip?: number; 
        orderBy?: string; 
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            const params = new URLSearchParams();
            if (options?.include) params.append('$include', options.include);
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/certificates?${queryString}` : '/certificates';
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Fund company account
     * Pattern: /companies/{companyId}/funding/setup
     */
    public async fundCompanyAccount(companyCode: string, fundingRequest: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!fundingRequest || !fundingRequest.amount) {
                throw new Error('Funding request with amount is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/funding/setup', companyCode.trim(), fundingRequest);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company returns
     * Pattern: /companies/{companyId}/returns
     */
    public async getCompanyReturns(companyCode: string, options?: { 
        filingFrequency?: string;
        country?: string;
        region?: string;
        year?: number;
        month?: number;
        include?: string;
        top?: number;
        skip?: number;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            const params = new URLSearchParams();
            if (options?.filingFrequency) params.append('filingFrequency', options.filingFrequency);
            if (options?.country) params.append('country', options.country);
            if (options?.region) params.append('region', options.region);
            if (options?.year) params.append('year', options.year.toString());
            if (options?.month) params.append('month', options.month.toString());
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/returns?${queryString}` : '/returns';
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create company return
     * Pattern: /companies/{companyId}/returns
     */
    public async createCompanyReturn(companyCode: string, returnObject: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!returnObject) {
                throw new Error('Return object is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/returns', companyCode.trim(), returnObject);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Approve company return
     * Pattern: /companies/{companyId}/returns/{country}/{region}/{year}/{month}/{filingFrequency}/approve
     */
    public async approveCompanyReturn(companyCode: string, year: number, month: number, country: string, region: string, filingFrequency: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!year || !month || !country || !region || !filingFrequency) {
                throw new Error('Year, month, country, region, and filing frequency are required.');
            }

            return await this.makeCompanyIdRequest('POST', `/returns/${country}/${region}/${year}/${month}/${filingFrequency}/approve`, companyCode.trim(), { approved: true });
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company notices
     * Pattern: /companies/{companyId}/notices
     */
    public async getCompanyNotices(companyCode: string, options?: { 
        include?: string; 
        filter?: string; 
        top?: number; 
        skip?: number; 
        orderBy?: string; 
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            const params = new URLSearchParams();
            if (options?.include) params.append('$include', options.include);
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/notices?${queryString}` : '/notices';
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create company notice
     * Pattern: /companies/{companyId}/notices
     */
    public async createCompanyNotice(companyCode: string, notice: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!notice || !notice.noticeNumber || !notice.noticeDate) {
                throw new Error('Notice object with noticeNumber and noticeDate is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/notices', companyCode.trim(), notice);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Quick setup company
     * Pattern: /companies/{companyId}/quicksetup
     */
    public async quickSetupCompany(companyCode: string, setupRequest: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!setupRequest) {
                throw new Error('Setup request is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/quicksetup', companyCode.trim(), setupRequest);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get company worksheets
     * Pattern: /companies/{companyId}/worksheets
     */
    public async getCompanyWorksheets(companyCode: string, options?: { 
        year?: number;
        month?: number;
        country?: string;
        region?: string;
        include?: string;
        top?: number;
        skip?: number;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }

            const params = new URLSearchParams();
            if (options?.year) params.append('year', options.year.toString());
            if (options?.month) params.append('month', options.month.toString());
            if (options?.country) params.append('country', options.country);
            if (options?.region) params.append('region', options.region);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/worksheets?${queryString}` : '/worksheets';
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Rebuild company worksheets
     * Pattern: /companies/{companyId}/worksheets/rebuild
     */
    public async rebuildCompanyWorksheets(companyCode: string, rebuildRequest: any) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required.');
            }
            if (!rebuildRequest || !rebuildRequest.year || !rebuildRequest.month) {
                throw new Error('Rebuild request with year and month is required.');
            }

            return await this.makeCompanyIdRequest('POST', '/worksheets/rebuild', companyCode.trim(), rebuildRequest);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get certificates for a company - Example of companyId URL pattern
     * Pattern: /companies/{companyId}/certificates
     */
    public async getCertificates(companyCode?: string, options?: { customerCode?: string; filter?: string }) {
        try {
            const resolvedCompanyCode = companyCode || this.config.companyCode;
            if (!resolvedCompanyCode || resolvedCompanyCode.trim() === '') {
                throw new Error('Company code is required. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
            }

            const params = new URLSearchParams();
            if (options?.customerCode) {
                params.append('$filter', `customers/any(c: c/customerCode eq '${this.sanitizeString(options.customerCode)}')`);
            } else if (options?.filter) {
                params.append('$filter', this.sanitizeString(options.filter));
            }
            params.append('$top', '50');
            params.append('$orderby', 'createdDate desc');

            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/certificates?${queryString}` : '/certificates';
            
            const result = await this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode.trim());
            
            return {
                certificates: result.value || [],
                count: result['@recordsetCount'] || result.value?.length || 0
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get transaction by company code and transaction code - Example of companyCode URL pattern  
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}
     */
    public async getTransaction(companyCode: string, transactionCode: string, options?: { documentType?: string; include?: string }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for retrieving transactions.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) {
                params.append('documentType', options.documentType);
            }
            if (options?.include) {
                params.append('$include', options.include);
            }

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim()); // Use same encoding for transaction codes
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}?${queryString}` 
                : `/transactions/${encodedTransactionCode}`;
            
            const result = await this.makeCompanyCodeRequest('GET', pathAfterCompanyCode, companyCode.trim());
            
            return {
                id: result.id,
                code: result.code,
                companyId: result.companyId,
                companyCode: result.companyCode,
                date: result.date,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                status: result.status,
                lines: result.lines || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // ===== NEXUS MANAGEMENT METHODS =====

    /**
     * Get all nexus declarations for a company - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus
     */
    public async getCompanyNexus(companyCode?: string, options?: { 
        filter?: string; 
        include?: string; 
        top?: number; 
        skip?: number; 
        orderBy?: string; 
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/nexus?${queryString}` : '/nexus';
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get a specific nexus declaration by ID - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/{id}
     */
    public async getNexusById(id: number, companyCode?: string, options?: { include?: string }) {
        try {
            if (!id || id <= 0) {
                throw new Error('Valid nexus ID is required.');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            const params = new URLSearchParams();
            if (options?.include) params.append('$include', options.include);
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/nexus/${id}?${queryString}` : `/nexus/${id}`;
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create a new nexus declaration - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus
     */
    public async createNexus(nexusData: any, companyCode?: string) {
        try {
            if (!nexusData || !nexusData.country) {
                throw new Error('Nexus data with country is required.');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            // Ensure we send an array of nexus declarations as AvaTax expects
            const nexusArray = Array.isArray(nexusData) ? nexusData : [nexusData];
            
            return await this.makeCompanyIdRequest('POST', '/nexus', resolvedCompanyCode, nexusArray);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Update an existing nexus declaration - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/{id}
     * 
     * Note: When updating nexus, all values except user-selectable fields must match 
     * an Avalara-defined system nexus object. User-selectable fields are:
     * companyId, effectiveDate, endDate, localNexusTypeId, taxId, nexusTypeId, 
     * hasPermanentEstablishment, and isSellerImporterOfRecord.
     */
    public async updateNexus(id: number, nexusData: any, companyCode?: string) {
        try {
            if (!id || id <= 0) {
                throw new Error('Valid nexus ID is required.');
            }
            if (!nexusData) {
                throw new Error('Nexus data is required for update.');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            // For updates, we need to include the ID in the nexus data
            const updateData = {
                ...nexusData,
                id: id
            };
            
            return await this.makeCompanyIdRequest('PUT', `/nexus/${id}`, resolvedCompanyCode, updateData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Helper method to safely update nexus by first retrieving existing data
     * and only modifying user-selectable fields
     */
    public async updateNexusSafely(id: number, userSelectableFields: any, companyCode?: string) {
        try {
            if (!id || id <= 0) {
                throw new Error('Valid nexus ID is required.');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            // First get the existing nexus declaration
            const existingNexus = await this.getNexusById(id, resolvedCompanyCode);
            
            if (!existingNexus) {
                throw new Error(`Nexus with ID ${id} not found.`);
            }

            // Create update data by merging existing data with only user-selectable fields
            const userSelectableFieldNames = [
                'effectiveDate', 'endDate', 'taxId', 'nexusTypeId', 
                'hasLocalNexus', 'streamlinedSalesTax', 'hasPermanentEstablishment', 
                'isSellerImporterOfRecord', 'localNexusTypeId'
            ];

            const updateData = { ...existingNexus };
            
            // Only update user-selectable fields that were provided
            for (const field of userSelectableFieldNames) {
                if (userSelectableFields[field] !== undefined) {
                    updateData[field] = userSelectableFields[field];
                }
            }

            // Ensure ID is included
            updateData.id = id;
            
            return await this.makeCompanyIdRequest('PUT', `/nexus/${id}`, resolvedCompanyCode, updateData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete a nexus declaration - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/{id}
     */
    public async deleteNexus(id: number, companyCode?: string) {
        try {
            if (!id || id <= 0) {
                throw new Error('Valid nexus ID is required.');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            return await this.makeCompanyIdRequest('DELETE', `/nexus/${id}`, resolvedCompanyCode);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get nexus declarations by form code - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/byform/{formCode}
     */
    public async getNexusByFormCode(formCode: string, companyCode?: string, options?: { 
        include?: string; 
        filter?: string; 
        top?: number; 
        skip?: number; 
        orderBy?: string; 
    }) {
        try {
            if (!formCode || formCode.trim() === '') {
                throw new Error('Form code is required.');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            const params = new URLSearchParams();
            if (options?.include) params.append('$include', options.include);
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);
            
            const queryString = params.toString();
            const encodedFormCode = encodeURIComponent(formCode.trim());
            const pathAfterCompanyId = queryString 
                ? `/nexus/byform/${encodedFormCode}?${queryString}` 
                : `/nexus/byform/${encodedFormCode}`;
            
            return await this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Declare nexus by address - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/byaddress
     */
    public async declareNexusByAddress(addressData: any, companyCode?: string, options?: { 
        textCase?: string; 
        effectiveDate?: string; 
    }) {
        try {
            if (!addressData || !addressData.line1 || !addressData.city || !addressData.region || !addressData.country || !addressData.postalCode) {
                throw new Error('Complete address information is required (line1, city, region, country, postalCode).');
            }

            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            const params = new URLSearchParams();
            if (options?.textCase) params.append('textCase', options.textCase);
            if (options?.effectiveDate) params.append('effectiveDate', options.effectiveDate);
            
            const queryString = params.toString();
            const pathAfterCompanyId = queryString ? `/nexus/byaddress?${queryString}` : '/nexus/byaddress';
            
            return await this.makeCompanyIdRequest('POST', pathAfterCompanyId, resolvedCompanyCode, addressData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // ===== TRANSACTION MANAGEMENT METHODS =====

    /**
     * List transactions for a company with filtering
     * Pattern: /companies/{companyCode}/transactions
     */
    public async listTransactions(companyCode?: string, options?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            
            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);
            
            const queryString = params.toString();
            const pathAfterCompanyCode = queryString ? `/transactions?${queryString}` : '/transactions';
            
            const result = await this.makeCompanyCodeRequest('GET', pathAfterCompanyCode, resolvedCompanyCode);
            
            return {
                count: result.count || 0,
                value: result.value || [],
                '@recordsetCount': result['@recordsetCount']
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Commit a transaction to make it available for tax reporting
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/commit
     */
    public async commitTransaction(companyCode: string, transactionCode: string, options?: {
        documentType?: string;
        include?: string;
        commit?: boolean;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for committing transactions.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) params.append('documentType', options.documentType);
            if (options?.include) params.append('$include', options.include);

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}/commit?${queryString}` 
                : `/transactions/${encodedTransactionCode}/commit`;
            
            const commitModel = {
                commit: options?.commit !== false // Default to true
            };
            
            const result = await this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), commitModel);
            
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                committed: result.status === 'Committed'
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Void a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/void
     */
    public async voidTransaction(companyCode: string, transactionCode: string, options?: {
        documentType?: string;
        include?: string;
        code?: string;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for voiding transactions.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) params.append('documentType', options.documentType);
            if (options?.include) params.append('$include', options.include);

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}/void?${queryString}` 
                : `/transactions/${encodedTransactionCode}/void`;
            
            const voidModel = {
                code: options?.code || 'DocVoided'
            };
            
            const result = await this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), voidModel);
            
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                voided: result.status === 'DocVoided'
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Adjust a committed transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/adjust
     */
    public async adjustTransaction(companyCode: string, transactionCode: string, newTransaction: any, options?: {
        documentType?: string;
        include?: string;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for adjusting transactions.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) params.append('documentType', options.documentType);
            if (options?.include) params.append('$include', options.include);

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}/adjust?${queryString}` 
                : `/transactions/${encodedTransactionCode}/adjust`;
            
            // Prepare adjustment model - similar to createTransaction but for adjustment
            const adjustModel = {
                ...newTransaction,
                companyCode: companyCode.trim(),
                lines: newTransaction.lines?.map((line: any, index: number) => ({
                    number: line.number || `${index + 1}`,
                    quantity: line.quantity || 1,
                    amount: line.amount,
                    itemCode: line.itemCode,
                    description: line.description,
                    taxCode: line.taxCode || 'P0000000'
                }))
            };
            
            const result = await this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), adjustModel);
            
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                adjusted: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Uncommit a committed transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/uncommit
     */
    public async uncommitTransaction(companyCode: string, transactionCode: string, options?: {
        documentType?: string;
        include?: string;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for uncommitting transactions.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) params.append('documentType', options.documentType);
            if (options?.include) params.append('$include', options.include);

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}/uncommit?${queryString}` 
                : `/transactions/${encodedTransactionCode}/uncommit`;
            
            const result = await this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), {});
            
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                totalAmount: result.totalAmount,
                totalTax: result.totalTax,
                uncommitted: result.status === 'Saved'
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get audit information for a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/audit
     */
    public async getTransactionAudit(companyCode: string, transactionCode: string) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for transaction audit.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = `/transactions/${encodedTransactionCode}/audit`;
            
            const result = await this.makeCompanyCodeRequest('GET', pathAfterCompanyCode, companyCode.trim());
            
            return {
                companyId: result.companyId,
                serverTimestamp: result.serverTimestamp,
                serverDuration: result.serverDuration,
                apiCallStatus: result.apiCallStatus,
                originalApiRequestUrl: result.originalApiRequestUrl,
                reconstructedApiRequestBody: result.reconstructedApiRequestBody
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Change the code of a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/changecode
     */
    public async changeTransactionCode(companyCode: string, transactionCode: string, newCode: string, options?: {
        documentType?: string;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for changing transaction code.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Current transaction code is required.');
            }
            if (!newCode || newCode.trim() === '') {
                throw new Error('New transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) params.append('documentType', options.documentType);

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}/changecode?${queryString}` 
                : `/transactions/${encodedTransactionCode}/changecode`;
            
            const changeCodeModel = {
                newCode: newCode.trim()
            };
            
            const result = await this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), changeCodeModel);
            
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                codeChanged: true
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Verify a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/verify
     */
    public async verifyTransaction(companyCode: string, transactionCode: string, options?: {
        documentType?: string;
    }) {
        try {
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required for verifying transactions.');
            }
            if (!transactionCode || transactionCode.trim() === '') {
                throw new Error('Transaction code is required.');
            }

            const params = new URLSearchParams();
            if (options?.documentType) params.append('documentType', options.documentType);

            const queryString = params.toString();
            const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
            const pathAfterCompanyCode = queryString 
                ? `/transactions/${encodedTransactionCode}/verify?${queryString}` 
                : `/transactions/${encodedTransactionCode}/verify`;
            
            const result = await this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), {});
            
            return {
                id: result.id,
                code: result.code,
                status: result.status,
                verified: true,
                messages: result.messages || []
            };
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Item Management Methods
     * 
     * Items are product catalog entries that simplify tax calculations by pre-configuring
     * tax codes, parameters, and descriptions. Use items to:
     * - Separate tax configuration from transaction creation
     * - Centralize product tax settings
     * - Simplify CreateTransaction calls with itemCode references
     * - Enable tax compliance teams to manage product tax behavior independently
     */

    /**
     * Retrieve items for a company
     */
    public async getCompanyItems(companyCode?: string, options?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
        tagName?: string;
        itemStatus?: string;
        taxCodeRecommendationStatus?: string;
        hsCodeClassificationStatus?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);
            if (options?.tagName) params.append('tagName', options.tagName);
            if (options?.itemStatus) params.append('itemStatus', options.itemStatus);
            if (options?.taxCodeRecommendationStatus) params.append('taxCodeRecommendationStatus', options.taxCodeRecommendationStatus);
            if (options?.hsCodeClassificationStatus) params.append('hsCodeClassificationStatus', options.hsCodeClassificationStatus);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items?${queryString}`
                : `/companies/${companyId}/items`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Retrieve a specific item by ID
     */
    public async getCompanyItem(itemId: number, companyCode?: string, options?: {
        include?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.include) params.append('$include', options.include);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items/${itemId}?${queryString}`
                : `/companies/${companyId}/items/${itemId}`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create new items in a company's product catalog
     */
    public async createCompanyItems(items: any[], companyCode?: string, options?: {
        processRecommendationsSynchronously?: boolean;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.processRecommendationsSynchronously !== undefined) {
                params.append('processRecommendationsSynchronously', options.processRecommendationsSynchronously.toString());
            }

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items?${queryString}`
                : `/companies/${companyId}/items`;

            return await this.makeRequest('POST', endpoint, items);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Update an existing item
     */
    public async updateCompanyItem(itemId: number, itemData: any, companyCode?: string, options?: {
        processRecommendationsSynchronously?: boolean;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.processRecommendationsSynchronously !== undefined) {
                params.append('processRecommendationsSynchronously', options.processRecommendationsSynchronously.toString());
            }

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items/${itemId}?${queryString}`
                : `/companies/${companyId}/items/${itemId}`;

            return await this.makeRequest('PUT', endpoint, itemData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete an item from a company's product catalog
     */
    public async deleteCompanyItem(itemId: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}`;
            return await this.makeRequest('DELETE', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Item Parameters Management
     * Parameters store additional attributes like UPC codes, product summaries, 
     * dimensions, or custom fields that can affect tax calculations.
     */

    /**
     * Get parameters for a specific item
     */
    public async getItemParameters(itemId: number, companyCode?: string, options?: {
        filter?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items/${itemId}/parameters?${queryString}`
                : `/companies/${companyId}/items/${itemId}/parameters`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create parameters for an item
     */
    public async createItemParameters(itemId: number, parameters: any[], companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/parameters`;
            return await this.makeRequest('POST', endpoint, parameters);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Update a specific item parameter
     */
    public async updateItemParameter(itemId: number, parameterId: number, parameterData: any, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/parameters/${parameterId}`;
            return await this.makeRequest('PUT', endpoint, parameterData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete a specific item parameter
     */
    public async deleteItemParameter(itemId: number, parameterId: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/parameters/${parameterId}`;
            return await this.makeRequest('DELETE', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Item Classifications Management
     * Classifications include HS codes, NAICS codes, and other product classification 
     * systems used for trade and tax compliance.
     */

    /**
     * Get classifications for a specific item
     */
    public async getItemClassifications(itemId: number, companyCode?: string, options?: {
        filter?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items/${itemId}/classifications?${queryString}`
                : `/companies/${companyId}/items/${itemId}/classifications`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create classifications for an item
     */
    public async createItemClassifications(itemId: number, classifications: any[], companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/classifications`;
            return await this.makeRequest('POST', endpoint, classifications);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Update a specific item classification
     */
    public async updateItemClassification(itemId: number, classificationId: number, classificationData: any, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/classifications/${classificationId}`;
            return await this.makeRequest('PUT', endpoint, classificationData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete a specific item classification
     */
    public async deleteItemClassification(itemId: number, classificationId: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/classifications/${classificationId}`;
            return await this.makeRequest('DELETE', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Item Tags Management
     * Tags are labels that help organize and categorize items for easier management.
     */

    /**
     * Get tags for a specific item
     */
    public async getItemTags(itemId: number, companyCode?: string, options?: {
        filter?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items/${itemId}/tags?${queryString}`
                : `/companies/${companyId}/items/${itemId}/tags`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create tags for an item
     */
    public async createItemTags(itemId: number, tags: any[], companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/tags`;
            return await this.makeRequest('POST', endpoint, tags);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete a specific tag from an item
     */
    public async deleteItemTag(itemId: number, tagId: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/tags/${tagId}`;
            return await this.makeRequest('DELETE', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Query items by tag
     */
    public async queryItemsByTag(tag: string, companyCode?: string, options?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/items/bytags/${tag}?${queryString}`
                : `/companies/${companyId}/items/bytags/${tag}`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Bulk upload items
     */
    public async bulkUploadItems(items: { items: any[] }, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/upload`;
            return await this.makeRequest('POST', endpoint, items);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get tax code recommendations for an item
     */
    public async getItemTaxCodeRecommendations(itemId: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/items/${itemId}/taxcoderecommendations`;
            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    // ======= Tax Code Management Methods =======

    /**
     * Get the full list of Avalara-supported system tax codes
     */
    public async getSystemTaxCodes(options?: {
        filter?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/definitions/taxcodes?${queryString}`
                : `/definitions/taxcodes`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Get the full list of Avalara-supported tax code types
     */
    public async getTaxCodeTypes(options?: {
        top?: number;
        skip?: number;
    }) {
        try {
            const params = new URLSearchParams();
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/definitions/taxcodetypes?${queryString}`
                : `/definitions/taxcodetypes`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Retrieve tax codes for a specific company
     */
    public async getCompanyTaxCodes(companyCode?: string, options?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/companies/${companyId}/taxcodes?${queryString}`
                : `/companies/${companyId}/taxcodes`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Retrieve a single tax code by ID
     */
    public async getTaxCode(id: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/taxcodes/${id}`;
            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Create one or more tax codes for a company
     */
    public async createTaxCodes(taxCodes: any[], companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/taxcodes`;
            return await this.makeRequest('POST', endpoint, taxCodes);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Update a single tax code
     */
    public async updateTaxCode(id: number, taxCodeData: any, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/taxcodes/${id}`;
            return await this.makeRequest('PUT', endpoint, taxCodeData);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Delete a single tax code
     */
    public async deleteTaxCode(id: number, companyCode?: string) {
        try {
            const { companyCode: resolvedCompanyCode } = await this.resolveCompanyInfo(companyCode);
            const companyId = await this.getCompanyId(resolvedCompanyCode);

            const endpoint = `/companies/${companyId}/taxcodes/${id}`;
            return await this.makeRequest('DELETE', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    /**
     * Query tax codes across all companies
     */
    public async queryAllTaxCodes(options?: {
        filter?: string;
        include?: string;
        top?: number;
        skip?: number;
        orderBy?: string;
    }) {
        try {
            const params = new URLSearchParams();
            if (options?.filter) params.append('$filter', options.filter);
            if (options?.include) params.append('$include', options.include);
            if (options?.top) params.append('$top', options.top.toString());
            if (options?.skip) params.append('$skip', options.skip.toString());
            if (options?.orderBy) params.append('$orderBy', options.orderBy);

            const queryString = params.toString();
            const endpoint = queryString 
                ? `/taxcodes?${queryString}`
                : `/taxcodes`;

            return await this.makeRequest('GET', endpoint);
        } catch (error: any) {
            this.handleError(error);
        }
    }
}

export default AvataxClient;
