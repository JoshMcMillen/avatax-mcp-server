"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCredentials = loadCredentials;
exports.saveCredentials = saveCredentials;
exports.createAvaTaxConfig = createAvaTaxConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
function loadCredentials() {
    // Look for credentials in multiple locations
    const possiblePaths = [
        process.env.AVATAX_CREDENTIALS_PATH,
        path.join(os.homedir(), '.avatax', 'credentials.json'),
        path.join(process.cwd(), 'avatax-credentials.json'),
    ].filter(Boolean);
    for (const credPath of possiblePaths) {
        if (fs.existsSync(credPath)) {
            try {
                let content = fs.readFileSync(credPath, 'utf-8');
                // Remove BOM if present (fixes Windows PowerShell UTF-8 files)
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }
                // Trim whitespace and invisible characters
                content = content.trim();
                return JSON.parse(content);
            }
            catch (error) {
                console.error(`Failed to load credentials from ${credPath}:`, error);
                // If this is a JSON parse error, try to provide more helpful information
                if (error.name === 'SyntaxError') {
                    console.error(`The credentials file appears to have invalid JSON format. Please check the file: ${credPath}`);
                    console.error('You may need to recreate the file with proper JSON formatting.');
                }
            }
        }
    }
    return null;
}
function saveCredentials(credentials) {
    const credentialsDir = path.join(os.homedir(), '.avatax');
    const credentialsPath = path.join(credentialsDir, 'credentials.json');
    // Ensure directory exists
    if (!fs.existsSync(credentialsDir)) {
        fs.mkdirSync(credentialsDir, { recursive: true });
    }
    // Write the file without BOM to avoid JSON parsing issues
    const jsonContent = JSON.stringify(credentials, null, 2);
    fs.writeFileSync(credentialsPath, jsonContent, { encoding: 'utf8' });
}
function createAvaTaxConfig() {
    // First try to load from external credentials file
    const storedCreds = loadCredentials();
    let config;
    if ((storedCreds === null || storedCreds === void 0 ? void 0 : storedCreds.defaultAccount) && storedCreds.accounts[storedCreds.defaultAccount]) {
        const defaultCreds = storedCreds.accounts[storedCreds.defaultAccount];
        config = {
            accountId: defaultCreds.accountId,
            licenseKey: defaultCreds.licenseKey,
            environment: defaultCreds.environment,
            companyCode: defaultCreds.defaultCompanyCode || '',
            appName: process.env.AVATAX_APP_NAME || 'AvaTax-MCP-Server',
            appVersion: process.env.AVATAX_APP_VERSION || '1.0.0',
            machineName: process.env.AVATAX_MACHINE_NAME || 'MCP-Server',
            timeout: parseInt(process.env.AVATAX_TIMEOUT || '30000')
        };
    }
    else {
        // Fall back to environment variables
        const environment = (process.env.AVATAX_ENVIRONMENT || 'sandbox');
        if (!process.env.AVATAX_ACCOUNT_ID || !process.env.AVATAX_LICENSE_KEY) {
            throw new Error('AVATAX_ACCOUNT_ID and AVATAX_LICENSE_KEY environment variables are required, or configure credentials file');
        }
        config = {
            accountId: process.env.AVATAX_ACCOUNT_ID,
            licenseKey: process.env.AVATAX_LICENSE_KEY,
            environment,
            companyCode: process.env.AVATAX_COMPANY_CODE || '',
            appName: process.env.AVATAX_APP_NAME || 'AvaTax-MCP-Server',
            appVersion: process.env.AVATAX_APP_VERSION || '1.0.0',
            machineName: process.env.AVATAX_MACHINE_NAME || 'MCP-Server',
            timeout: parseInt(process.env.AVATAX_TIMEOUT || '30000')
        };
    }
    return config;
}
