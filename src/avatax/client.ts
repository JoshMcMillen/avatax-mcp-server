import { AvaTaxConfig, AVATAX_ENDPOINTS } from './config.js';
import axios, { AxiosInstance } from 'axios';

class AvataxClient {
    private client: AxiosInstance;
    private config: AvaTaxConfig;

    constructor(config: AvaTaxConfig) {
        this.config = config;
        const credentials = Buffer.from(`${config.accountId}:${config.licenseKey}`).toString('base64');
        
        this.client = axios.create({
            baseURL: AVATAX_ENDPOINTS[config.environment],
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'X-Avalara-Client': `${config.appName}; ${config.appVersion}; MCP; ${config.machineName}`
            }
        });

        // Add retry interceptor for rate limiting
        this.client.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 429) {
                    const retryAfter = error.response.headers['retry-after'];
                    throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
                }
                throw error;
            }
        );
    }

    private async sendRequest(endpoint: string, method: string, body?: any) {
        try {
            const response = await this.client.request({
                url: endpoint,
                method: method as any,
                data: body
            });
            return response.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    private handleError(error: any): never {
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data;
            let errorMessage = `AvaTax API Error (${error.response?.status || 'Unknown'}): ${error.message}`;
            
            if (errorData?.error) {
                errorMessage = `AvaTax Error: ${errorData.error.message || errorData.error}`;
                
                // Include detailed error information if available
                if (errorData.error.details && Array.isArray(errorData.error.details)) {
                    const details = errorData.error.details.map((d: any) => 
                        `  - ${d.message || d.description} ${d.code ? `(${d.code})` : ''}`
                    ).join('\n');
                    errorMessage += '\nDetails:\n' + details;
                }
            }
            
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                errorMessage = `AvaTax API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`;
            }
            
            throw new Error(errorMessage);
        }
        throw new Error(`Network Error: ${error.message}`);
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
        // Set default values
        const data = {
            ...transactionData,
            companyCode: transactionData.companyCode || this.config.companyCode
        };
        
        // Validate before sending
        this.validateTransactionData(data);
        
        return this.sendRequest('/api/v2/transactions/create', 'POST', data);
    }

    public async validateAddress(addressData: any) {
        return this.sendRequest('/api/v2/addresses/resolve', 'POST', addressData);
    }

    public async createTransaction(transactionData: any) {
        // Set default values
        const data = {
            type: transactionData.type || 'SalesInvoice',
            companyCode: transactionData.companyCode || this.config.companyCode,
            commit: transactionData.commit !== false, // Default to true
            ...transactionData
        };
        
        // Validate before sending
        this.validateTransactionData(data);
        
        return this.sendRequest('/api/v2/transactions/create', 'POST', data);
    }

    public async ping() {
        return await this.sendRequest('/api/v2/utilities/ping', 'GET');
    }
}

export default AvataxClient;