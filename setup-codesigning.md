# Code Signing Setup for AvaTax MCP Server

## Option 1: Self-Signed Certificate (Free, for testing)

### Step 1: Create a self-signed certificate
```powershell
# Run PowerShell as Administrator
New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=AvaTax MCP Server" -KeyUsage DigitalSignature -FriendlyName "AvaTax MCP Code Signing" -CertStoreLocation "Cert:\CurrentUser\My" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")
```

### Step 2: Export the certificate
```powershell
# Get the certificate thumbprint (replace with your actual thumbprint)
$cert = Get-ChildItem -Path "Cert:\CurrentUser\My" | Where-Object {$_.Subject -match "AvaTax MCP Server"}
$password = ConvertTo-SecureString -String "your-password-here" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath ".\codesign-cert.p12" -Password $password
```

### Step 3: Update package.json
```json
"win": {
  "target": "nsis",
  "icon": "electron/icon.ico",
  "certificateFile": "codesign-cert.p12",
  "certificatePassword": "your-password-here",
  "signingHashAlgorithms": ["sha256"]
}
```

## Option 2: Commercial Certificate (Recommended for distribution)

### Popular Certificate Authorities:
- **DigiCert**: ~$400/year, high trust
- **Sectigo (Comodo)**: ~$200/year, good value
- **GlobalSign**: ~$300/year, widely trusted

### Steps:
1. Purchase a code signing certificate
2. Download the .p12 or .pfx file
3. Update package.json with the certificate path and password

## Option 3: Environment Variables (Secure)

Instead of hardcoding in package.json:

```json
"win": {
  "target": "nsis",
  "icon": "electron/icon.ico"
}
```

Set environment variables:
```powershell
$env:CSC_LINK = "path\to\certificate.p12"
$env:CSC_KEY_PASSWORD = "certificate-password"
```

## Option 4: Azure SignTool (Cloud-based)

For enterprise environments:
```json
"win": {
  "target": "nsis",
  "icon": "electron/icon.ico",
  "signtoolOptions": [
    "/fd", "sha256",
    "/tr", "http://timestamp.digicert.com",
    "/td", "sha256"
  ]
}
```

## Quick Fix for Current Issue

If you want to build immediately without code signing:

```powershell
# Set environment variables to disable code signing
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:CSC_LINK = ""
$env:CSC_KEY_PASSWORD = ""

# Clear the problematic cache
Remove-Item -Recurse -Force "$env:USERPROFILE\AppData\Local\electron-builder" -ErrorAction SilentlyContinue

# Build
npm run electron:build
```

## Recommended Approach for You

1. **For immediate testing**: Use the quick fix above
2. **For distribution**: Get a self-signed certificate (Option 1) 
3. **For commercial release**: Purchase a commercial certificate (Option 2)

The self-signed certificate will eliminate the build errors and create a working installer, though Windows will show a warning until users choose to trust it.
