"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVATAX_ENDPOINTS = void 0;
exports.getBaseUrl = getBaseUrl;
exports.createAvaTaxConfig = createAvaTaxConfig;
exports.AVATAX_ENDPOINTS = {
    sandbox: 'https://sandbox-rest.avatax.com',
    production: 'https://rest.avatax.com'
};
function getBaseUrl(environment) {
    return exports.AVATAX_ENDPOINTS[environment];
}
function createAvaTaxConfig() {
    const environment = (process.env.AVATAX_ENVIRONMENT || 'sandbox');
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
