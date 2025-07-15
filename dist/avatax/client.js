"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
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
    constructor(config) {
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
        this.companyIdCache = new Map();
        this.config = config;
        this.runtimeCompanyCode = config.companyCode;
        this.storedCredentials = (0, config_js_1.loadCredentials)();
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
    setDefaultCompanyCode(companyCode) {
        this.runtimeCompanyCode = companyCode;
    }
    /**
     * Get the current default company code
     */
    getDefaultCompanyCode() {
        return this.runtimeCompanyCode;
    }
    /**
     * Switch to a different pre-configured account
     */
    switchAccount(accountName) {
        var _a;
        if (!((_a = this.storedCredentials) === null || _a === void 0 ? void 0 : _a.accounts[accountName])) {
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
        (0, config_js_1.saveCredentials)(this.storedCredentials);
    }
    /**
     * Get list of available pre-configured accounts
     */
    getAvailableAccounts() {
        return this.storedCredentials ? Object.keys(this.storedCredentials.accounts) : [];
    }
    /**
     * Get current account information (without sensitive data)
     */
    getCurrentAccountInfo() {
        var _a;
        const currentAccountName = (_a = this.storedCredentials) === null || _a === void 0 ? void 0 : _a.defaultAccount;
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
    setCredentials(accountId, licenseKey, environment, companyCode) {
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
    makeRequest(method, endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.baseUrl}/api/v2${endpoint}`;
            const timeout = this.config.timeout || 30000;
            const headers = {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json',
                'X-Avalara-Client': `${this.config.appName || 'AvaTax-MCP-Server'};${this.config.appVersion || '1.0.0'};${this.config.machineName || 'MCP-Server'};TypeScript`
            };
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = yield fetch(url, {
                    method,
                    headers,
                    body: data ? JSON.stringify(data) : undefined,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    const errorData = yield response.json().catch(() => ({}));
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.response = {
                        status: response.status,
                        data: errorData,
                        headers: Object.fromEntries(response.headers.entries())
                    };
                    throw error;
                }
                return yield response.json();
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${timeout}ms`);
                }
                throw error;
            }
        });
    }
    handleError(error) {
        var _a, _b, _c, _d, _e;
        let errorMessage = `AvaTax API Error: ${error.message || 'Unknown error'}`;
        // The Avatax SDK error structure is different
        if ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) {
            const errorData = error.response.data;
            // Check for the standard AvaTax error response format
            if (errorData.error) {
                const err = errorData.error;
                errorMessage = `AvaTax Error [${err.code || 'Unknown'}]: ${err.message || 'Unknown error'}`;
                // Include detailed error information if available
                if (err.details && Array.isArray(err.details)) {
                    const details = err.details.map((d) => `  - ${d.message || d.description} ${d.code ? `(${d.code})` : ''}`).join('\n');
                    errorMessage += '\nDetails:\n' + details;
                }
            }
            else if (errorData.message) {
                // Sometimes the error is directly in the data
                errorMessage = `AvaTax Error: ${errorData.message}`;
            }
        }
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 429) {
            const retryAfter = (_c = error.response.headers) === null || _c === void 0 ? void 0 : _c['retry-after'];
            errorMessage = `AvaTax API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`;
        }
        else if (((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) === 401) {
            errorMessage = 'AvaTax Authentication failed. Please check your Account ID and License Key.';
        }
        else if (((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) === 403) {
            errorMessage = 'AvaTax Authorization failed. Your account may not have access to this feature.';
        }
        throw new Error(errorMessage);
    }
    validateTransactionData(data) {
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
        if (data.customerCode)
            data.customerCode = this.sanitizeString(data.customerCode);
        data.lines.forEach((line) => {
            if (line.description)
                line.description = this.sanitizeString(line.description);
            if (line.itemCode)
                line.itemCode = this.sanitizeString(line.itemCode);
        });
    }
    sanitizeString(input) {
        return input.replace(/[<>'"]/g, '');
    }
    /**
     * Resolves company information for API calls
     * Returns both companyCode (for request body) and companyId (for URL paths)
     */
    resolveCompanyInfo(requestedCompanyCode) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Gets the numeric company ID for a given company code
     * This is needed for API endpoints that use companyId in the URL path
     */
    getCompanyId(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams();
                params.append('$filter', `companyCode eq '${this.sanitizeString(companyCode)}'`);
                params.append('$top', '1');
                const result = yield this.makeRequest('GET', `/companies?${params.toString()}`);
                if (!result.value || result.value.length === 0) {
                    throw new Error(`Company with code '${companyCode}' not found`);
                }
                return result.value[0].id;
            }
            catch (error) {
                throw new Error(`Failed to resolve company ID for code '${companyCode}': ${error.message}`);
            }
        });
    }
    /**
     * Gets company ID with caching to minimize API calls
     */
    getCachedCompanyId(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = companyCode.trim().toLowerCase();
            if (this.companyIdCache.has(cacheKey)) {
                return this.companyIdCache.get(cacheKey);
            }
            const companyId = yield this.getCompanyId(companyCode);
            this.companyIdCache.set(cacheKey, companyId);
            return companyId;
        });
    }
    /**
     * Helper method for endpoints that use companyId in the URL path
     * Pattern: /companies/{companyId}/...
     */
    makeCompanyIdRequest(method, pathAfterCompanyId, companyCode, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const companyId = yield this.getCachedCompanyId(companyCode);
            const endpoint = `/companies/${companyId}${pathAfterCompanyId}`;
            return this.makeRequest(method, endpoint, data);
        });
    }
    /**
     * Helper method for endpoints that use companyCode in the URL path
     * Pattern: /companies/{companyCode}/...
     */
    makeCompanyCodeRequest(method, pathAfterCompanyCode, companyCode, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Encode company code for URL safety
            const encodedCompanyCode = this.encodeCompanyCode(companyCode);
            const endpoint = `/companies/${encodedCompanyCode}${pathAfterCompanyCode}`;
            return this.makeRequest(method, endpoint, data);
        });
    }
    /**
     * Encodes company code for use in URL paths
     * Handles special characters as documented in AvaTax API
     */
    encodeCompanyCode(companyCode) {
        return companyCode
            .replace(/\//g, '_-ava2f-_')
            .replace(/\+/g, '_-ava2b-_')
            .replace(/\?/g, '_-ava3f-_')
            .replace(/%/g, '_-ava25-_')
            .replace(/#/g, '_-ava23-_')
            .replace(/ /g, '%20');
    }
    calculateTax(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                    lines: transactionData.lines.map((line, index) => ({
                        number: line.number || `${index + 1}`,
                        quantity: line.quantity || 1,
                        amount: line.amount,
                        itemCode: line.itemCode,
                        description: line.description,
                        taxCode: line.taxCode || 'P0000000'
                    })),
                    // Addresses should be at the transaction level, not line level
                    addresses: {
                        shipFrom: ((_b = (_a = transactionData.lines[0]) === null || _a === void 0 ? void 0 : _a.addresses) === null || _b === void 0 ? void 0 : _b.shipFrom) || transactionData.shipFrom,
                        shipTo: ((_d = (_c = transactionData.lines[0]) === null || _c === void 0 ? void 0 : _c.addresses) === null || _d === void 0 ? void 0 : _d.shipTo) || transactionData.shipTo
                    },
                    commit: false
                };
                // Validate before sending
                this.validateTransactionData(model);
                const result = yield this.makeRequest('POST', '/transactions/create', model);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    validateAddress(addressData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.makeRequest('POST', '/addresses/resolve', model);
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
                    messages: (result === null || result === void 0 ? void 0 : result.messages) || [],
                    errors: (result === null || result === void 0 ? void 0 : result.errors) || ['Address could not be validated']
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                    lines: transactionData.lines.map((line, index) => ({
                        number: line.number || `${index + 1}`,
                        quantity: line.quantity || 1,
                        amount: line.amount,
                        itemCode: line.itemCode,
                        description: line.description,
                        taxCode: line.taxCode || 'P0000000'
                    })),
                    // Addresses should be at the transaction level
                    addresses: {
                        shipFrom: ((_b = (_a = transactionData.lines[0]) === null || _a === void 0 ? void 0 : _a.addresses) === null || _b === void 0 ? void 0 : _b.shipFrom) || transactionData.shipFrom,
                        shipTo: ((_d = (_c = transactionData.lines[0]) === null || _c === void 0 ? void 0 : _c.addresses) === null || _d === void 0 ? void 0 : _d.shipTo) || transactionData.shipTo
                    },
                    commit: transactionData.commit !== false // Default to true for createTransaction
                };
                // Validate before sending
                this.validateTransactionData(model);
                const result = yield this.makeRequest('POST', '/transactions/create', model);
                return {
                    id: result.id,
                    code: result.code,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    status: result.status,
                    committed: result.status === 'Committed'
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.makeRequest('GET', '/utilities/ping');
                return {
                    authenticated: result.authenticated,
                    version: result.version,
                    environment: this.config.environment
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getCompanies(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
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
                const result = yield this.makeRequest('GET', endpoint);
                // Return simplified company information
                return {
                    companies: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((company) => ({
                        id: company.id,
                        companyCode: company.companyCode,
                        name: company.name,
                        isActive: company.isActive,
                        isDefault: company.isDefault,
                        defaultCountry: company.defaultCountry
                    }))) || [],
                    count: result['@recordsetCount'] || ((_b = result.value) === null || _b === void 0 ? void 0 : _b.length) || 0
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get a specific company by company code
     * Pattern: /api/v2/companies?$filter=companyCode eq '{companyCode}'
     */
    getCompany(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                const params = new URLSearchParams();
                params.append('$filter', `companyCode eq '${this.sanitizeString(companyCode.trim())}'`);
                if (options === null || options === void 0 ? void 0 : options.include) {
                    params.append('$include', options.include);
                }
                const queryString = params.toString();
                const endpoint = `/companies?${queryString}`;
                const result = yield this.makeRequest('GET', endpoint);
                if (!result.value || result.value.length === 0) {
                    throw new Error(`Company with code '${companyCode}' not found`);
                }
                return result.value[0];
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create a new company
     * Pattern: /api/v2/companies
     */
    createCompany(companyData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyData || !companyData.companyCode || !companyData.name) {
                    throw new Error('Company data with companyCode and name is required.');
                }
                // Clean up the data - remove undefined values
                const cleanData = Object.assign({}, companyData);
                Object.keys(cleanData).forEach(key => {
                    if (cleanData[key] === undefined) {
                        delete cleanData[key];
                    }
                });
                const result = yield this.makeRequest('POST', '/companies', cleanData);
                return result;
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Update an existing company
     * Pattern: /companies/{companyId}
     */
    updateCompany(companyCode, companyData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!companyData) {
                    throw new Error('Company data is required for update.');
                }
                // Get the company ID first
                const companyId = yield this.getCachedCompanyId(companyCode.trim());
                // Clean up the data - remove undefined values
                const cleanData = Object.assign({}, companyData);
                Object.keys(cleanData).forEach(key => {
                    if (cleanData[key] === undefined) {
                        delete cleanData[key];
                    }
                });
                return yield this.makeRequest('PUT', `/companies/${companyId}`, cleanData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete a company
     * Pattern: /companies/{companyId}
     */
    deleteCompany(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                // Get the company ID first
                const companyId = yield this.getCachedCompanyId(companyCode.trim());
                return yield this.makeRequest('DELETE', `/companies/${companyId}`);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company configuration settings
     * Pattern: /companies/{companyId}/configuration
     */
    getCompanyConfiguration(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                return yield this.makeCompanyIdRequest('GET', '/configuration', companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Set company configuration settings
     * Pattern: /companies/{companyId}/configuration
     */
    setCompanyConfiguration(companyCode, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!settings || !Array.isArray(settings)) {
                    throw new Error('Settings array is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/configuration', companyCode.trim(), settings);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Initialize a company with default settings
     * Pattern: /companies/{companyId}/initialize
     */
    initializeCompany(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/initialize', companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company filing status
     * Pattern: /companies/{companyId}/filings/status
     */
    getCompanyFilingStatus(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                return yield this.makeCompanyIdRequest('GET', '/filings/status', companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Approve company filing
     * Pattern: /companies/{companyId}/filings/{year}/{month}/approve
     */
    approveCompanyFiling(companyCode, year, month, model) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!year || !month) {
                    throw new Error('Year and month are required.');
                }
                return yield this.makeCompanyIdRequest('POST', `/filings/${year}/${month}/approve`, companyCode.trim(), model || { approved: true });
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company parameters
     * Pattern: /companies/{companyId}/parameters
     */
    getCompanyParameters(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                return yield this.makeCompanyIdRequest('GET', '/parameters', companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Set company parameters
     * Pattern: /companies/{companyId}/parameters
     */
    setCompanyParameters(companyCode, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!parameters || !Array.isArray(parameters)) {
                    throw new Error('Parameters array is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/parameters', companyCode.trim(), parameters);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company certificates
     * Pattern: /companies/{companyId}/certificates
     */
    getCompanyCertificates(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/certificates?${queryString}` : '/certificates';
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Fund company account
     * Pattern: /companies/{companyId}/funding/setup
     */
    fundCompanyAccount(companyCode, fundingRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!fundingRequest || !fundingRequest.amount) {
                    throw new Error('Funding request with amount is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/funding/setup', companyCode.trim(), fundingRequest);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company returns
     * Pattern: /companies/{companyId}/returns
     */
    getCompanyReturns(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filingFrequency)
                    params.append('filingFrequency', options.filingFrequency);
                if (options === null || options === void 0 ? void 0 : options.country)
                    params.append('country', options.country);
                if (options === null || options === void 0 ? void 0 : options.region)
                    params.append('region', options.region);
                if (options === null || options === void 0 ? void 0 : options.year)
                    params.append('year', options.year.toString());
                if (options === null || options === void 0 ? void 0 : options.month)
                    params.append('month', options.month.toString());
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/returns?${queryString}` : '/returns';
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create company return
     * Pattern: /companies/{companyId}/returns
     */
    createCompanyReturn(companyCode, returnObject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!returnObject) {
                    throw new Error('Return object is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/returns', companyCode.trim(), returnObject);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Approve company return
     * Pattern: /companies/{companyId}/returns/{country}/{region}/{year}/{month}/{filingFrequency}/approve
     */
    approveCompanyReturn(companyCode, year, month, country, region, filingFrequency) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!year || !month || !country || !region || !filingFrequency) {
                    throw new Error('Year, month, country, region, and filing frequency are required.');
                }
                return yield this.makeCompanyIdRequest('POST', `/returns/${country}/${region}/${year}/${month}/${filingFrequency}/approve`, companyCode.trim(), { approved: true });
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company notices
     * Pattern: /companies/{companyId}/notices
     */
    getCompanyNotices(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/notices?${queryString}` : '/notices';
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create company notice
     * Pattern: /companies/{companyId}/notices
     */
    createCompanyNotice(companyCode, notice) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!notice || !notice.noticeNumber || !notice.noticeDate) {
                    throw new Error('Notice object with noticeNumber and noticeDate is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/notices', companyCode.trim(), notice);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Quick setup company
     * Pattern: /companies/{companyId}/quicksetup
     */
    quickSetupCompany(companyCode, setupRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!setupRequest) {
                    throw new Error('Setup request is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/quicksetup', companyCode.trim(), setupRequest);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get company worksheets
     * Pattern: /companies/{companyId}/worksheets
     */
    getCompanyWorksheets(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.year)
                    params.append('year', options.year.toString());
                if (options === null || options === void 0 ? void 0 : options.month)
                    params.append('month', options.month.toString());
                if (options === null || options === void 0 ? void 0 : options.country)
                    params.append('country', options.country);
                if (options === null || options === void 0 ? void 0 : options.region)
                    params.append('region', options.region);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/worksheets?${queryString}` : '/worksheets';
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, companyCode.trim());
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Rebuild company worksheets
     * Pattern: /companies/{companyId}/worksheets/rebuild
     */
    rebuildCompanyWorksheets(companyCode, rebuildRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required.');
                }
                if (!rebuildRequest || !rebuildRequest.year || !rebuildRequest.month) {
                    throw new Error('Rebuild request with year and month is required.');
                }
                return yield this.makeCompanyIdRequest('POST', '/worksheets/rebuild', companyCode.trim(), rebuildRequest);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get certificates for a company - Example of companyId URL pattern
     * Pattern: /companies/{companyId}/certificates
     */
    getCertificates(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const resolvedCompanyCode = companyCode || this.config.companyCode;
                if (!resolvedCompanyCode || resolvedCompanyCode.trim() === '') {
                    throw new Error('Company code is required. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.customerCode) {
                    params.append('$filter', `customers/any(c: c/customerCode eq '${this.sanitizeString(options.customerCode)}')`);
                }
                else if (options === null || options === void 0 ? void 0 : options.filter) {
                    params.append('$filter', this.sanitizeString(options.filter));
                }
                params.append('$top', '50');
                params.append('$orderby', 'createdDate desc');
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/certificates?${queryString}` : '/certificates';
                const result = yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode.trim());
                return {
                    certificates: result.value || [],
                    count: result['@recordsetCount'] || ((_a = result.value) === null || _a === void 0 ? void 0 : _a.length) || 0
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get transaction by company code and transaction code - Example of companyCode URL pattern
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}
     */
    getTransaction(companyCode, transactionCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for retrieving transactions.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.documentType) {
                    params.append('documentType', options.documentType);
                }
                if (options === null || options === void 0 ? void 0 : options.include) {
                    params.append('$include', options.include);
                }
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim()); // Use same encoding for transaction codes
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}?${queryString}`
                    : `/transactions/${encodedTransactionCode}`;
                const result = yield this.makeCompanyCodeRequest('GET', pathAfterCompanyCode, companyCode.trim());
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // ===== NEXUS MANAGEMENT METHODS =====
    /**
     * Get all nexus declarations for a company - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus
     */
    getCompanyNexus(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/nexus?${queryString}` : '/nexus';
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get a specific nexus declaration by ID - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/{id}
     */
    getNexusById(id, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id || id <= 0) {
                    throw new Error('Valid nexus ID is required.');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/nexus/${id}?${queryString}` : `/nexus/${id}`;
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create a new nexus declaration - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus
     */
    createNexus(nexusData, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!nexusData || !nexusData.country) {
                    throw new Error('Nexus data with country is required.');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                // Ensure we send an array of nexus declarations as AvaTax expects
                const nexusArray = Array.isArray(nexusData) ? nexusData : [nexusData];
                return yield this.makeCompanyIdRequest('POST', '/nexus', resolvedCompanyCode, nexusArray);
            }
            catch (error) {
                this.handleError(error);
            }
        });
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
    updateNexus(id, nexusData, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id || id <= 0) {
                    throw new Error('Valid nexus ID is required.');
                }
                if (!nexusData) {
                    throw new Error('Nexus data is required for update.');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                // For updates, we need to include the ID in the nexus data
                const updateData = Object.assign(Object.assign({}, nexusData), { id: id });
                return yield this.makeCompanyIdRequest('PUT', `/nexus/${id}`, resolvedCompanyCode, updateData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Helper method to safely update nexus by first retrieving existing data
     * and only modifying user-selectable fields
     */
    updateNexusSafely(id, userSelectableFields, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id || id <= 0) {
                    throw new Error('Valid nexus ID is required.');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                // First get the existing nexus declaration
                const existingNexus = yield this.getNexusById(id, resolvedCompanyCode);
                if (!existingNexus) {
                    throw new Error(`Nexus with ID ${id} not found.`);
                }
                // Create update data by merging existing data with only user-selectable fields
                const userSelectableFieldNames = [
                    'effectiveDate', 'endDate', 'taxId', 'nexusTypeId',
                    'hasLocalNexus', 'streamlinedSalesTax', 'hasPermanentEstablishment',
                    'isSellerImporterOfRecord', 'localNexusTypeId'
                ];
                const updateData = Object.assign({}, existingNexus);
                // Only update user-selectable fields that were provided
                for (const field of userSelectableFieldNames) {
                    if (userSelectableFields[field] !== undefined) {
                        updateData[field] = userSelectableFields[field];
                    }
                }
                // Ensure ID is included
                updateData.id = id;
                return yield this.makeCompanyIdRequest('PUT', `/nexus/${id}`, resolvedCompanyCode, updateData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete a nexus declaration - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/{id}
     */
    deleteNexus(id, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!id || id <= 0) {
                    throw new Error('Valid nexus ID is required.');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                return yield this.makeCompanyIdRequest('DELETE', `/nexus/${id}`, resolvedCompanyCode);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get nexus declarations by form code - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/byform/{formCode}
     */
    getNexusByFormCode(formCode, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!formCode || formCode.trim() === '') {
                    throw new Error('Form code is required.');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const encodedFormCode = encodeURIComponent(formCode.trim());
                const pathAfterCompanyId = queryString
                    ? `/nexus/byform/${encodedFormCode}?${queryString}`
                    : `/nexus/byform/${encodedFormCode}`;
                return yield this.makeCompanyIdRequest('GET', pathAfterCompanyId, resolvedCompanyCode);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Declare nexus by address - uses companyId URL pattern
     * Pattern: /companies/{companyId}/nexus/byaddress
     */
    declareNexusByAddress(addressData, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!addressData || !addressData.line1 || !addressData.city || !addressData.region || !addressData.country || !addressData.postalCode) {
                    throw new Error('Complete address information is required (line1, city, region, country, postalCode).');
                }
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.textCase)
                    params.append('textCase', options.textCase);
                if (options === null || options === void 0 ? void 0 : options.effectiveDate)
                    params.append('effectiveDate', options.effectiveDate);
                const queryString = params.toString();
                const pathAfterCompanyId = queryString ? `/nexus/byaddress?${queryString}` : '/nexus/byaddress';
                return yield this.makeCompanyIdRequest('POST', pathAfterCompanyId, resolvedCompanyCode, addressData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // ===== TRANSACTION MANAGEMENT METHODS =====
    /**
     * List transactions for a company with filtering
     * Pattern: /companies/{companyCode}/transactions
     */
    listTransactions(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const pathAfterCompanyCode = queryString ? `/transactions?${queryString}` : '/transactions';
                const result = yield this.makeCompanyCodeRequest('GET', pathAfterCompanyCode, resolvedCompanyCode);
                return {
                    count: result.count || 0,
                    value: result.value || [],
                    '@recordsetCount': result['@recordsetCount']
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Commit a transaction to make it available for tax reporting
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/commit
     */
    commitTransaction(companyCode, transactionCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for committing transactions.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.documentType)
                    params.append('documentType', options.documentType);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}/commit?${queryString}`
                    : `/transactions/${encodedTransactionCode}/commit`;
                const commitModel = {
                    commit: (options === null || options === void 0 ? void 0 : options.commit) !== false // Default to true
                };
                const result = yield this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), commitModel);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    committed: result.status === 'Committed'
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Void a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/void
     */
    voidTransaction(companyCode, transactionCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for voiding transactions.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.documentType)
                    params.append('documentType', options.documentType);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}/void?${queryString}`
                    : `/transactions/${encodedTransactionCode}/void`;
                const voidModel = {
                    code: (options === null || options === void 0 ? void 0 : options.code) || 'DocVoided'
                };
                const result = yield this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), voidModel);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    voided: result.status === 'DocVoided'
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Adjust a committed transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/adjust
     */
    adjustTransaction(companyCode, transactionCode, newTransaction, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for adjusting transactions.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.documentType)
                    params.append('documentType', options.documentType);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}/adjust?${queryString}`
                    : `/transactions/${encodedTransactionCode}/adjust`;
                // Prepare adjustment model - similar to createTransaction but for adjustment
                const adjustModel = Object.assign(Object.assign({}, newTransaction), { companyCode: companyCode.trim(), lines: (_a = newTransaction.lines) === null || _a === void 0 ? void 0 : _a.map((line, index) => ({
                        number: line.number || `${index + 1}`,
                        quantity: line.quantity || 1,
                        amount: line.amount,
                        itemCode: line.itemCode,
                        description: line.description,
                        taxCode: line.taxCode || 'P0000000'
                    })) });
                const result = yield this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), adjustModel);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    adjusted: true
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Uncommit a committed transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/uncommit
     */
    uncommitTransaction(companyCode, transactionCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for uncommitting transactions.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.documentType)
                    params.append('documentType', options.documentType);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}/uncommit?${queryString}`
                    : `/transactions/${encodedTransactionCode}/uncommit`;
                const result = yield this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), {});
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    uncommitted: result.status === 'Saved'
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get audit information for a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/audit
     */
    getTransactionAudit(companyCode, transactionCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for transaction audit.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = `/transactions/${encodedTransactionCode}/audit`;
                const result = yield this.makeCompanyCodeRequest('GET', pathAfterCompanyCode, companyCode.trim());
                return {
                    companyId: result.companyId,
                    serverTimestamp: result.serverTimestamp,
                    serverDuration: result.serverDuration,
                    apiCallStatus: result.apiCallStatus,
                    originalApiRequestUrl: result.originalApiRequestUrl,
                    reconstructedApiRequestBody: result.reconstructedApiRequestBody
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Change the code of a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/changecode
     */
    changeTransactionCode(companyCode, transactionCode, newCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                if (options === null || options === void 0 ? void 0 : options.documentType)
                    params.append('documentType', options.documentType);
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}/changecode?${queryString}`
                    : `/transactions/${encodedTransactionCode}/changecode`;
                const changeCodeModel = {
                    newCode: newCode.trim()
                };
                const result = yield this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), changeCodeModel);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    codeChanged: true
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Verify a transaction
     * Pattern: /companies/{companyCode}/transactions/{transactionCode}/verify
     */
    verifyTransaction(companyCode, transactionCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!companyCode || companyCode.trim() === '') {
                    throw new Error('Company code is required for verifying transactions.');
                }
                if (!transactionCode || transactionCode.trim() === '') {
                    throw new Error('Transaction code is required.');
                }
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.documentType)
                    params.append('documentType', options.documentType);
                const queryString = params.toString();
                const encodedTransactionCode = this.encodeCompanyCode(transactionCode.trim());
                const pathAfterCompanyCode = queryString
                    ? `/transactions/${encodedTransactionCode}/verify?${queryString}`
                    : `/transactions/${encodedTransactionCode}/verify`;
                const result = yield this.makeCompanyCodeRequest('POST', pathAfterCompanyCode, companyCode.trim(), {});
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    verified: true,
                    messages: result.messages || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
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
    getCompanyItems(companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                if (options === null || options === void 0 ? void 0 : options.tagName)
                    params.append('tagName', options.tagName);
                if (options === null || options === void 0 ? void 0 : options.itemStatus)
                    params.append('itemStatus', options.itemStatus);
                if (options === null || options === void 0 ? void 0 : options.taxCodeRecommendationStatus)
                    params.append('taxCodeRecommendationStatus', options.taxCodeRecommendationStatus);
                if (options === null || options === void 0 ? void 0 : options.hsCodeClassificationStatus)
                    params.append('hsCodeClassificationStatus', options.hsCodeClassificationStatus);
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items?${queryString}`
                    : `/companies/${companyId}/items`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Retrieve a specific item by ID
     */
    getCompanyItem(itemId, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items/${itemId}?${queryString}`
                    : `/companies/${companyId}/items/${itemId}`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create new items in a company's product catalog
     */
    createCompanyItems(items, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if ((options === null || options === void 0 ? void 0 : options.processRecommendationsSynchronously) !== undefined) {
                    params.append('processRecommendationsSynchronously', options.processRecommendationsSynchronously.toString());
                }
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items?${queryString}`
                    : `/companies/${companyId}/items`;
                return yield this.makeRequest('POST', endpoint, items);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Update an existing item
     */
    updateCompanyItem(itemId, itemData, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if ((options === null || options === void 0 ? void 0 : options.processRecommendationsSynchronously) !== undefined) {
                    params.append('processRecommendationsSynchronously', options.processRecommendationsSynchronously.toString());
                }
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items/${itemId}?${queryString}`
                    : `/companies/${companyId}/items/${itemId}`;
                return yield this.makeRequest('PUT', endpoint, itemData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete an item from a company's product catalog
     */
    deleteCompanyItem(itemId, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}`;
                return yield this.makeRequest('DELETE', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Item Parameters Management
     * Parameters store additional attributes like UPC codes, product summaries,
     * dimensions, or custom fields that can affect tax calculations.
     */
    /**
     * Get parameters for a specific item
     */
    getItemParameters(itemId, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items/${itemId}/parameters?${queryString}`
                    : `/companies/${companyId}/items/${itemId}/parameters`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create parameters for an item
     */
    createItemParameters(itemId, parameters, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/parameters`;
                return yield this.makeRequest('POST', endpoint, parameters);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Update a specific item parameter
     */
    updateItemParameter(itemId, parameterId, parameterData, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/parameters/${parameterId}`;
                return yield this.makeRequest('PUT', endpoint, parameterData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete a specific item parameter
     */
    deleteItemParameter(itemId, parameterId, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/parameters/${parameterId}`;
                return yield this.makeRequest('DELETE', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Item Classifications Management
     * Classifications include HS codes, NAICS codes, and other product classification
     * systems used for trade and tax compliance.
     */
    /**
     * Get classifications for a specific item
     */
    getItemClassifications(itemId, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items/${itemId}/classifications?${queryString}`
                    : `/companies/${companyId}/items/${itemId}/classifications`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create classifications for an item
     */
    createItemClassifications(itemId, classifications, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/classifications`;
                return yield this.makeRequest('POST', endpoint, classifications);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Update a specific item classification
     */
    updateItemClassification(itemId, classificationId, classificationData, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/classifications/${classificationId}`;
                return yield this.makeRequest('PUT', endpoint, classificationData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete a specific item classification
     */
    deleteItemClassification(itemId, classificationId, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/classifications/${classificationId}`;
                return yield this.makeRequest('DELETE', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Item Tags Management
     * Tags are labels that help organize and categorize items for easier management.
     */
    /**
     * Get tags for a specific item
     */
    getItemTags(itemId, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items/${itemId}/tags?${queryString}`
                    : `/companies/${companyId}/items/${itemId}/tags`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Create tags for an item
     */
    createItemTags(itemId, tags, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/tags`;
                return yield this.makeRequest('POST', endpoint, tags);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete a specific tag from an item
     */
    deleteItemTag(itemId, tagId, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/tags/${tagId}`;
                return yield this.makeRequest('DELETE', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Query items by tag
     */
    queryItemsByTag(tag, companyCode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const params = new URLSearchParams();
                if (options === null || options === void 0 ? void 0 : options.filter)
                    params.append('$filter', options.filter);
                if (options === null || options === void 0 ? void 0 : options.include)
                    params.append('$include', options.include);
                if (options === null || options === void 0 ? void 0 : options.top)
                    params.append('$top', options.top.toString());
                if (options === null || options === void 0 ? void 0 : options.skip)
                    params.append('$skip', options.skip.toString());
                if (options === null || options === void 0 ? void 0 : options.orderBy)
                    params.append('$orderBy', options.orderBy);
                const queryString = params.toString();
                const endpoint = queryString
                    ? `/companies/${companyId}/items/bytags/${tag}?${queryString}`
                    : `/companies/${companyId}/items/bytags/${tag}`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Bulk upload items
     */
    bulkUploadItems(items, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/upload`;
                return yield this.makeRequest('POST', endpoint, items);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Get tax code recommendations for an item
     */
    getItemTaxCodeRecommendations(itemId, companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { companyCode: resolvedCompanyCode } = yield this.resolveCompanyInfo(companyCode);
                const companyId = yield this.getCompanyId(resolvedCompanyCode);
                const endpoint = `/companies/${companyId}/items/${itemId}/taxcoderecommendations`;
                return yield this.makeRequest('GET', endpoint);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
}
exports.default = AvataxClient;
