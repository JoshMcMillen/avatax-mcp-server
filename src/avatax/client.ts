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

    public async calculateTax(transactionData: any) {
        // Ensure companyCode is set if not provided
        if (!transactionData.companyCode) {
            transactionData.companyCode = this.config.companyCode;
        }
        return this.sendRequest('/api/v2/transactions/create', 'POST', transactionData);
    }

    public async validateAddress(addressData: any) {
        return this.sendRequest('/api/v2/addresses/resolve', 'POST', addressData);
    }

    public async createTransaction(transactionData: any) {
        // Ensure companyCode is set if not provided
        if (!transactionData.companyCode) {
            transactionData.companyCode = this.config.companyCode;
        }
        return this.sendRequest('/api/v2/transactions/create', 'POST', transactionData);
    }
}

export default AvataxClient;