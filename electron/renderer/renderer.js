// Dark mode toggle functionality
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('#themeToggle');
    
    if (themeToggle.checked) {
        body.dataset.theme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        body.dataset.theme = 'light';
        localStorage.setItem('theme', 'light');
    }
    
    // Add smooth transition effect
    body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        body.style.transition = '';
    }, 300);
}

// Load saved theme on startup
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeToggle = document.querySelector('#themeToggle');
    
    body.dataset.theme = savedTheme;
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
}

// Interactive feature cards
function showFeatureDetails(featureId) {
    const detailsElement = document.getElementById(featureId + '-details');
    if (detailsElement) {
        if (detailsElement.classList.contains('hidden')) {
            // Hide all other details first
            const allDetails = document.querySelectorAll('.feature-details');
            allDetails.forEach(detail => detail.classList.add('hidden'));
            
            // Show the selected details
            detailsElement.classList.remove('hidden');
        } else {
            // Hide if already visible
            detailsElement.classList.add('hidden');
        }
    }
}

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
    loadTheme(); // Load theme first
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
        updateDocumentationTabs(); // Update dynamic documentation
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
        updateDocumentationTabs(); // Update dynamic documentation
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
            updateDocumentationTabs(); // Update dynamic documentation
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
    if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY) {
        hideClaudeConfig();
        return;
    }
    
    // Get the actual application path
    const appPath = window.mcp.platform === 'win32' 
        ? `${window.mcp.homedir}\\AppData\\Local\\Programs\\AvaTax MCP Server\\resources\\app.asar\\dist\\index.js`
        : `${window.mcp.homedir}/Applications/AvaTax MCP Server.app/Contents/Resources/app.asar/dist/index.js`;
    
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

// Documentation tab management
function showSetupTab(tabName) {
    // Hide all setup content sections
    const setupContents = document.querySelectorAll('.setup-content');
    setupContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all setup tabs
    const setupTabs = document.querySelectorAll('.setup-tab');
    setupTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected setup content
    const targetContent = document.getElementById(`${tabName}-setup`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Add active class to the corresponding setup tab button
    const targetTab = document.querySelector(`button[onclick="showSetupTab('${tabName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// Platform tab management (within setup tabs)
function showPlatformTab(groupPrefix, platformName) {
    // Hide all platform content sections for this group
    const platformContents = document.querySelectorAll(`[id^="${groupPrefix}-"]`);
    platformContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all platform tabs for this group
    const platformTabs = document.querySelectorAll(`button[onclick*="showPlatformTab('${groupPrefix}'"]`);
    platformTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected platform content
    const targetContent = document.getElementById(`${groupPrefix}-${platformName}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Add active class to the corresponding platform tab button
    const targetTab = document.querySelector(`button[onclick="showPlatformTab('${groupPrefix}', '${platformName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// API Group toggle functionality
function toggleApiGroup(groupId) {
    const group = document.getElementById(groupId);
    const groupContainer = group.closest('.api-group');
    
    if (group.classList.contains('expanded')) {
        group.classList.remove('expanded');
        groupContainer.classList.remove('expanded');
    } else {
        // Close all other groups first (accordion behavior)
        document.querySelectorAll('.api-group-content').forEach(content => {
            content.classList.remove('expanded');
            content.closest('.api-group').classList.remove('expanded');
        });
        
        // Open the selected group
        group.classList.add('expanded');
        groupContainer.classList.add('expanded');
    }
}

// Dynamic documentation generation functions
function generateVSCodeConfig(config) {
    if (!config || !config.AVATAX_ACCOUNT_ID) return '';
    
    const vsCodeConfig = {
        "avatax": {
            "command": "node",
            "args": [`"${getApplicationPath()}/resources/app.asar/dist/index.js"`],
            "env": {
                "AVATAX_ACCOUNT_ID": config.AVATAX_ACCOUNT_ID,
                "AVATAX_LICENSE_KEY": config.AVATAX_LICENSE_KEY,
                "AVATAX_COMPANY_CODE": config.AVATAX_COMPANY_CODE || "DEFAULT",
                "AVATAX_ENVIRONMENT": config.AVATAX_ENVIRONMENT || "sandbox",
                "AVATAX_APP_NAME": config.AVATAX_APP_NAME || "AvaTax-MCP-Server",
                "AVATAX_TIMEOUT": config.AVATAX_TIMEOUT || "30000"
            }
        }
    };
    
    return JSON.stringify(vsCodeConfig, null, 2);
}

function generateChatGPTConfig(config) {
    if (!config || !config.AVATAX_ACCOUNT_ID) return '';
    
    const chatGPTConfig = {
        "mcp_servers": {
            "avatax": {
                "command": "node",
                "args": [`"${getApplicationPath()}/resources/app.asar/dist/index.js"`],
                "cwd": getApplicationPath(),
                "env": {
                    "AVATAX_ACCOUNT_ID": config.AVATAX_ACCOUNT_ID,
                    "AVATAX_LICENSE_KEY": config.AVATAX_LICENSE_KEY,
                    "AVATAX_COMPANY_CODE": config.AVATAX_COMPANY_CODE || "DEFAULT",
                    "AVATAX_ENVIRONMENT": config.AVATAX_ENVIRONMENT || "sandbox"
                }
            }
        }
    };
    
    return JSON.stringify(chatGPTConfig, null, 2);
}

function updateDocumentationTabs() {
    const config = currentConfig;
    const hasConfig = config && config.AVATAX_ACCOUNT_ID;
    
    // Update VS Code tab with dynamic configuration
    const vsCodeConfigElement = document.querySelector('#vscode-setup pre code');
    const vsCodeNotice = document.getElementById('vscode-config-notice');
    if (vsCodeConfigElement) {
        if (hasConfig) {
            vsCodeConfigElement.textContent = generateVSCodeConfig(config);
            if (vsCodeNotice) vsCodeNotice.style.display = 'none';
        } else {
            if (vsCodeNotice) vsCodeNotice.style.display = 'block';
        }
    }
    
    // Update ChatGPT tab with dynamic configuration
    const chatGPTConfigElement = document.querySelector('#chatgpt-setup pre code');
    const chatGPTNotice = document.getElementById('chatgpt-config-notice');
    if (chatGPTConfigElement) {
        if (hasConfig) {
            chatGPTConfigElement.textContent = generateChatGPTConfig(config);
            if (chatGPTNotice) chatGPTNotice.style.display = 'none';
        } else {
            if (chatGPTNotice) chatGPTNotice.style.display = 'block';
        }
    }
    
    // Add dynamic status indicators
    updateTabStatusIndicators(config);
}

function updateTabStatusIndicators(config) {
    const hasConfig = config && config.AVATAX_ACCOUNT_ID;
    
    // Update tab labels with status
    const vsCodeTab = document.querySelector('button[onclick="showSetupTab(\'vscode\')"]');
    const chatGPTTab = document.querySelector('button[onclick="showSetupTab(\'chatgpt\')"]');
    
    if (vsCodeTab) {
        vsCodeTab.innerHTML = hasConfig ? 'VS Code ✅' : 'VS Code';
    }
    
    if (chatGPTTab) {
        chatGPTTab.innerHTML = hasConfig ? 'ChatGPT ✅' : 'ChatGPT';
    }
}

function getApplicationPath() {
    // Use the exposed platform information instead of process
    if (window.mcp && window.mcp.isPackaged) {
        return window.mcp.platform === 'win32' 
            ? `${window.mcp.homedir}\\AppData\\Local\\Programs\\AvaTax MCP Server\\`
            : `${window.mcp.homedir}/Applications/AvaTax MCP Server.app/Contents/Resources/`;
    }
    return 'path/to/avatax-mcp-server';
}

// Initialize documentation tabs on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize documentation with Claude tab active
    showSetupTab('claude');
    // Update documentation tabs with current config
    updateDocumentationTabs();
    
    // Load saved theme
    loadTheme();
    
    // Initialize update functionality
    initializeUpdateSection();
});

// Update functionality
let updateCheckInProgress = false;
let downloadInProgress = false;

async function initializeUpdateSection() {
    try {
        const currentVersion = await window.mcp.getAppVersion();
        document.getElementById('currentVersion').textContent = `v${currentVersion}`;
        
        // Listen for update status events
        window.mcp.onUpdateStatus((status) => {
            handleUpdateStatus(status);
        });
    } catch (error) {
        console.error('Error initializing update section:', error);
        document.getElementById('currentVersion').textContent = 'Unknown';
    }
}

async function checkForUpdates() {
    if (updateCheckInProgress) return;
    
    updateCheckInProgress = true;
    const checkBtn = document.getElementById('checkUpdateBtn');
    const downloadBtn = document.getElementById('downloadUpdateBtn');
    const installBtn = document.getElementById('installUpdateBtn');
    
    // Reset buttons
    downloadBtn.classList.add('hidden');
    installBtn.classList.add('hidden');
    
    // Update button state
    checkBtn.disabled = true;
    checkBtn.innerHTML = '🔄 Checking...';
    
    showUpdateStatus('Checking for updates...', 'checking');
    
    try {
        const result = await window.mcp.checkForUpdates();
        
        if (result.success) {
            if (result.updateAvailable) {
                showUpdateStatus(
                    `New version available: v${result.latestVersion}`, 
                    'available'
                );
                downloadBtn.classList.remove('hidden');
            } else {
                showUpdateStatus(
                    `You have the latest version (v${result.currentVersion})`, 
                    'not-available'
                );
            }
        } else {
            showUpdateStatus(
                `Error checking for updates: ${result.error}`, 
                'error'
            );
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
        showUpdateStatus(`Error: ${error.message}`, 'error');
    } finally {
        updateCheckInProgress = false;
        checkBtn.disabled = false;
        checkBtn.innerHTML = '🔍 Check for Updates';
    }
}

async function downloadUpdate() {
    if (downloadInProgress) return;
    
    downloadInProgress = true;
    const downloadBtn = document.getElementById('downloadUpdateBtn');
    const installBtn = document.getElementById('installUpdateBtn');
    
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '⬇️ Downloading...';
    
    showUpdateStatus('Starting download...', 'downloading');
    showUpdateProgress(true);
    
    try {
        const result = await window.mcp.downloadUpdate();
        
        if (result.success) {
            showUpdateStatus('Update downloaded successfully!', 'downloaded');
            hideUpdateProgress();
            downloadBtn.classList.add('hidden');
            installBtn.classList.remove('hidden');
        } else {
            showUpdateStatus(`Download failed: ${result.error}`, 'error');
            hideUpdateProgress();
        }
    } catch (error) {
        console.error('Error downloading update:', error);
        showUpdateStatus(`Download error: ${error.message}`, 'error');
        hideUpdateProgress();
    } finally {
        downloadInProgress = false;
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '⬇️ Download Update';
    }
}

async function installUpdate() {
    const installBtn = document.getElementById('installUpdateBtn');
    
    if (confirm('This will close the application and install the update. Do you want to continue?')) {
        installBtn.disabled = true;
        installBtn.innerHTML = '🚀 Installing...';
        
        showUpdateStatus('Installing update and restarting...', 'downloading');
        
        try {
            await window.mcp.installUpdate();
        } catch (error) {
            console.error('Error installing update:', error);
            showUpdateStatus(`Installation error: ${error.message}`, 'error');
            installBtn.disabled = false;
            installBtn.innerHTML = '🚀 Install & Restart';
        }
    }
}

function showUpdateStatus(message, type) {
    const statusDiv = document.getElementById('updateStatus');
    statusDiv.textContent = message;
    statusDiv.className = `update-status show ${type}`;
}

function hideUpdateStatus() {
    const statusDiv = document.getElementById('updateStatus');
    statusDiv.classList.remove('show');
}

function showUpdateProgress(show = true) {
    const progressDiv = document.getElementById('updateProgress');
    if (show) {
        progressDiv.classList.remove('hidden');
    } else {
        progressDiv.classList.add('hidden');
    }
}

function hideUpdateProgress() {
    showUpdateProgress(false);
    updateProgressBar(0);
}

function updateProgressBar(percent, transferred = 0, total = 0, bytesPerSecond = 0) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${percent}%`;
    
    if (transferred && total) {
        const transferredMB = (transferred / 1024 / 1024).toFixed(1);
        const totalMB = (total / 1024 / 1024).toFixed(1);
        const speedKB = (bytesPerSecond / 1024).toFixed(0);
        
        progressText.textContent = `${percent.toFixed(1)}% (${transferredMB}/${totalMB} MB) - ${speedKB} KB/s`;
    } else {
        progressText.textContent = `${percent.toFixed(1)}%`;
    }
}

function handleUpdateStatus(status) {
    console.log('Update status:', status);
    
    switch (status.status) {
        case 'checking':
            showUpdateStatus('Checking for updates...', 'checking');
            break;
            
        case 'available':
            showUpdateStatus(
                `New version available: v${status.version}`, 
                'available'
            );
            document.getElementById('downloadUpdateBtn').classList.remove('hidden');
            break;
            
        case 'not-available':
            showUpdateStatus(
                `You have the latest version (v${status.version})`, 
                'not-available'
            );
            break;
            
        case 'downloading':
            if (status.progress !== undefined) {
                showUpdateStatus('Downloading update...', 'downloading');
                updateProgressBar(
                    status.progress,
                    status.transferred,
                    status.total,
                    status.bytesPerSecond
                );
            }
            break;
            
        case 'downloaded':
            showUpdateStatus('Update downloaded successfully!', 'downloaded');
            hideUpdateProgress();
            document.getElementById('downloadUpdateBtn').classList.add('hidden');
            document.getElementById('installUpdateBtn').classList.remove('hidden');
            break;
            
        case 'error':
            showUpdateStatus(`Error: ${status.error}`, 'error');
            hideUpdateProgress();
            break;
    }
}
