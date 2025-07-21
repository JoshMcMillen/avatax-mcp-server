// Test item endpoints with an existing company
const { spawn } = require('child_process');
const path = require('path');

const testConfig = {
    AVATAX_ACCOUNT_ID: '1100016564',
    AVATAX_LICENSE_KEY: '6BF9BDC3DB544D18',
    AVATAX_ENVIRONMENT: 'sandbox',
    AVATAX_COMPANY_CODE: '', 
    AVATAX_APP_NAME: 'AvaTax-MCP-Test',
    AVATAX_TIMEOUT: '30000'
};

console.log('Testing item endpoints with existing company...');

const scriptPath = path.join(__dirname, 'dist', 'index.js');

const child = spawn('node', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...testConfig }
});

// Test requests using a real company from the list
const testRequests = [
    // Test list_items_by_company with existing company "ABC"
    {
        jsonrpc: '2.0', 
        id: 1,
        method: 'tools/call',
        params: {
            name: 'list_items_by_company',
            arguments: {
                companyCode: 'ABC',
                top: 5
            }
        }
    },
    // Test create_items
    {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
            name: 'create_items',
            arguments: {
                companyCode: 'ABC',
                items: [{
                    itemCode: 'TEST-ITEM-001',
                    description: 'Test Item for MCP'
                }]
            }
        }
    }
];

let requestIndex = 0;

child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('RESPONSE:', output);
    
    if (requestIndex < testRequests.length) {
        setTimeout(() => {
            const request = JSON.stringify(testRequests[requestIndex]) + '\n';
            console.log(`Sending request ${requestIndex + 1}:`, request);
            child.stdin.write(request);
            requestIndex++;
        }, 2000);
    } else {
        setTimeout(() => {
            child.kill();
        }, 3000);
    }
});

child.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
    console.log(`Test completed with exit code ${code}`);
});

// Send initial request after a short delay
setTimeout(() => {
    const request = JSON.stringify(testRequests[0]) + '\n';
    console.log('Sending initial request:', request);
    child.stdin.write(request);
    requestIndex++;
}, 1000);
