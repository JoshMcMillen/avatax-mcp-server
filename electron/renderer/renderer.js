// Tab management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to the corresponding tab button
    const targetTab = document.querySelector(`button[onclick="showTab('${tabName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// Configuration management
let currentConfig = {};

// Load configuration on startup
window.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
    getServerStatus();
    
    // Listen for install state updates from main process
    window.mcp.onInstallState((installState) => {
        handleInstallState(installState);
    });
    
    // Add real-time config generation as user types
    const configInputs = ['accountId', 'licenseKey', 'companyCode', 'environment', 'appName', 'timeout'];
    configInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updateClaudeConfigPreview);
            input.addEventListener('change', updateClaudeConfigPreview);
        }
    });
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
        generateClaudeConfig(config);
    }).catch(error => {
        showStatus('No saved configuration found', 'info');
        hideClaudeConfig();
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
        generateClaudeConfig(config);
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
            hideClaudeConfig();
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

// Claude Desktop Configuration Generation
function updateClaudeConfigPreview() {
    const config = {
        AVATAX_ACCOUNT_ID: document.getElementById('accountId').value,
        AVATAX_LICENSE_KEY: document.getElementById('licenseKey').value,
        AVATAX_COMPANY_CODE: document.getElementById('companyCode').value || 'DEFAULT',
        AVATAX_ENVIRONMENT: document.getElementById('environment').value,
        AVATAX_APP_NAME: document.getElementById('appName').value || 'AvaTax-MCP-Server',
        AVATAX_TIMEOUT: document.getElementById('timeout').value || '30000'
    };
    
    generateClaudeConfig(config);
}

function generateClaudeConfig(config) {
    if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY || !config.AVATAX_COMPANY_CODE) {
        hideClaudeConfig();
        return;
    }
    
    // Get the actual application path
    const appPath = process.platform === 'win32' 
        ? `${process.env.LOCALAPPDATA}\\Programs\\AvaTax MCP Server\\resources\\app.asar\\dist\\index.js`
        : `${process.env.HOME}/Applications/AvaTax MCP Server.app/Contents/Resources/app.asar/dist/index.js`;
    
    const claudeConfig = {
        "mcpServers": {
            "avatax": {
                "command": "node",
                "args": [appPath],
                "env": {
                    "AVATAX_ACCOUNT_ID": config.AVATAX_ACCOUNT_ID,
                    "AVATAX_LICENSE_KEY": config.AVATAX_LICENSE_KEY,
                    "AVATAX_COMPANY_CODE": config.AVATAX_COMPANY_CODE,
                    "AVATAX_ENVIRONMENT": config.AVATAX_ENVIRONMENT,
                    "AVATAX_APP_NAME": config.AVATAX_APP_NAME,
                    "AVATAX_TIMEOUT": config.AVATAX_TIMEOUT
                }
            }
        }
    };
    
    const configText = JSON.stringify(claudeConfig, null, 2);
    document.getElementById('claudeConfigOutput').textContent = configText;
    showClaudeConfig();
}

function showClaudeConfig() {
    const section = document.getElementById('claudeConfigSection');
    section.classList.remove('hidden');
}

function hideClaudeConfig() {
    const section = document.getElementById('claudeConfigSection');
    section.classList.add('hidden');
}

function copyClaudeConfig() {
    const configText = document.getElementById('claudeConfigOutput').textContent;
    const copyBtn = document.querySelector('.copy-btn');
    
    navigator.clipboard.writeText(configText).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = configText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    });
}

// Handle install state from main process
function handleInstallState(installState) {
    // Show appropriate welcome message but don't force tab switching
    let message = '';
    let messageType = 'info';
    
    if (installState.isFirstRun) {
        message = '🎉 Welcome to AvaTax MCP Server! Navigate to the Configuration tab to set up your AvaTax credentials.';
        messageType = 'info';
    } else if (installState.isPostUpgrade) {
        if (installState.fromVersion) {
            message = `✅ Successfully upgraded from version ${installState.fromVersion}! The app is ready to use.`;
        } else {
            message = '✅ AvaTax MCP Server has been upgraded! The app is ready to use.';
        }
        messageType = 'success';
    }
    
    if (message) {
        // Show the message on the currently active tab
        showStatus(message, messageType);
    }
}

const sensitiveEnvVars = ['API_KEY', 'SECRET_KEY'];
console.log('Sensitive environment variables are not exposed.');
