// Test script to verify AvaTax connection
const https = require('https');

const config = {
    AVATAX_ACCOUNT_ID: '1100016564',
    AVATAX_LICENSE_KEY: '6BF9BDC3DB544D18',
    AVATAX_ENVIRONMENT: 'sandbox'
};

const baseUrl = config.AVATAX_ENVIRONMENT === 'production' 
    ? 'https://rest.avatax.com'
    : 'https://sandbox-rest.avatax.com';

const credentials = Buffer.from(`${config.AVATAX_ACCOUNT_ID}:${config.AVATAX_LICENSE_KEY}`).toString('base64');

console.log('Testing connection to:', baseUrl);
console.log('Account ID:', config.AVATAX_ACCOUNT_ID);
console.log('Credentials (base64):', credentials.substring(0, 20) + '...');

const options = {
    hostname: config.AVATAX_ENVIRONMENT === 'production' ? 'rest.avatax.com' : 'sandbox-rest.avatax.com',
    port: 443,
    path: '/api/v2/utilities/ping',
    method: 'GET',
    headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AvaTax-MCP-Test/1.0'
    },
    timeout: 10000
};

console.log('Making request with options:', {
    hostname: options.hostname,
    path: options.path,
    method: options.method
});

const req = https.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response body:', data);
        if (res.statusCode === 200) {
            console.log('✅ Connection successful!');
        } else {
            console.log('❌ Connection failed with status:', res.statusCode);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Request error:', error.message);
});

req.on('timeout', () => {
    console.log('❌ Request timeout');
    req.destroy();
});

req.end();
