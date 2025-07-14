// Test different parameter formats for createTransaction
const AvataxClient = require('./dist/avatax/client.js').default;

const config = {
    accountId: '1100016564',
    licenseKey: '6BF9BDC3DB544D18',
    environment: 'sandbox',
    appName: 'AvaTax-MCP-Test',
    appVersion: '1.0.0',
    companyCode: 'DEFAULT'
};

const client = new AvataxClient(config);

async function testParameterFormats() {
    try {
        console.log('Testing ping first...');
        const pingResult = await client.ping();
        console.log('Ping result:', pingResult);
        
        // Get companies to see valid company codes
        console.log('\nGetting companies...');
        const companiesResult = await client.getCompanies();
        console.log('Companies found:', companiesResult.count);
        if (companiesResult.companies.length > 0) {
            console.log('First company:', companiesResult.companies[0]);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testParameterFormats();
