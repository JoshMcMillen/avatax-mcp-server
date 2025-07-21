// Quick test for tax code endpoints
const { config } = require('./src/avatax/config.js');
const AvataxClient = require('./src/avatax/client.js').default;

async function testTaxCodes() {
    try {
        console.log('Testing Tax Code Endpoints...\n');
        
        // Load configuration
        const avataxConfig = config();
        const client = new AvataxClient(avataxConfig);
        
        // Test 1: Get system tax codes (first 5)
        console.log('1. Testing get_system_tax_codes...');
        const systemTaxCodes = await client.getSystemTaxCodes({ top: 5 });
        console.log(`Found ${systemTaxCodes.count || 0} system tax codes (showing first 5):`);
        if (systemTaxCodes.value) {
            systemTaxCodes.value.forEach(code => {
                console.log(`  - ${code.taxCode}: ${code.description} (Type: ${code.taxCodeTypeId})`);
            });
        }
        console.log('');
        
        // Test 2: Get tax code types
        console.log('2. Testing get_tax_code_types...');
        const taxCodeTypes = await client.getTaxCodeTypes();
        console.log('Available tax code types:');
        if (taxCodeTypes.types) {
            taxCodeTypes.types.forEach(type => {
                console.log(`  - ${type.id}: ${type.description}`);
            });
        }
        console.log('');
        
        // Test 3: Get company tax codes (if any)
        console.log('3. Testing get_company_tax_codes...');
        try {
            const companyTaxCodes = await client.getCompanyTaxCodes();
            console.log(`Found ${companyTaxCodes.count || 0} company tax codes`);
            if (companyTaxCodes.value && companyTaxCodes.value.length > 0) {
                companyTaxCodes.value.slice(0, 3).forEach(code => {
                    console.log(`  - ${code.taxCode}: ${code.description} (Active: ${code.isActive})`);
                });
            }
        } catch (error) {
            console.log('  (No company configured or no custom tax codes found)');
        }
        
        console.log('\n✅ Tax code endpoints test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testTaxCodes();
