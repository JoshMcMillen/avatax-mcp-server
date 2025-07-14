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
                    type: transactionData.type || 'SalesOrder',
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
                const result = yield this.client.resolveAddress(model);
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
    // Phase 1: Core Transaction Operations
    voidTransaction(companyCode_1, transactionCode_1) {
        return __awaiter(this, arguments, void 0, function* (companyCode, transactionCode, voidType = 'DocVoided') {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for voiding transactions. Please specify a companyCode parameter or ask the user which company to use.');
                }
                const model = {
                    code: voidType
                };
                const result = yield this.client.voidTransaction(finalCompanyCode, transactionCode, model);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    voided: result.status === 'Cancelled'
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    refundTransaction(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    const originalTx = yield this.verifyTransaction(companyCode, params.originalTransactionCode);
                    if (originalTx && originalTx.lines) {
                        model.lines = originalTx.lines.map((line) => ({
                            number: line.lineNumber,
                            quantity: -Math.abs(line.quantity || 1), // Negative for refund
                            amount: -Math.abs(line.lineAmount || 0), // Negative for refund
                            description: `REFUND: ${line.description || ''}`,
                            itemCode: line.itemCode,
                            taxCode: line.taxCode
                        }));
                    }
                }
                const result = yield this.client.createTransaction({ model });
                return {
                    id: result.id,
                    code: result.code,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    status: result.status,
                    refunded: true
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    adjustTransaction(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.adjustTransaction(companyCode, params.transactionCode, model);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    adjusted: true,
                    adjustmentReason: params.adjustmentReason
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    settleTransaction(companyCode, transactionCode, paymentDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for settling transactions. Please specify a companyCode parameter.');
                }
                const model = {
                    paymentDate: paymentDate || new Date().toISOString().split('T')[0]
                };
                const result = yield this.client.settleTransaction(finalCompanyCode, transactionCode, model);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    settled: true,
                    paymentDate: model.paymentDate
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    verifyTransaction(companyCode_1, transactionCode_1) {
        return __awaiter(this, arguments, void 0, function* (companyCode, transactionCode, documentType = 'SalesInvoice', include = 'Lines') {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for verifying transactions. Please specify a companyCode parameter.');
                }
                const result = yield this.client.getTransactionByCode(finalCompanyCode, transactionCode, documentType, include);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    lockTransaction(companyCode, transactionCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for locking transactions. Please specify a companyCode parameter.');
                }
                const result = yield this.client.lockTransaction(finalCompanyCode, transactionCode);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    locked: true
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    unlockTransaction(companyCode, transactionCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for unlocking transactions. Please specify a companyCode parameter.');
                }
                const result = yield this.client.uncommitTransaction(finalCompanyCode, transactionCode);
                return {
                    id: result.id,
                    code: result.code,
                    status: result.status,
                    locked: false
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 2: Batch Operations
    createBatch(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                const result = yield this.client.createBatches(companyCode, [model]);
                return {
                    id: (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id,
                    name: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.name,
                    status: (_c = result[0]) === null || _c === void 0 ? void 0 : _c.status,
                    recordCount: (_d = result[0]) === null || _d === void 0 ? void 0 : _d.recordCount
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getBatchStatus(companyCode, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for checking batch status. Please specify a companyCode parameter.');
                }
                const result = yield this.client.getBatch(finalCompanyCode, batchId);
                return {
                    id: result.id,
                    name: result.name,
                    status: result.status,
                    recordCount: result.recordCount,
                    currentRecord: result.currentRecord,
                    completedDate: result.completedDate
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    downloadBatch(companyCode, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for downloading batch results. Please specify a companyCode parameter.');
                }
                const result = yield this.client.downloadBatch(finalCompanyCode, batchId);
                return {
                    batchId: batchId,
                    downloadUrl: result.downloadUrl || 'Results available via API',
                    content: result.content || result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    cancelBatch(companyCode, batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for canceling batches. Please specify a companyCode parameter.');
                }
                const result = yield this.client.cancelBatch(finalCompanyCode, batchId);
                return {
                    id: result.id,
                    name: result.name,
                    status: result.status,
                    cancelled: result.status === 'Cancelled'
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 3: Company & Configuration Management
    createCompany(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                const result = yield this.client.createCompanies([model]);
                return {
                    id: (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id,
                    companyCode: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.companyCode,
                    name: (_c = result[0]) === null || _c === void 0 ? void 0 : _c.name,
                    isActive: (_d = result[0]) === null || _d === void 0 ? void 0 : _d.isActive
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateCompany(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.updateCompany(params.companyId, model);
                return {
                    id: result.id,
                    companyCode: result.companyCode,
                    name: result.name,
                    isActive: result.isActive
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getCompanyConfiguration(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting company configuration. Please specify a companyCode parameter.');
                }
                const result = yield this.client.listCompanyConfigurations(finalCompanyCode);
                return {
                    companyCode: finalCompanyCode,
                    configurations: result.value || result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    setCompanyConfiguration(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.createCompanyConfigurations(companyCode, model);
                return {
                    companyCode: companyCode,
                    category: params.category,
                    name: params.name,
                    value: params.value,
                    created: result.length > 0
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    listCompanyLocations(companyCode, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for listing company locations. Please specify a companyCode parameter.');
                }
                const result = yield this.client.listLocationsByCompany(finalCompanyCode, filter);
                return {
                    companyCode: finalCompanyCode,
                    locations: result.value || result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createCompanyLocation(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                const result = yield this.client.createLocations(companyCode, [model]);
                return {
                    id: (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id,
                    locationCode: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.locationCode,
                    description: (_c = result[0]) === null || _c === void 0 ? void 0 : _c.description,
                    isDefault: (_d = result[0]) === null || _d === void 0 ? void 0 : _d.isDefault
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateCompanyLocation(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.updateLocation(companyCode, params.locationId, model);
                return {
                    id: result.id,
                    locationCode: result.locationCode,
                    description: result.description,
                    isDefault: result.isDefault
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteCompanyLocation(companyCode, locationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for deleting company locations. Please specify a companyCode parameter.');
                }
                const result = yield this.client.deleteLocation(finalCompanyCode, locationId);
                return {
                    deleted: true,
                    locationId: locationId,
                    companyCode: finalCompanyCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 4: Nexus Management
    listNexus(companyCode, filter, include) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for listing nexus. Please specify a companyCode parameter.');
                }
                const result = yield this.client.listNexusByCompany(finalCompanyCode, filter, include);
                return {
                    companyCode: finalCompanyCode,
                    nexusDeclarations: result.value || result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createNexus(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
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
                const result = yield this.client.createNexus(companyCode, [model]);
                return {
                    id: (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id,
                    country: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.country,
                    region: (_c = result[0]) === null || _c === void 0 ? void 0 : _c.region,
                    jurisName: (_d = result[0]) === null || _d === void 0 ? void 0 : _d.jurisName,
                    nexusTypeId: (_e = result[0]) === null || _e === void 0 ? void 0 : _e.nexusTypeId
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateNexus(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.updateNexus(companyCode, params.nexusId, model);
                return {
                    id: result.id,
                    country: result.country,
                    region: result.region,
                    jurisName: result.jurisName,
                    nexusTypeId: result.nexusTypeId
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteNexus(companyCode, nexusId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for deleting nexus. Please specify a companyCode parameter.');
                }
                const result = yield this.client.deleteNexus(finalCompanyCode, nexusId);
                return {
                    deleted: true,
                    nexusId: nexusId,
                    companyCode: finalCompanyCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getNexusByAddress(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const model = {
                    line1: params.line1,
                    line2: params.line2,
                    city: params.city,
                    region: params.region,
                    postalCode: params.postalCode,
                    country: params.country
                };
                const result = yield this.client.getNexusByAddress(model.line1, model.line2, model.city, model.region, model.postalCode, model.country, params.taxTypeId);
                return {
                    address: model,
                    nexusObligations: result.value || result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    declareNexusByAddress(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyCode = params.companyCode || this.config.companyCode;
                if (!companyCode) {
                    throw new Error('Company code is required for declaring nexus by address. Please specify a companyCode parameter.');
                }
                const nexusDeclarations = params.addresses.map((address) => ({
                    country: address.country,
                    region: address.region,
                    jurisTypeId: 'STA',
                    jurisName: address.region,
                    effectiveDate: params.effectiveDate,
                    nexusTypeId: params.nexusTypeId || 'SalesOrSellersUseTax',
                    hasLocalNexus: false
                }));
                const result = yield this.client.createNexus(companyCode, nexusDeclarations);
                return {
                    companyCode: companyCode,
                    declarationsCreated: result.length,
                    nexusDeclarations: result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 5: Tax Code & Item Management
    listTaxCodes(companyCode, filter, include) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    // List system tax codes if no company specified
                    const result = yield this.client.listTaxCodes(filter, include);
                    return {
                        taxCodes: result.value || result,
                        isSystemTaxCodes: true
                    };
                }
                const result = yield this.client.listTaxCodesByCompany(finalCompanyCode, filter, include);
                return {
                    companyCode: finalCompanyCode,
                    taxCodes: result.value || result,
                    isSystemTaxCodes: false
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createTaxCode(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                const result = yield this.client.createTaxCodes(companyCode, [model]);
                return {
                    id: (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id,
                    taxCode: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.taxCode,
                    description: (_c = result[0]) === null || _c === void 0 ? void 0 : _c.description,
                    taxCodeTypeId: (_d = result[0]) === null || _d === void 0 ? void 0 : _d.taxCodeTypeId
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateTaxCode(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.updateTaxCode(companyCode, params.taxCodeId, model);
                return {
                    id: result.id,
                    taxCode: result.taxCode,
                    description: result.description,
                    taxCodeTypeId: result.taxCodeTypeId
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteTaxCode(companyCode, taxCodeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for deleting tax codes. Please specify a companyCode parameter.');
                }
                const result = yield this.client.deleteTaxCode(finalCompanyCode, taxCodeId);
                return {
                    deleted: true,
                    taxCodeId: taxCodeId,
                    companyCode: finalCompanyCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    listItems(companyCode, filter, include) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for listing items. Please specify a companyCode parameter.');
                }
                const result = yield this.client.listItemsByCompany(finalCompanyCode, filter, include);
                return {
                    companyCode: finalCompanyCode,
                    items: result.value || result
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                const result = yield this.client.createItems(companyCode, [model]);
                return {
                    id: (_a = result[0]) === null || _a === void 0 ? void 0 : _a.id,
                    itemCode: (_b = result[0]) === null || _b === void 0 ? void 0 : _b.itemCode,
                    description: (_c = result[0]) === null || _c === void 0 ? void 0 : _c.description,
                    taxCode: (_d = result[0]) === null || _d === void 0 ? void 0 : _d.taxCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateItem(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.updateItem(companyCode, params.itemId, model);
                return {
                    id: result.id,
                    itemCode: result.itemCode,
                    description: result.description,
                    taxCode: result.taxCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteItem(companyCode, itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for deleting items. Please specify a companyCode parameter.');
                }
                const result = yield this.client.deleteItem(finalCompanyCode, itemId);
                return {
                    deleted: true,
                    itemId: itemId,
                    companyCode: finalCompanyCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 6: Location Management
    resolveAddress(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.resolveAddress({
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    resolveAddressPost(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.resolveAddressPost(model);
                return {
                    address: result.address,
                    validatedAddresses: result.validatedAddresses,
                    coordinates: result.coordinates,
                    resolutionQuality: result.resolutionQuality,
                    taxAuthorities: result.taxAuthorities
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    listLocationsByCompany(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.listLocationsByCompany(finalCompanyCode, options);
                return {
                    count: result['@recordsetCount'],
                    locations: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((location) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createLocation(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.createLocations(finalCompanyCode, [model]);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateLocation(companyCode, locationId, params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.updateLocation(finalCompanyCode, locationId, model);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteLocation(companyCode, locationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for deleting locations. Please specify a companyCode parameter.');
                }
                const result = yield this.client.deleteLocation(finalCompanyCode, locationId);
                return {
                    deleted: true,
                    locationId: locationId,
                    companyCode: finalCompanyCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 7: Customer Management
    listCustomers(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.listCustomersByCompany(finalCompanyCode, options);
                return {
                    count: result['@recordsetCount'],
                    customers: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((customer) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createCustomer(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for creating customers. Please specify a companyCode parameter.');
                }
                const model = {
                    customerCode: params === null || params === void 0 ? void 0 : params.customerCode,
                    name: params === null || params === void 0 ? void 0 : params.name,
                    attnName: params === null || params === void 0 ? void 0 : params.attnName,
                    line1: params === null || params === void 0 ? void 0 : params.line1,
                    line2: params === null || params === void 0 ? void 0 : params.line2,
                    city: params === null || params === void 0 ? void 0 : params.city,
                    region: params === null || params === void 0 ? void 0 : params.region,
                    postalCode: params === null || params === void 0 ? void 0 : params.postalCode,
                    country: params === null || params === void 0 ? void 0 : params.country,
                    phoneNumber: params === null || params === void 0 ? void 0 : params.phoneNumber,
                    emailAddress: params === null || params === void 0 ? void 0 : params.emailAddress
                };
                const result = yield this.client.createCustomers(finalCompanyCode, [model]);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getCustomer(companyCode, customerCode, include) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting customer details. Please specify a companyCode parameter.');
                }
                if (!customerCode) {
                    throw new Error('Customer code is required for getting customer details.');
                }
                const result = yield this.client.getCustomer(finalCompanyCode, customerCode, include);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateCustomer(companyCode, customerCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for updating customers. Please specify a companyCode parameter.');
                }
                if (!customerCode) {
                    throw new Error('Customer code is required for updating customers.');
                }
                const model = {
                    name: params === null || params === void 0 ? void 0 : params.name,
                    attnName: params === null || params === void 0 ? void 0 : params.attnName,
                    line1: params === null || params === void 0 ? void 0 : params.line1,
                    line2: params === null || params === void 0 ? void 0 : params.line2,
                    city: params === null || params === void 0 ? void 0 : params.city,
                    region: params === null || params === void 0 ? void 0 : params.region,
                    postalCode: params === null || params === void 0 ? void 0 : params.postalCode,
                    country: params === null || params === void 0 ? void 0 : params.country,
                    phoneNumber: params === null || params === void 0 ? void 0 : params.phoneNumber,
                    emailAddress: params === null || params === void 0 ? void 0 : params.emailAddress
                };
                const result = yield this.client.updateCustomer(finalCompanyCode, customerCode, model);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteCustomer(companyCode, customerCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for deleting customers. Please specify a companyCode parameter.');
                }
                if (!customerCode) {
                    throw new Error('Customer code is required for deleting customers.');
                }
                const result = yield this.client.deleteCustomer(finalCompanyCode, customerCode);
                return {
                    deleted: true,
                    customerCode: customerCode,
                    companyCode: finalCompanyCode
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    listCustomerCertificates(companyCode, customerCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.listCertificatesForCustomer(finalCompanyCode, customerCode, options);
                return {
                    count: result['@recordsetCount'],
                    certificates: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((cert) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createCustomerCertificate(companyCode, customerCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for creating customer certificates. Please specify a companyCode parameter.');
                }
                if (!customerCode) {
                    throw new Error('Customer code is required for creating customer certificates.');
                }
                const model = {
                    exemptionNumber: params === null || params === void 0 ? void 0 : params.exemptionNumber,
                    exemptionReasonId: params === null || params === void 0 ? void 0 : params.exemptionReasonId,
                    exemptionType: params === null || params === void 0 ? void 0 : params.exemptionType,
                    effectiveDate: params === null || params === void 0 ? void 0 : params.effectiveDate,
                    expirationDate: params === null || params === void 0 ? void 0 : params.expirationDate,
                    signedDate: params === null || params === void 0 ? void 0 : params.signedDate,
                    filename: params === null || params === void 0 ? void 0 : params.filename,
                    documentExists: (params === null || params === void 0 ? void 0 : params.documentExists) || false
                };
                const result = yield this.client.createCertificatesForCustomer(finalCompanyCode, customerCode, [model]);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 8: Reporting & Compliance
    listTransactions(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.listTransactionsByCompany(finalCompanyCode, options);
                return {
                    count: result['@recordsetCount'],
                    transactions: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((transaction) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    exportTransactions(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for exporting transactions. Please specify a companyCode parameter.');
                }
                const model = {
                    startDate: params === null || params === void 0 ? void 0 : params.startDate,
                    endDate: params === null || params === void 0 ? void 0 : params.endDate,
                    format: (params === null || params === void 0 ? void 0 : params.format) || 'Json',
                    compressionType: (params === null || params === void 0 ? void 0 : params.compressionType) || 'None'
                };
                const result = yield this.client.createTransactionExportRequest(finalCompanyCode, model);
                return {
                    id: result.id,
                    format: result.format,
                    status: result.status,
                    startDate: result.startDate,
                    endDate: result.endDate,
                    downloadUrl: result.downloadUrl,
                    recordCount: result.recordCount
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getFilingCalendar(companyCode, returnName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting filing calendar. Please specify a companyCode parameter.');
                }
                const options = returnName ? { $filter: `returnName eq '${returnName}'` } : undefined;
                const result = yield this.client.getFilingCalendar(finalCompanyCode, options);
                return {
                    companyCode: finalCompanyCode,
                    filingCalendars: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((calendar) => ({
                        id: calendar.id,
                        companyId: calendar.companyId,
                        returnName: calendar.returnName,
                        filingFrequency: calendar.filingFrequency,
                        months: calendar.months,
                        effectiveDate: calendar.effectiveDate,
                        endDate: calendar.endDate,
                        country: calendar.country,
                        region: calendar.region
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getFilingStatus(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.getFilingStatus(finalCompanyCode, options);
                return {
                    companyCode: finalCompanyCode,
                    filingReturns: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((filing) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    approveFiling(companyCode, filingReturnId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for approving filings. Please specify a companyCode parameter.');
                }
                if (!filingReturnId) {
                    throw new Error('Filing return ID is required for approving filings.');
                }
                const result = yield this.client.approveFiling(finalCompanyCode, filingReturnId);
                return {
                    id: result.id,
                    status: result.status,
                    approved: result.status === 'Approved',
                    approvedDate: result.approvedDate,
                    approvedByUserId: result.approvedByUserId
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getWorksheet(companyCode, filingReturnId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting worksheets. Please specify a companyCode parameter.');
                }
                if (!filingReturnId) {
                    throw new Error('Filing return ID is required for getting worksheets.');
                }
                const result = yield this.client.getWorksheet(finalCompanyCode, filingReturnId);
                return {
                    id: result.id,
                    returnName: result.returnName,
                    worksheetType: result.worksheetType,
                    country: result.country,
                    region: result.region,
                    worksheetLines: ((_a = result.worksheetLines) === null || _a === void 0 ? void 0 : _a.map((line) => ({
                        lineNumber: line.lineNumber,
                        description: line.description,
                        taxableAmount: line.taxableAmount,
                        taxAmount: line.taxAmount,
                        exemptAmount: line.exemptAmount
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getNotices(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.getNotices(finalCompanyCode, options);
                return {
                    count: result['@recordsetCount'],
                    notices: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((notice) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createNoticeResponsibility(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for creating notice responsibilities. Please specify a companyCode parameter.');
                }
                if (!(params === null || params === void 0 ? void 0 : params.noticeId) || !(params === null || params === void 0 ? void 0 : params.responsiblePersonId)) {
                    throw new Error('Notice ID and responsible person ID are required for creating notice responsibilities.');
                }
                const model = {
                    noticeId: params.noticeId,
                    responsiblePersonId: params.responsiblePersonId,
                    description: params.description || 'Notice responsibility assignment'
                };
                const result = yield this.client.createNoticeResponsibilities(finalCompanyCode, [model]);
                const responsibility = result[0];
                return {
                    id: responsibility.id,
                    noticeId: responsibility.noticeId,
                    responsiblePersonId: responsibility.responsiblePersonId,
                    description: responsibility.description,
                    isActive: responsibility.isActive
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getMultiDocument(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting multi-document transactions. Please specify a companyCode parameter.');
                }
                if (!(params === null || params === void 0 ? void 0 : params.code)) {
                    throw new Error('Multi-document code is required for getting multi-document transactions.');
                }
                const result = yield this.client.getMultiDocumentByCode(finalCompanyCode, params.code, params.type, params.include);
                return {
                    id: result.id,
                    code: result.code,
                    type: result.type,
                    status: result.status,
                    date: result.date,
                    totalAmount: result.totalAmount,
                    totalTax: result.totalTax,
                    totalExempt: result.totalExempt,
                    documents: ((_a = result.documents) === null || _a === void 0 ? void 0 : _a.map((doc) => ({
                        id: doc.id,
                        code: doc.code,
                        type: doc.type,
                        status: doc.status,
                        totalAmount: doc.totalAmount,
                        totalTax: doc.totalTax
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getAuditTrail(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting audit trail. Please specify a companyCode parameter.');
                }
                const options = {};
                if (params === null || params === void 0 ? void 0 : params.transactionId) {
                    options.$filter = `transactionId eq ${params.transactionId}`;
                }
                if ((params === null || params === void 0 ? void 0 : params.startDate) && (params === null || params === void 0 ? void 0 : params.endDate)) {
                    const dateFilter = `modifiedDate gte ${params.startDate} and modifiedDate lte ${params.endDate}`;
                    options.$filter = options.$filter ? `${options.$filter} and ${dateFilter}` : dateFilter;
                }
                if (params === null || params === void 0 ? void 0 : params.top) {
                    options.$top = params.top;
                }
                const result = yield this.client.getAuditTrail(finalCompanyCode, options);
                return {
                    count: result['@recordsetCount'],
                    auditTrail: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((audit) => ({
                        id: audit.id,
                        transactionId: audit.transactionId,
                        fieldName: audit.fieldName,
                        oldValue: audit.oldValue,
                        newValue: audit.newValue,
                        modifiedDate: audit.modifiedDate,
                        modifiedUserId: audit.modifiedUserId,
                        modifiedUserName: audit.modifiedUserName,
                        changeReason: audit.changeReason
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 9: Advanced Features
    getTaxRates(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.taxRatesByAddress(address.line1, address.line2, address.city, address.region, address.postalCode, address.country, effectiveDate);
                return {
                    address: address,
                    effectiveDate: effectiveDate,
                    totalRate: result.totalRate,
                    rates: ((_a = result.rates) === null || _a === void 0 ? void 0 : _a.map((rate) => ({
                        rate: rate.rate,
                        name: rate.name,
                        type: rate.type,
                        country: rate.country,
                        region: rate.region,
                        jurisdiction: rate.jurisdiction
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getJurisdictions(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const result = yield this.client.jurisdictionsByAddress(address.line1, address.line2, address.city, address.region, address.postalCode, address.country, effectiveDate);
                return {
                    address: address,
                    effectiveDate: effectiveDate,
                    jurisdictions: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((jurisdiction) => ({
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
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createCertificateRequest(companyCode, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for creating certificate requests. Please specify a companyCode parameter.');
                }
                const model = {
                    companyId: finalCompanyCode,
                    recipientIds: [params === null || params === void 0 ? void 0 : params.customerCode],
                    recipient: {
                        email: params === null || params === void 0 ? void 0 : params.recipientEmail
                    },
                    requestType: (params === null || params === void 0 ? void 0 : params.requestType) || 'Blanket',
                    exposureZones: ((_a = params === null || params === void 0 ? void 0 : params.exposureZones) === null || _a === void 0 ? void 0 : _a.map((zone) => ({
                        region: zone.region,
                        country: zone.country
                    }))) || [],
                    exemptionReason: (params === null || params === void 0 ? void 0 : params.exemptionReason) || 'Standard exemption request'
                };
                const result = yield this.client.createCertExpressInvitation(finalCompanyCode, [model]);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getCertificateSetup(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for getting certificate setup. Please specify a companyCode parameter.');
                }
                const result = yield this.client.getCertExpressSetup(finalCompanyCode);
                return {
                    companyCode: finalCompanyCode,
                    isProvisioned: result.isProvisioned,
                    isEnabled: result.isEnabled,
                    companyName: result.companyName,
                    logoUrl: result.logoUrl,
                    supportEmailAddress: result.supportEmailAddress,
                    availableExposureZones: ((_a = result.availableExposureZones) === null || _a === void 0 ? void 0 : _a.map((zone) => ({
                        region: zone.region,
                        country: zone.country,
                        name: zone.name
                    }))) || []
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    testConnectivity() {
        return __awaiter(this, arguments, void 0, function* (testType = 'Basic') {
            try {
                const diagnostics = {
                    testType: testType,
                    timestamp: new Date().toISOString(),
                    results: []
                };
                // Basic connectivity test
                try {
                    const pingResult = yield this.client.ping();
                    diagnostics.results.push({
                        test: 'API Connectivity',
                        status: 'PASS',
                        authenticated: pingResult.authenticated,
                        version: pingResult.version
                    });
                }
                catch (error) {
                    diagnostics.results.push({
                        test: 'API Connectivity',
                        status: 'FAIL',
                        error: error.message
                    });
                }
                if (testType === 'Full' || testType === 'Transaction') {
                    // Test company access
                    try {
                        const companies = yield this.getCompanies();
                        diagnostics.results.push({
                            test: 'Company Access',
                            status: 'PASS',
                            companyCount: companies.count
                        });
                    }
                    catch (error) {
                        diagnostics.results.push({
                            test: 'Company Access',
                            status: 'FAIL',
                            error: error.message
                        });
                    }
                }
                if (testType === 'Full' || testType === 'Address') {
                    // Test address validation
                    try {
                        const addressTest = yield this.validateAddress({
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
                    }
                    catch (error) {
                        diagnostics.results.push({
                            test: 'Address Validation',
                            status: 'FAIL',
                            error: error.message
                        });
                    }
                }
                const passedTests = diagnostics.results.filter((r) => r.status === 'PASS').length;
                const totalTests = diagnostics.results.length;
                return Object.assign(Object.assign({}, diagnostics), { summary: {
                        overall: passedTests === totalTests ? 'PASS' : 'FAIL',
                        passed: passedTests,
                        total: totalTests,
                        environment: this.config.environment
                    } });
            }
            catch (error) {
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
        });
    }
    getSettings(companyCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                // Get account settings
                const accountResult = yield this.client.getAccount();
                let companySettings = null;
                if (finalCompanyCode) {
                    try {
                        companySettings = yield this.client.getCompany(finalCompanyCode);
                    }
                    catch (error) {
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
                        subscriptions: ((_a = accountResult.subscriptions) === null || _a === void 0 ? void 0 : _a.map((sub) => ({
                            subscriptionTypeId: sub.subscriptionTypeId,
                            subscriptionDescription: sub.subscriptionDescription,
                            effectiveDate: sub.effectiveDate,
                            endDate: sub.endDate
                        }))) || []
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    bulkTaxCalculation(companyCode, transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalCompanyCode = companyCode || this.config.companyCode;
                if (!finalCompanyCode) {
                    throw new Error('Company code is required for bulk tax calculations. Please specify a companyCode parameter.');
                }
                if (!transactions || transactions.length === 0) {
                    throw new Error('At least one transaction is required for bulk tax calculations.');
                }
                const results = [];
                const errors = [];
                // Process transactions in batches for better performance
                const batchSize = 10;
                for (let i = 0; i < transactions.length; i += batchSize) {
                    const batch = transactions.slice(i, i + batchSize);
                    const batchPromises = batch.map((transaction, index) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const model = {
                                type: 'SalesOrder',
                                companyCode: finalCompanyCode,
                                code: transaction.code || `BULK-${i + index + 1}`,
                                date: transaction.date,
                                customerCode: transaction.customerCode,
                                lines: transaction.lines.map((line, lineIndex) => ({
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
                            const result = yield this.client.createTransaction({ model });
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                transactionCode: transaction.code,
                                error: error.message
                            };
                        }
                    }));
                    const batchResults = yield Promise.all(batchPromises);
                    batchResults.forEach(result => {
                        if (result.success) {
                            results.push(result.result);
                        }
                        else {
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
                        totalTax: results.reduce((sum, r) => sum + (r.totalTax || 0), 0),
                        totalAmount: results.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
                    },
                    results: results,
                    errors: errors
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getTaxContent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queryParams = {};
                if (params === null || params === void 0 ? void 0 : params.filter) {
                    queryParams.$filter = params.filter;
                }
                else {
                    // Build filter from individual parameters
                    const filters = [];
                    if (params === null || params === void 0 ? void 0 : params.country)
                        filters.push(`country eq '${params.country}'`);
                    if (params === null || params === void 0 ? void 0 : params.region)
                        filters.push(`region eq '${params.region}'`);
                    if (params === null || params === void 0 ? void 0 : params.taxType)
                        filters.push(`taxType eq '${params.taxType}'`);
                    if (params === null || params === void 0 ? void 0 : params.effectiveDate)
                        filters.push(`effectiveDate eq datetime'${params.effectiveDate}'`);
                    if (filters.length > 0) {
                        queryParams.$filter = filters.join(' and ');
                    }
                }
                const result = yield this.client.queryTaxAuthorities(queryParams);
                return {
                    taxContent: result.value || result,
                    count: result['@recordsetCount'] || result.length || 0
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    // Phase 10: User & Account Management
    listUsers(accountId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for listing users. Please specify an accountId parameter.');
                }
                const queryParams = {};
                if (params === null || params === void 0 ? void 0 : params.filter)
                    queryParams.$filter = params.filter;
                if (params === null || params === void 0 ? void 0 : params.include)
                    queryParams.$include = params.include;
                if (params === null || params === void 0 ? void 0 : params.top)
                    queryParams.$top = params.top;
                if (params === null || params === void 0 ? void 0 : params.skip)
                    queryParams.$skip = params.skip;
                const result = yield this.client.listUsersByAccount(finalAccountId, queryParams);
                return {
                    accountId: finalAccountId,
                    users: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((user) => ({
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
                    }))) || [],
                    count: result['@recordsetCount'] || ((_b = result.value) === null || _b === void 0 ? void 0 : _b.length) || 0
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    createUser(accountId, params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.client.createUsers(finalAccountId, [model]);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getUser(accountId, userId, include) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for getting user details. Please specify an accountId parameter.');
                }
                if (!userId) {
                    throw new Error('User ID is required for getting user details.');
                }
                const result = yield this.client.getUser(finalAccountId, userId, include);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateUser(accountId, userId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for updating users. Please specify an accountId parameter.');
                }
                if (!userId) {
                    throw new Error('User ID is required for updating users.');
                }
                const model = {
                    userName: params === null || params === void 0 ? void 0 : params.userName,
                    firstName: params === null || params === void 0 ? void 0 : params.firstName,
                    lastName: params === null || params === void 0 ? void 0 : params.lastName,
                    email: params === null || params === void 0 ? void 0 : params.email,
                    isActive: params === null || params === void 0 ? void 0 : params.isActive
                };
                // Remove undefined properties
                Object.keys(model).forEach(key => {
                    if (model[key] === undefined) {
                        delete model[key];
                    }
                });
                const result = yield this.client.updateUser(finalAccountId, userId, model);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    deleteUser(accountId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for deleting users. Please specify an accountId parameter.');
                }
                if (!userId) {
                    throw new Error('User ID is required for deleting users.');
                }
                const result = yield this.client.deleteUser(finalAccountId, userId);
                return {
                    deleted: true,
                    userId: userId,
                    accountId: finalAccountId
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getAccount(accountId, include) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for getting account details. Please specify an accountId parameter.');
                }
                const result = yield this.client.getAccount(finalAccountId, include);
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
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    updateAccount(accountId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for updating account. Please specify an accountId parameter.');
                }
                const model = {
                    name: params === null || params === void 0 ? void 0 : params.name,
                    effectiveDate: params === null || params === void 0 ? void 0 : params.effectiveDate,
                    endDate: params === null || params === void 0 ? void 0 : params.endDate,
                    accountStatusId: params === null || params === void 0 ? void 0 : params.accountStatusId
                };
                // Remove undefined properties
                Object.keys(model).forEach(key => {
                    if (model[key] === undefined) {
                        delete model[key];
                    }
                });
                const result = yield this.client.updateAccount(finalAccountId, model);
                return {
                    id: result.id,
                    name: result.name,
                    effectiveDate: result.effectiveDate,
                    endDate: result.endDate,
                    accountStatusId: result.accountStatusId,
                    updated: true
                };
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    getSubscriptions(accountId, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const finalAccountId = accountId || this.config.accountId;
                if (!finalAccountId) {
                    throw new Error('Account ID is required for getting subscriptions. Please specify an accountId parameter.');
                }
                const queryParams = {};
                if (filter)
                    queryParams.$filter = filter;
                const result = yield this.client.listSubscriptionsByAccount(finalAccountId, queryParams);
                return {
                    accountId: finalAccountId,
                    subscriptions: ((_a = result.value) === null || _a === void 0 ? void 0 : _a.map((subscription) => ({
                        id: subscription.id,
                        accountId: subscription.accountId,
                        subscriptionTypeId: subscription.subscriptionTypeId,
                        subscriptionDescription: subscription.subscriptionDescription,
                        effectiveDate: subscription.effectiveDate,
                        endDate: subscription.endDate,
                        serviceTypeId: subscription.serviceTypeId,
                        serviceVersion: subscription.serviceVersion,
                        isActive: subscription.isActive
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
