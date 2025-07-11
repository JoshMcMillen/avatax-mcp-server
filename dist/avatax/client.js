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
const config_js_1 = require("./config.js");
const axios_1 = __importDefault(require("axios"));
class AvataxClient {
    constructor(config) {
        this.config = config;
        const credentials = Buffer.from(`${config.accountId}:${config.licenseKey}`).toString('base64');
        this.client = axios_1.default.create({
            baseURL: config_js_1.AVATAX_ENDPOINTS[config.environment],
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Avalara-Client': `${config.appName}; ${config.appVersion}; MCP; ${config.machineName}`
            }
        });
        // Add retry interceptor for rate limiting
        this.client.interceptors.response.use(response => response, error => {
            var _a;
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
                const retryAfter = error.response.headers['retry-after'];
                throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
            }
            throw error;
        });
    }
    sendRequest(endpoint, method, body) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.request({
                    url: endpoint,
                    method: method,
                    data: body
                });
                return response.data;
            }
            catch (error) {
                this.handleError(error);
            }
        });
    }
    handleError(error) {
        var _a, _b, _c;
        if (axios_1.default.isAxiosError(error)) {
            const errorData = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
            let errorMessage = `AvaTax API Error (${((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 'Unknown'}): ${error.message}`;
            if (errorData === null || errorData === void 0 ? void 0 : errorData.error) {
                errorMessage = `AvaTax Error: ${errorData.error.message || errorData.error}`;
                // Include detailed error information if available
                if (errorData.error.details && Array.isArray(errorData.error.details)) {
                    const details = errorData.error.details.map((d) => `  - ${d.message || d.description} ${d.code ? `(${d.code})` : ''}`).join('\n');
                    errorMessage += '\nDetails:\n' + details;
                }
            }
            if (((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 429) {
                const retryAfter = error.response.headers['retry-after'];
                errorMessage = `AvaTax API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`;
            }
            throw new Error(errorMessage);
        }
        throw new Error(`Network Error: ${error.message}`);
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
            // Set default values
            const data = Object.assign(Object.assign({}, transactionData), { companyCode: transactionData.companyCode || this.config.companyCode });
            // Validate before sending
            this.validateTransactionData(data);
            return this.sendRequest('/api/v2/transactions/create', 'POST', data);
        });
    }
    validateAddress(addressData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendRequest('/api/v2/addresses/resolve', 'POST', addressData);
        });
    }
    createTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set default values
            const data = Object.assign({ type: transactionData.type || 'SalesInvoice', companyCode: transactionData.companyCode || this.config.companyCode, commit: transactionData.commit !== false }, transactionData);
            // Validate before sending
            this.validateTransactionData(data);
            return this.sendRequest('/api/v2/transactions/create', 'POST', data);
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendRequest('/api/v2/utilities/ping', 'GET');
        });
    }
}
exports.default = AvataxClient;
