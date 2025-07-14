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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const avatax_1 = __importDefault(require("avatax"));
class AvataxClient {
    constructor(config) {
        this.config = config;
        this.client = new avatax_1.default({
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
    calculateTax(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                // Determine company code - require it for transactions
                const companyCode = transactionData.companyCode || this.config.companyCode;
                if (!companyCode) {
                    throw new Error('Company code is required for tax calculations. Please specify a companyCode parameter or ask the user which company to use. Use the get_companies tool to see available companies.');
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
                    // Addresses should be at the transaction level, not line level
                    addresses: {
                        shipFrom: ((_b = (_a = transactionData.lines[0]) === null || _a === void 0 ? void 0 : _a.addresses) === null || _b === void 0 ? void 0 : _b.shipFrom) || transactionData.shipFrom,
                        shipTo: ((_d = (_c = transactionData.lines[0]) === null || _c === void 0 ? void 0 : _c.addresses) === null || _d === void 0 ? void 0 : _d.shipTo) || transactionData.shipTo
                    },
                    commit: false
                };
                // Validate before sending
                this.validateTransactionData(model);
                const result = yield this.client.createTransaction({ model });
                return {
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    totalTaxable: result.totalTaxable,
                    lines: result.lines,
                    taxDate: result.taxDate,
                    status: result.status
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
                const model = {
                    line1: addressData.line1,
                    line2: addressData.line2,
                    line3: addressData.line3,
                    city: addressData.city,
                    region: addressData.region,
                    postalCode: addressData.postalCode,
                    country: addressData.country || 'US'
                };
                const result = yield this.client.resolveAddress({ model });
                if (result.validatedAddresses && result.validatedAddresses.length > 0) {
                    return {
                        valid: true,
                        normalized: result.validatedAddresses[0],
                        messages: result.messages || []
                    };
                }
                return {
                    valid: false,
                    messages: result.messages || [],
                    errors: result.errors || []
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
                const result = yield this.client.createTransaction({ model });
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
                const result = yield this.client.ping();
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
                const params = {};
                // Add search filter if provided
                if (filter) {
                    params.$filter = `companyCode contains '${this.sanitizeString(filter)}' or name contains '${this.sanitizeString(filter)}'`;
                }
                // Limit results to make the response manageable
                params.$top = 50;
                params.$orderby = 'companyCode';
                const result = yield this.client.queryCompanies(params);
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
}
exports.default = AvataxClient;
