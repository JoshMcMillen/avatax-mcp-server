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
    initializeStatusBar(); // Initialize status bar first
    loadTheme(); // Load theme first
    loadSettings(); // Load saved settings
    loadConfiguration();
    getServerStatus();
    
    // Start periodic status checking for the persistent status bar
    startPeriodicStatusCheck();
    
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
        AVATAX_COMPANY_CODE: document.getElementById('companyCode').value || '', // Allow empty company code
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
        updatePersistentStatusBar('error', '❌ Please configure AvaTax credentials first');
        showServerStatus('Please configure your AvaTax credentials first', 'error');
        return;
    }
    
    const startBtn = document.querySelector('button[onclick="startServer()"]');
    const startBtnText = document.getElementById('startBtnText');
    
    startBtn.disabled = true;
    startBtnText.textContent = 'Starting...';
    
    // Update status bar to show starting state
    updatePersistentStatusBar('starting', '⏳ Starting AvaTax MCP Server...');
    
    clearServerOutput();
    
    window.mcp.launch(currentConfig).then(result => {
        if (result.success) {
            isServerRunning = true;
            updatePersistentStatusBar('running', '✅ AvaTax MCP Server is running');
            showServerStatus('✅ MCP Server started successfully! You can now use it with Claude Desktop.', 'success');
            startBtnText.textContent = 'Server Running';
        } else {
            updatePersistentStatusBar('error', '❌ Failed to start server');
            showServerStatus(`❌ Failed to start server: ${result.error}`, 'error');
            startBtn.disabled = false;
            startBtnText.textContent = 'Start MCP Server';
        }
    }).catch(error => {
        updatePersistentStatusBar('error', '❌ Server startup failed');
        showServerStatus(`❌ Server startup failed: ${error.message}`, 'error');
        startBtn.disabled = false;
        startBtnText.textContent = 'Start MCP Server';
    });
}

function stopServer() {
    // Update status bar to show stopping state
    updatePersistentStatusBar('starting', '⏳ Stopping AvaTax MCP Server...');
    
    window.mcp.stop().then(result => {
        if (result.success) {
            isServerRunning = false;
            updatePersistentStatusBar('stopped', '⏹️ AvaTax MCP Server is stopped');
            showServerStatus('Server stopped', 'warning');
            
            const startBtn = document.querySelector('button[onclick="startServer()"]');
            const startBtnText = document.getElementById('startBtnText');
            startBtn.disabled = false;
            startBtnText.textContent = 'Start MCP Server';
        } else {
            updatePersistentStatusBar('error', '❌ Failed to stop server');
            showServerStatus(`Failed to stop server: ${result.error}`, 'error');
        }
    }).catch(error => {
        updatePersistentStatusBar('error', '❌ Stop command failed');
        showServerStatus(`Stop command failed: ${error.message}`, 'error');
    });
}

function getServerStatus() {
    checkAndUpdateServerStatus();
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
        
        // Update persistent status bar
        updatePersistentStatusBar('stopped', '⏹️ AvaTax MCP Server stopped unexpectedly');
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
    
    // Get the correct executable and script paths for packaged Electron app
    const executablePath = window.mcp.platform === 'win32' 
        ? `${window.mcp.homedir}\\AppData\\Local\\Programs\\AvaTax MCP Server\\AvaTax MCP Server.exe`
        : `${window.mcp.homedir}/Applications/AvaTax MCP Server.app/Contents/MacOS/AvaTax MCP Server`;
    
    const scriptPath = window.mcp.platform === 'win32' 
        ? `${window.mcp.homedir}\\AppData\\Local\\Programs\\AvaTax MCP Server\\resources\\app.asar\\dist\\index.js`
        : `${window.mcp.homedir}/Applications/AvaTax MCP Server.app/Contents/Resources/app.asar/dist/index.js`;
    
    // Generate secure configuration (recommended)
    const secureConfig = {
        "mcpServers": {
            "avatax": {
                "command": executablePath,
                "args": [scriptPath],
                "env": {
                    "ELECTRON_RUN_AS_NODE": "1",
                    "AVATAX_CREDENTIALS_PATH": window.mcp.platform === 'win32' 
                        ? `${window.mcp.homedir}\\.avatax\\credentials.json`
                        : `${window.mcp.homedir}/.avatax/credentials.json`,
                    "AVATAX_APP_NAME": config.AVATAX_APP_NAME,
                    "AVATAX_TIMEOUT": config.AVATAX_TIMEOUT
                }
            }
        }
    };

    // Generate legacy configuration (with credentials in config)
    const legacyConfig = {
        "mcpServers": {
            "avatax": {
                "command": executablePath,
                "args": [scriptPath],
                "env": {
                    "ELECTRON_RUN_AS_NODE": "1",
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

    // Generate credentials file content
    const credentialsFile = {
        "accounts": {
            [config.AVATAX_ENVIRONMENT]: {
                "accountId": config.AVATAX_ACCOUNT_ID,
                "licenseKey": config.AVATAX_LICENSE_KEY,
                "environment": config.AVATAX_ENVIRONMENT,
                "defaultCompanyCode": config.AVATAX_COMPANY_CODE === 'DEFAULT' ? '' : config.AVATAX_COMPANY_CODE
            }
        },
        "defaultAccount": config.AVATAX_ENVIRONMENT
    };
    
    const secureConfigText = JSON.stringify(secureConfig, null, 2);
    const legacyConfigText = JSON.stringify(legacyConfig, null, 2);
    const credentialsText = JSON.stringify(credentialsFile, null, 2);
    
    // Create the HTML structure
    const configContainer = document.createElement('div');
    configContainer.className = 'config-options';
    
    // Create tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'config-tabs';
    
    const secureTab = document.createElement('button');
    secureTab.className = 'config-tab active';
    secureTab.innerHTML = '🔒 Secure (Recommended)';
    secureTab.onclick = () => showConfigTab('secure');
    
    const legacyTab = document.createElement('button');
    legacyTab.className = 'config-tab';
    legacyTab.innerHTML = '⚙️ Legacy';
    legacyTab.onclick = () => showConfigTab('legacy');
    
    tabsContainer.appendChild(secureTab);
    tabsContainer.appendChild(legacyTab);
    
    // Create secure config content
    const secureContent = document.createElement('div');
    secureContent.id = 'secureConfig';
    secureContent.className = 'config-content active';
    secureContent.innerHTML = `
        <h4>📋 Claude Desktop Configuration</h4>
        <pre class="config-code">${secureConfigText}</pre>
        <button type="button" class="btn btn-secondary copy-btn">📋 Copy Configuration</button>
        
        <h4>🔐 Credentials File</h4>
        <p>Create this file at: <code>${window.mcp.platform === 'win32' 
            ? `${window.mcp.homedir}\\.avatax\\credentials.json`
            : `${window.mcp.homedir}/.avatax/credentials.json`}</code></p>
        <pre class="config-code">${credentialsText}</pre>
        <button type="button" class="btn btn-secondary copy-btn">📋 Copy Credentials</button>
        
        <div class="help-note">
            <p><strong>✅ Benefits of Secure Configuration:</strong></p>
            <ul>
                <li>Credentials stored separately from Claude config</li>
                <li>Better security with file permissions</li>
                <li>Easy switching between multiple accounts</li>
                <li>Dynamic credential management in Claude</li>
            </ul>
        </div>
    `;
    
    // Create legacy config content
    const legacyContent = document.createElement('div');
    legacyContent.id = 'legacyConfig';
    legacyContent.className = 'config-content';
    legacyContent.innerHTML = `
        <h4>📋 Claude Desktop Configuration (Legacy)</h4>
        <pre class="config-code">${legacyConfigText}</pre>
        <button type="button" class="btn btn-secondary copy-btn">📋 Copy Configuration</button>
        
        <div class="help-note">
            <p><strong>⚠️ Legacy Configuration:</strong></p>
            <ul>
                <li>Credentials stored directly in Claude config</li>
                <li>Less secure - credentials visible in config file</li>
                <li>Requires Claude restart to change credentials</li>
                <li>Use only if you prefer the simple approach</li>
            </ul>
        </div>
    `;
    
    // Assemble the structure
    configContainer.appendChild(tabsContainer);
    configContainer.appendChild(secureContent);
    configContainer.appendChild(legacyContent);
    
    // Clear and populate the output element
    const outputElement = document.getElementById('claudeConfigOutput');
    outputElement.innerHTML = '';
    outputElement.appendChild(configContainer);
    
    // Add click handlers for copy buttons
    const copyButtons = outputElement.querySelectorAll('.copy-btn');
    copyButtons[0].onclick = (e) => copyConfigText(secureConfigText, e.target);
    copyButtons[1].onclick = (e) => copyConfigText(credentialsText, e.target);
    copyButtons[2].onclick = (e) => copyConfigText(legacyConfigText, e.target);
    
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

// New functions for tab-based configuration display
function showConfigTab(tabName) {
    // Check if this is for the main configuration tabs (credentials, settings, theme)
    const mainConfigTabs = document.querySelectorAll('.config-options > .config-tabs .config-tab');
    const mainConfigContents = document.querySelectorAll('.config-options > .config-content');
    
    // Check if this is a main config tab
    if (tabName === 'credentials' || tabName === 'settings' || tabName === 'theme') {
        // Handle main configuration tabs
        mainConfigTabs.forEach(tab => tab.classList.remove('active'));
        mainConfigContents.forEach(content => content.classList.remove('active'));
        
        // Find and activate the correct tab and content
        const selectedTab = Array.from(mainConfigTabs).find(tab => 
            tab.getAttribute('onclick').includes(`'${tabName}'`)
        );
        const selectedContent = document.getElementById(tabName);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');
    } else {
        // Handle Claude config sub-tabs (secure/legacy) within the claudeConfigOutput
        const outputElement = document.getElementById('claudeConfigOutput');
        if (outputElement) {
            const tabs = outputElement.querySelectorAll('.config-tab');
            const contents = outputElement.querySelectorAll('.config-content');
            
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab and content
            const selectedTab = Array.from(tabs).find(tab => 
                tab.innerHTML.includes(tabName === 'secure' ? 'Secure' : 'Legacy')
            );
            const selectedContent = outputElement.querySelector(`#${tabName}Config`);
            
            if (selectedTab) selectedTab.classList.add('active');
            if (selectedContent) selectedContent.classList.add('active');
        }
    }
}

function copyConfigText(text, copyBtn) {
    navigator.clipboard.writeText(text).then(() => {
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
        textarea.value = text;
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

// Company selection functionality
let availableCompanies = [];

function getCompanies() {
    const config = {
        AVATAX_ACCOUNT_ID: document.getElementById('accountId').value,
        AVATAX_LICENSE_KEY: document.getElementById('licenseKey').value,
        AVATAX_ENVIRONMENT: document.getElementById('environment').value
    };
    
    if (!config.AVATAX_ACCOUNT_ID || !config.AVATAX_LICENSE_KEY) {
        showStatus('Account ID and License Key are required to fetch companies', 'error');
        return;
    }
    
    const btn = document.getElementById('getCompaniesBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';
    
    // Show modal with loading state
    const modal = document.getElementById('companySelectionModal');
    const companyList = document.getElementById('companyList');
    companyList.innerHTML = '<div class="loading-companies">🔄 Loading companies...</div>';
    modal.classList.remove('hidden');
    
    window.mcp.getCompanies(config).then(result => {
        btn.disabled = false;
        btn.textContent = originalText;
        
        if (result.success) {
            availableCompanies = result.companies || [];
            displayCompanies(availableCompanies);
            
            if (availableCompanies.length === 0) {
                companyList.innerHTML = '<div class="no-companies">No companies found in this account.</div>';
            }
        } else {
            companyList.innerHTML = `<div class="no-companies">❌ Failed to load companies: ${result.error}</div>`;
        }
    }).catch(error => {
        btn.disabled = false;
        btn.textContent = originalText;
        companyList.innerHTML = `<div class="no-companies">❌ Error loading companies: ${error.message}</div>`;
    });
}

function displayCompanies(companies) {
    const companyList = document.getElementById('companyList');
    
    if (companies.length === 0) {
        companyList.innerHTML = '<div class="no-companies">No companies match your search.</div>';
        return;
    }
    
    companyList.innerHTML = companies.map(company => {
        const badges = [];
        if (company.isActive) {
            badges.push('<span class="company-badge active">Active</span>');
        } else {
            badges.push('<span class="company-badge inactive">Inactive</span>');
        }
        if (company.isDefault) {
            badges.push('<span class="company-badge default">Default</span>');
        }
        
        return `
            <div class="company-item" onclick="selectCompany('${company.companyCode}', '${company.name}')">
                <div class="company-info">
                    <div class="company-name">${company.name || 'Unnamed Company'}</div>
                    <div class="company-code">Code: ${company.companyCode}</div>
                </div>
                <div class="company-badges">
                    ${badges.join('')}
                </div>
            </div>
        `;
    }).join('');
}

function selectCompany(companyCode, companyName) {
    document.getElementById('companyCode').value = companyCode;
    closeCompanyModal();
    showStatus(`✅ Selected company: ${companyName} (${companyCode})`, 'success');
}

function closeCompanyModal() {
    const modal = document.getElementById('companySelectionModal');
    modal.classList.add('hidden');
    
    // Clear search
    document.getElementById('companySearch').value = '';
    
    // Reset display to show all companies
    if (availableCompanies.length > 0) {
        displayCompanies(availableCompanies);
    }
}

function filterCompanies() {
    const searchTerm = document.getElementById('companySearch').value.toLowerCase();
    
    if (!searchTerm) {
        displayCompanies(availableCompanies);
        return;
    }
    
    const filteredCompanies = availableCompanies.filter(company => {
        return (company.name && company.name.toLowerCase().includes(searchTerm)) ||
               (company.companyCode && company.companyCode.toLowerCase().includes(searchTerm));
    });
    
    displayCompanies(filteredCompanies);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('companySelectionModal');
    if (event.target === modal) {
        closeCompanyModal();
    }
});

// Handle Escape key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('companySelectionModal');
        if (!modal.classList.contains('hidden')) {
            closeCompanyModal();
        }
    }
});

// Dynamic documentation generation functions
function generateVSCodeConfig(config) {
    if (!config || !config.AVATAX_ACCOUNT_ID) return '';
    
    const executablePath = window.mcp.platform === 'win32' 
        ? `"${getApplicationPath()}/AvaTax MCP Server.exe"`
        : `"${getApplicationPath()}/AvaTax MCP Server"`;
    
    const scriptPath = `"${getApplicationPath()}/resources/app.asar/dist/index.js"`;
    
    const vsCodeConfig = {
        "avatax": {
            "command": executablePath,
            "args": [scriptPath],
            "env": {
                "ELECTRON_RUN_AS_NODE": "1",
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
    
    const executablePath = window.mcp.platform === 'win32' 
        ? `"${getApplicationPath()}/AvaTax MCP Server.exe"`
        : `"${getApplicationPath()}/AvaTax MCP Server"`;
    
    const scriptPath = `"${getApplicationPath()}/resources/app.asar/dist/index.js"`;
    
    const chatGPTConfig = {
        "mcp_servers": {
            "avatax": {
                "command": executablePath,
                "args": [scriptPath],
                "cwd": getApplicationPath(),
                "env": {
                    "ELECTRON_RUN_AS_NODE": "1",
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

// Initialize status bar immediately when DOM is loaded
function initializeStatusBar() {
    updatePersistentStatusBar('info', '⏹️ Server not started - waiting to be started');
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
    
    // Initialize status bar
    initializeStatusBar();
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

// Persistent Status Bar Management
function updatePersistentStatusBar(status, message) {
    const statusBar = document.getElementById('persistentStatusBar');
    const statusText = document.getElementById('statusBarText');
    
    if (!statusBar || !statusText) return;
    
    // Remove all status classes
    statusBar.classList.remove('running', 'stopped', 'starting', 'error', 'info');
    
    // Add the new status class
    statusBar.classList.add(status);
    
    // Update the text
    statusText.textContent = message;
}

// Periodic status checking to keep the status bar updated
let statusCheckInterval;

function startPeriodicStatusCheck() {
    // Check status every 5 seconds
    statusCheckInterval = setInterval(() => {
        checkAndUpdateServerStatus();
    }, 5000);
}

function stopPeriodicStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

// Save application settings
function saveSettings() {
    const appName = document.getElementById('appName').value || 'AvaTax-MCP-Server';
    const timeout = document.getElementById('timeout').value || '30000';
    
    // Validate timeout value
    const timeoutNum = parseInt(timeout);
    if (isNaN(timeoutNum) || timeoutNum < 5000 || timeoutNum > 120000) {
        showStatus('Timeout must be between 5000 and 120000 milliseconds', 'error');
        return;
    }
    
    // Save settings to localStorage for persistence
    localStorage.setItem('appName', appName);
    localStorage.setItem('timeout', timeout);
    
    // Update form values to ensure they're clean
    document.getElementById('appName').value = appName;
    document.getElementById('timeout').value = timeout;
    
    showStatus('Settings saved successfully!', 'success');
    
    // Update the configuration form if credentials are available
    updateClaudeConfigPreview();
}

// Save theme settings
function saveThemeSettings() {
    const themeToggle = document.querySelector('#themeToggle');
    const theme = themeToggle.checked ? 'dark' : 'light';
    
    // Apply the theme
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    
    showStatus('Theme settings saved successfully!', 'success');
}

// Load saved settings on startup
function loadSettings() {
    const savedAppName = localStorage.getItem('appName') || 'AvaTax-MCP-Server';
    const savedTimeout = localStorage.getItem('timeout') || '30000';
    
    const appNameField = document.getElementById('appName');
    const timeoutField = document.getElementById('timeout');
    
    if (appNameField) appNameField.value = savedAppName;
    if (timeoutField) timeoutField.value = savedTimeout;
}
