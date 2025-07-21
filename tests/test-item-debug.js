// Debug test for item endpoints
const { spawn } = require('child_process');
const path = require('path');

const testConfig = {
    AVATAX_ACCOUNT_ID: '1100016564',
    AVATAX_LICENSE_KEY: '6BF9BDC3DB544D18',
    AVATAX_ENVIRONMENT: 'sandbox',
    AVATAX_COMPANY_CODE: '', // Test with empty company code
    AVATAX_APP_NAME: 'AvaTax-MCP-Test',
    AVATAX_TIMEOUT: '30000'
};

console.log('Testing item endpoints with debug info...');

const scriptPath = path.join(__dirname, 'dist', 'index.js');

const child = spawn('node', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...testConfig }
});

// Send test requests
const testRequests = [
    // First get companies to see what's available
    {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: 'get_companies',
            arguments: {}
        }
    },
    // Test list_items_by_company
    {
        jsonrpc: '2.0', 
        id: 2,
        method: 'tools/call',
        params: {
            name: 'list_items_by_company',
            arguments: {
                companyCode: 'DEFAULT',
                top: 5
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
        }, 1000);
    } else {
        setTimeout(() => {
            child.kill();
        }, 2000);
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
