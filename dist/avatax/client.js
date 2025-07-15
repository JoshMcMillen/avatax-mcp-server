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
/**
 * AvaTax API Client
 *
 * This client provides comprehensive access to the AvaTax REST API with proper handling
 * of company identification patterns. The AvaTax API uses two different ways to identify
 * companies in URLs:
 *
 * 1. Company Code (string) - Used in endpoints like:
 *    - /api/v2/companies/{companyCode}/transactions/{transactionCode}
 *    - Transaction operations that use companyCode in the request body
 *
 * 2. Company ID (numeric) - Used in endpoints like:
 *    - /api/v2/companies/{companyId}/certificates
 *    - /api/v2/companies/{companyId}/parameters
 *    - /api/v2/companies/{companyId}/userdefinedfields
 *    - /api/v2/companies/{companyId}/batches
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
         *    - Example: /api/v2/companies/{companyCode}/transactions/{transactionCode}
         *
         * 2. Company ID (numeric) - Used in:
         *    - Company management endpoints
         *    - Certificate operations
         *    - User-defined fields
         *    - Company parameters
         *    - Batch operations
         *    - Example: /api/v2/companies/{companyId}/certificates
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
        // Set base URL based on environment
        this.baseUrl = config.environment === 'production'
            ? 'https://rest.avatax.com'
            : 'https://sandbox-rest.avatax.com';
        // Create Basic Auth header
        const credentials = Buffer.from(`${config.accountId}:${config.licenseKey}`).toString('base64');
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
            const companyCode = requestedCompanyCode || this.config.companyCode;
            if (!companyCode || companyCode.trim() === '') {
                throw new Error('Company code is required. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
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
     * Pattern: /api/v2/companies/{companyId}/...
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
     * Pattern: /api/v2/companies/{companyCode}/...
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
     * Get certificates for a company - Example of companyId URL pattern
     * Pattern: /api/v2/companies/{companyId}/certificates
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
     * Pattern: /api/v2/companies/{companyCode}/transactions/{transactionCode}
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
     * Pattern: /api/v2/companies/{companyId}/nexus
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
     * Pattern: /api/v2/companies/{companyId}/nexus/{id}
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
     * Pattern: /api/v2/companies/{companyId}/nexus
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
     * Pattern: /api/v2/companies/{companyId}/nexus/{id}
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
                return yield this.makeCompanyIdRequest('PUT', `/nexus/${id}`, resolvedCompanyCode, nexusData);
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    /**
     * Delete a nexus declaration - uses companyId URL pattern
     * Pattern: /api/v2/companies/{companyId}/nexus/{id}
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
     * Pattern: /api/v2/companies/{companyId}/nexus/byform/{formCode}
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
     * Pattern: /api/v2/companies/{companyId}/nexus/byaddress
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
}
exports.default = AvataxClient;
