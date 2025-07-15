// Test MCP server with your credentials
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

console.log('Testing MCP server startup...');
console.log('Environment variables will be set for the server');

const scriptPath = path.join(__dirname, '..', 'dist', 'index.js');
console.log('Script path:', scriptPath);

const child = spawn('node', [scriptPath], {
    env: { ...process.env, ...testConfig },
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let hasStarted = false;

child.stdout.on('data', (data) => {
    output += data.toString();
    console.log('STDOUT:', data.toString().trim());
    
    // Check if server has started successfully
    if (data.toString().includes('MCP server')) {
        hasStarted = true;
    }
});

child.stderr.on('data', (data) => {
    output += data.toString();
    console.log('STDERR:', data.toString().trim());
});

child.on('error', (error) => {
    console.log('❌ Process error:', error.message);
});

child.on('exit', (code) => {
    console.log(`\n--- Process exited with code: ${code} ---`);
    if (code === 0 || hasStarted) {
        console.log('✅ MCP server started successfully');
    } else {
        console.log('❌ MCP server failed to start');
        console.log('Output:', output);
    }
});

// Send a test request after a brief delay
setTimeout(() => {
    console.log('\nSending test ping...');
    child.stdin.write(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
    }) + '\n');
    
    // Kill after test
    setTimeout(() => {
        console.log('\nTest completed, stopping server...');
        child.kill();
    }, 2000);
}, 1000);
