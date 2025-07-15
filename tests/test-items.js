// Test item endpoints specifically
const { spawn } = require('child_process');
const path = require('path');

const testConfig = {
    AVATAX_ACCOUNT_ID: '1100016564',
    AVATAX_LICENSE_KEY: '6BF9BDC3DB544D18',
    AVATAX_ENVIRONMENT: 'sandbox',
    AVATAX_COMPANY_CODE: 'DEFAULT', // Use a default company
    AVATAX_APP_NAME: 'AvaTax-MCP-Test',
    AVATAX_TIMEOUT: '30000'
};

console.log('Testing item endpoints...');

const scriptPath = path.resolve(__dirname, '..', 'dist', 'index.js');
console.log('Script path:', scriptPath);

const child = spawn('node', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...testConfig }
});

// Send a test request to list items
const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
        name: 'list_items_by_company',
        arguments: {
            companyCode: 'DEFAULT',
            top: 5
        }
    }
};

child.stdin.write(JSON.stringify(testRequest) + '\n');

let response = '';
child.stdout.on('data', (data) => {
    response += data.toString();
    console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
    console.log(`--- Process exited with code: ${code} ---`);
    
    if (code === 0) {
        console.log('✅ Item endpoint test completed successfully');
    } else {
        console.log('❌ Item endpoint test failed');
    }
    
    try {
        if (response.trim()) {
            const parsed = JSON.parse(response.trim());
            console.log('Response:', JSON.stringify(parsed, null, 2));
        }
    } catch (e) {
        console.log('Could not parse response as JSON');
    }
});

setTimeout(() => {
    child.kill();
    console.log('Test completed, stopping server...');
}, 10000);
