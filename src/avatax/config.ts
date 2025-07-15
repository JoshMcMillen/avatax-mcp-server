import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AvaTaxConfig {
    accountId: string;
    licenseKey: string;
    environment: 'sandbox' | 'production';
    companyCode?: string;
    appName?: string;
    appVersion?: string;
    machineName?: string;
    timeout?: number;
}

export interface StoredCredentials {
    accounts: {
        [name: string]: {
            accountId: string;
            licenseKey: string;
            environment: 'sandbox' | 'production';
            defaultCompanyCode?: string;
        }
    };
    defaultAccount?: string;
}

export function loadCredentials(): StoredCredentials | null {
    // Look for credentials in multiple locations
    const possiblePaths = [
        process.env.AVATAX_CREDENTIALS_PATH,
        path.join(os.homedir(), '.avatax', 'credentials.json'),
        path.join(process.cwd(), 'avatax-credentials.json'),
    ].filter(Boolean);

    for (const credPath of possiblePaths) {
        if (fs.existsSync(credPath!)) {
            try {
                const content = fs.readFileSync(credPath!, 'utf-8');
                return JSON.parse(content);
            } catch (error) {
                console.error(`Failed to load credentials from ${credPath}:`, error);
            }
        }
    }
    
    return null;
}

export function saveCredentials(credentials: StoredCredentials): void {
    const credentialsDir = path.join(os.homedir(), '.avatax');
    const credentialsPath = path.join(credentialsDir, 'credentials.json');
    
    // Ensure directory exists
    if (!fs.existsSync(credentialsDir)) {
        fs.mkdirSync(credentialsDir, { recursive: true });
    }
    
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
}

export function createAvaTaxConfig(): AvaTaxConfig {
    // First try to load from external credentials file
    const storedCreds = loadCredentials();
    
    let config: AvaTaxConfig;
    
    if (storedCreds?.defaultAccount && storedCreds.accounts[storedCreds.defaultAccount]) {
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
    } else {
        // Fall back to environment variables
        const environment = (process.env.AVATAX_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
        
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