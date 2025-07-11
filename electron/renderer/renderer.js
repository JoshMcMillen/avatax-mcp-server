// Tab management
function showTab(event, tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Configuration management
let currentConfig = {};

// Load configuration on startup
window.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
    getServerStatus();
});

function loadConfiguration() {
    window.mcp.loadConfig().then(config => {
        currentConfig = config;
        if (config.AVATAX_ACCOUNT_ID) document.getElementById('accountId').value = config.AVATAX_ACCOUNT_ID;
        if (config.AVATAX_LICENSE_KEY) document.getElementById('licenseKey').value = config.AVATAX_LICENSE_KEY;
        if (config.AVATAX_COMPANY_CODE) document.getElementById('companyCode').value = config.AVATAX_COMPANY_CODE;
        if (config.AVATAX_ENVIRONMENT) document.getElementById('environment').value = config.AVATAX_ENVIRONMENT;
        if (config.AVATAX_APP_NAME) document.getElementById('appName').value = config.AVATAX_APP_NAME;
        if (config.AVATAX_TIMEOUT) document.getElementById('timeout').value = config.AVATAX_TIMEOUT;
        
        showStatus('Configuration loaded successfully', 'success');
    }).catch(error => {
        showStatus('No saved configuration found', 'info');
    });
}

function saveConfiguration() {
    const config = {
        AVATAX_ACCOUNT_ID: document.getElementById('accountId').value,
        AVATAX_LICENSE_KEY: document.getElementById('licenseKey').value,
        AVATAX_COMPANY_CODE: document.getElementById('companyCode').value || 'DEFAULT',
        AVATAX_ENVIRONMENT: document.getElementById('environment').value,
        AVATAX_APP_NAME: document.getElementById('appName').value || 'AvaTax-MCP-Server',
        AVATAX_TIMEOUT: document.getElementById('timeout').value || '30000'
    };
    
    currentConfig = config;
    
    window.mcp.saveConfig(config).then(() => {
        showStatus('Configuration saved successfully!', 'success');
    }).catch(error => {
        showStatus(`Failed to save configuration: ${error.message}`, 'error');
    });
}

function clearConfiguration() {
    if (confirm('Are you sure you want to clear all configuration? This action cannot be undone.')) {
        document.getElementById('configForm').reset();
        window.mcp.clearConfig().then(() => {
            showStatus('Configuration cleared', 'warning');
            currentConfig = {};
        }).catch(error => {
            showStatus(`Failed to clear configuration: ${error.message}`, 'error');
        });
    }
}

function testConnection() {
    const config = {
        AVATAX_ACCOUNT_ID: document.getElementById('accountId').value,
        AVATAX_LICENSE_KEY: document.getElementById('licenseKey').value,
        AVATAX_ENVIRONMENT: document.getElementById('environment').value
    };
    
    if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY) {
        showStatus('Account ID and License Key are required for testing', 'error');
        return;
    }
    
    showStatus('Testing connection...', 'info');
    
    window.mcp.testConnection(config).then(result => {
        if (result.success) {
            showStatus('✅ Connection successful! AvaTax API is responding correctly.', 'success');
        } else {
            showStatus(`❌ Connection failed: ${result.error}`, 'error');
        }
    }).catch(error => {
        showStatus(`❌ Connection test failed: ${error.message}`, 'error');
    });
}

// Form submission handler
document.getElementById('configForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveConfiguration();
});

// Server management
let isServerRunning = false;

function startServer() {
    if (!currentConfig.AVATAX_ACCOUNT_ID || !currentConfig.AVATAX_LICENSE_KEY) {
        showServerStatus('Please configure your AvaTax credentials first', 'error');
        return;
    }
    
    const startBtn = document.querySelector('button[onclick="startServer()"]');
    const startBtnText = document.getElementById('startBtnText');
    
    startBtn.disabled = true;
    startBtnText.textContent = 'Starting...';
    
    clearServerOutput();
    
    window.mcp.launch(currentConfig).then(result => {
        if (result.success) {
            isServerRunning = true;
            showServerStatus('✅ MCP Server started successfully! You can now use it with Claude Desktop.', 'success');
            startBtnText.textContent = 'Server Running';
        } else {
            showServerStatus(`❌ Failed to start server: ${result.error}`, 'error');
            startBtn.disabled = false;
            startBtnText.textContent = 'Start MCP Server';
        }
    }).catch(error => {
        showServerStatus(`❌ Server startup failed: ${error.message}`, 'error');
        startBtn.disabled = false;
        startBtnText.textContent = 'Start MCP Server';
    });
}

function stopServer() {
    window.mcp.stop().then(result => {
        if (result.success) {
            isServerRunning = false;
            showServerStatus('Server stopped', 'warning');
            
            const startBtn = document.querySelector('button[onclick="startServer()"]');
            const startBtnText = document.getElementById('startBtnText');
            startBtn.disabled = false;
            startBtnText.textContent = 'Start MCP Server';
        } else {
            showServerStatus(`Failed to stop server: ${result.error}`, 'error');
        }
    }).catch(error => {
        showServerStatus(`Stop command failed: ${error.message}`, 'error');
    });
}

function getServerStatus() {
    window.mcp.getStatus().then(status => {
        isServerRunning = status.running;
        
        const startBtn = document.querySelector('button[onclick="startServer()"]');
        const startBtnText = document.getElementById('startBtnText');
        
        if (status.running) {
            showServerStatus('✅ Server is currently running', 'success');
            startBtn.disabled = true;
            startBtnText.textContent = 'Server Running';
        } else {
            showServerStatus('Server is not running', 'info');
            startBtn.disabled = false;
            startBtnText.textContent = 'Start MCP Server';
        }
    }).catch(error => {
        showServerStatus('Unable to get server status', 'warning');
    });
}

// Output handling
function clearServerOutput() {
    const outputDiv = document.getElementById('serverOutput');
    outputDiv.innerHTML = '';
}

// Server output handlers
if (window.mcp) {
    window.mcp.onServerOutput((data) => {
        const outputDiv = document.getElementById('serverOutput');
        outputDiv.innerHTML += data.replace(/\n/g, '\n');
        outputDiv.scrollTop = outputDiv.scrollHeight;
    });

    window.mcp.onServerError((data) => {
        const outputDiv = document.getElementById('serverOutput');
        outputDiv.innerHTML += `ERROR: ${data.replace(/\n/g, '\n')}`;
        outputDiv.scrollTop = outputDiv.scrollHeight;
    });

    window.mcp.onServerExit((code) => {
        isServerRunning = false;
        const outputDiv = document.getElementById('serverOutput');
        outputDiv.innerHTML += `\nServer exited with code ${code}\n`;
        
        showServerStatus(`Server stopped (exit code: ${code})`, 'warning');
        
        const startBtn = document.querySelector('button[onclick="startServer()"]');
        const startBtnText = document.getElementById('startBtnText');
        startBtn.disabled = false;
        startBtnText.textContent = 'Start MCP Server';
    });
}

// Utility functions
function showStatus(message, type) {
    const statusDiv = document.getElementById('configStatus');
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
}

function showServerStatus(message, type) {
    const statusDiv = document.getElementById('serverStatus');
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (statusDiv.innerHTML.includes(message)) {
                statusDiv.innerHTML = '';
            }
        }, 5000);
    }
}
