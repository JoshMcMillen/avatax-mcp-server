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
                const content = fs.readFileSync(credPath, 'utf-8');
                return JSON.parse(content);
            }
            catch (error) {
                console.error(`Failed to load credentials from ${credPath}:`, error);
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
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
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
