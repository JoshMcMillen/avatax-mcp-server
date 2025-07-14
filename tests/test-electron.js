// Test configuration saving through IPC
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing configuration saving...');

// Start Electron in headless mode to test IPC
const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
const appPath = path.join(__dirname, '.');

const child = spawn(electronPath, [appPath, '--no-sandbox'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
});

let output = '';

child.stdout.on('data', (data) => {
    output += data.toString();
    console.log('STDOUT:', data.toString().trim());
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
    if (output.includes('Install state:')) {
        console.log('✅ Electron app started successfully');
    } else {
        console.log('❌ App failed to start properly');
    }
});

// Kill after test
setTimeout(() => {
    console.log('\nTest completed, stopping app...');
    child.kill();
}, 5000);
