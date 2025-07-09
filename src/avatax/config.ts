export interface AvaTaxConfig {
    accountId: string;
    licenseKey: string;
    environment: 'sandbox' | 'production';
    companyCode: string;
    appName?: string;
    appVersion?: string;
    machineName?: string;
    timeout?: number;
}

export const AVATAX_ENDPOINTS = {
    sandbox: 'https://sandbox-rest.avatax.com',
    production: 'https://rest.avatax.com'
};

export function getBaseUrl(environment: 'sandbox' | 'production'): string {
    return AVATAX_ENDPOINTS[environment];
}

export function createAvaTaxConfig(): AvaTaxConfig {
    const environment = (process.env.AVATAX_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
    
    if (!process.env.AVATAX_ACCOUNT_ID || !process.env.AVATAX_LICENSE_KEY) {
        throw new Error('AVATAX_ACCOUNT_ID and AVATAX_LICENSE_KEY environment variables are required');
    }
    
    return {
        accountId: process.env.AVATAX_ACCOUNT_ID,
        licenseKey: process.env.AVATAX_LICENSE_KEY,
        environment,
        companyCode: process.env.AVATAX_COMPANY_CODE || 'DEFAULT',
        appName: process.env.AVATAX_APP_NAME || 'AvaTax-MCP-Server',
        appVersion: process.env.AVATAX_APP_VERSION || '1.0.0',
        machineName: process.env.AVATAX_MACHINE_NAME || 'MCP-Server',
        timeout: parseInt(process.env.AVATAX_TIMEOUT || '30000')
    };
}

// Legacy export for backward compatibility
export const avataxConfig = {
    apiKey: process.env.AVATAX_API_KEY || '',
    endpoint: process.env.AVATAX_ENDPOINT || 'https://api.avatax.com',
    accountId: process.env.AVATAX_ACCOUNT_ID || '',
    companyCode: process.env.AVATAX_COMPANY_CODE || '',
    environment: process.env.AVATAX_ENVIRONMENT || 'production',
};