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
                let content = fs.readFileSync(credPath!, 'utf-8');
                
                // Remove BOM if present (fixes Windows PowerShell UTF-8 files)
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }
                
                // Trim whitespace and invisible characters
                content = content.trim();
                
                return JSON.parse(content);
            } catch (error: any) {
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

export function saveCredentials(credentials: StoredCredentials): void {
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