# AvaTax MCP Server - Certificate Setup Guide

## Automatic Certificate Password Configuration

To avoid entering your certificate password every time you build:

### One-Time Setup:

1. **Run the setup script:**
   ```powershell
   .\scripts\setup.ps1 -SetupCertificate
   ```

2. **Enter your certificate password when prompted**

3. **The password will be securely stored in Windows Credential Manager**

### What This Does:

- Installs the CredentialManager PowerShell module if needed
- Securely stores your certificate password in Windows Credential Manager
- Enables automatic builds without password prompts

### After Setup:

You can now run any of these commands without entering passwords:

```powershell
npm run release:patch   # Quick patch release
npm run release:minor   # Quick minor release  
npm run smart-build     # Interactive build
```

### Security:

- Your password is stored using Windows Credential Manager
- Only your Windows user account can access the stored password
- The password is never stored in plain text files
- Your certificate file is excluded from git via .gitignore

### Troubleshooting:

Check your setup status:
```powershell
.\scripts\setup.ps1 -ShowStatus
```

Remove stored password:
```powershell
.\scripts\setup.ps1 -RemoveCertificate
```

### Manual Alternative:

If you prefer to set the password manually each session:
```powershell
$env:CSC_KEY_PASSWORD = "your_password_here"
npm run smart-build
```
