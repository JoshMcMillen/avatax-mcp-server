// Test script to verify tax calculation works with the fixed SDK usage
const AvataxClient = require('./dist/avatax/client.js').default;

const config = {
    accountId: '1100016564',
    licenseKey: '6BF9BDC3DB544D18',
    environment: 'sandbox',
    appName: 'AvaTax-MCP-Test',
    appVersion: '1.0.0',
    companyCode: 'IBEEAC' // Use the actual company code from the sandbox
};

const client = new AvataxClient(config);

async function testTaxCalculation() {
    try {
        console.log('Testing tax calculation...');
        
        // Test with a simple transaction
        const testTransaction = {
            date: '2024-01-15',
            customerCode: 'TEST_CUSTOMER',
            lines: [{
                amount: 100.00,
                description: 'Test Item',
                quantity: 1
            }],
            shipFrom: {
                line1: '123 Main St',
                city: 'Seattle',
                region: 'WA',
                postalCode: '98101',
                country: 'US'
            },
            shipTo: {
                line1: '456 Oak Ave',
                city: 'Portland',
                region: 'OR',
                postalCode: '97205',
                country: 'US'
            }
        };
        
        console.log('Input transaction:', JSON.stringify(testTransaction, null, 2));
        
        const result = await client.calculateTax(testTransaction);
        
        console.log('\n--- Tax Calculation Result ---');
        console.log('Total Amount:', result.totalAmount);
        console.log('Total Tax:', result.totalTax);
        console.log('Total Taxable:', result.totalTaxable);
        console.log('Status:', result.status);
        console.log('Tax Date:', result.taxDate);
        
        if (result.lines && result.lines.length > 0) {
            console.log('\nLine Details:');
            result.lines.forEach((line, index) => {
                console.log(`  Line ${index + 1}:`);
                console.log(`    Amount: ${line.lineAmount}`);
                console.log(`    Tax: ${line.tax}`);
                console.log(`    Taxable: ${line.taxableAmount}`);
            });
        }
        
        console.log('\n✅ Tax calculation test completed successfully!');
        
    } catch (error) {
        console.error('❌ Tax calculation test failed:', error.message);
        process.exit(1);
    }
}

testTaxCalculation();
