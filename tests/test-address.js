// Combined address validation tests
const AvataxClient = require('./dist/avatax/client.js').default;

const config = {
    accountId: '1100016564',
    licenseKey: '6BF9BDC3DB544D18',
    environment: 'sandbox',
    appName: 'AvaTax-MCP-Test',
    appVersion: '1.0.0'
};

const client = new AvataxClient(config);

async function testAddressValidation() {
    try {
        console.log('Testing address validation...');
        
        // Test with a valid address
        const testAddress = {
            line1: '3497 Bethel Road SE',
            city: 'Port Orchard',
            region: 'WA',
            postalCode: '98366',
            country: 'US'
        };
        
        console.log('Input address:', testAddress);
        
        const result = await client.validateAddress(testAddress);
        
        console.log('\n--- Address Validation Result ---');
        console.log('Valid:', result.valid);
        
        if (result.valid) {
            console.log('Normalized Address:');
            console.log('  Line 1:', result.normalized.line1);
            console.log('  City:', result.normalized.city);
            console.log('  Region:', result.normalized.region);
            console.log('  Postal Code:', result.normalized.postalCode);
            console.log('  Country:', result.normalized.country);
            
            if (result.coordinates) {
                console.log('Coordinates:');
                console.log('  Latitude:', result.coordinates.latitude);
                console.log('  Longitude:', result.coordinates.longitude);
            }
        }
        
        if (result.messages && result.messages.length > 0) {
            console.log('Messages:');
            result.messages.forEach(msg => console.log('  -', msg));
        }
        
        if (result.errors && result.errors.length > 0) {
            console.log('Errors:');
            result.errors.forEach(err => console.log('  -', err));
        }
        
        console.log('\n✅ Address validation test completed successfully!');
        
    } catch (error) {
        console.error('❌ Address validation test failed:', error.message);
        process.exit(1);
    }
}

testAddressValidation();
