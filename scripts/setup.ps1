# Setup script for AvaTax MCP Server development environment
param(
    [Parameter(Mandatory=$false)]
    [switch]$SetupCertificate,
    
    [Parameter(Mandatory=$false)]
    [switch]$RemoveCertificate,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowStatus
)

function Install-RequiredModules {
    $credentialManagerModule = "CredentialManager"
    if (-not (Get-Module -ListAvailable -Name $credentialManagerModule)) {
        Write-Host "Installing $credentialManagerModule module..." -ForegroundColor Yellow
        try {
            Install-Module -Name $credentialManagerModule -Force -Scope CurrentUser -ErrorAction Stop
            Write-Host "$credentialManagerModule installed successfully." -ForegroundColor Green
        } catch {
            Write-Host "Failed to install $credentialManagerModule." -ForegroundColor Red
            return $false
        }
    }
    return $true
}

function Set-CertificateCredential {
    if (-not (Test-Path 'codesign-cert.p12')) {
        Write-Host "Certificate file 'codesign-cert.p12' not found!" -ForegroundColor Red
        Write-Host "Please ensure your certificate file is in the project root." -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Setting up certificate password for automatic builds..." -ForegroundColor Green
    $securePassword = Read-Host -Prompt "Enter certificate password" -AsSecureString
    $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
    
    try {
        New-StoredCredential -Target "AvaTax-MCP-CodeSigning" -UserName "codesign" -Password $password -Persist LocalMachine -ErrorAction Stop
        Write-Host "Certificate password saved successfully!" -ForegroundColor Green
        Write-Host "You can now run builds without entering the password each time." -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "Failed to save to Credential Manager: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Remove-CertificateCredential {
    try {
        Remove-StoredCredential -Target "AvaTax-MCP-CodeSigning" -ErrorAction Stop
        Write-Host "Certificate password removed from Credential Manager." -ForegroundColor Green
    } catch {
        Write-Host "No stored certificate password found or failed to remove." -ForegroundColor Yellow
    }
}

function Show-SetupStatus {
    Write-Host "AvaTax MCP Server Setup Status" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    # Check certificate file
    if (Test-Path 'codesign-cert.p12') {
        Write-Host "[+] Certificate file found" -ForegroundColor Green
    } else {
        Write-Host "[-] Certificate file missing (codesign-cert.p12)" -ForegroundColor Red
    }
    
    # Check stored credential
    try {
        $credential = Get-StoredCredential -Target "AvaTax-MCP-CodeSigning" -ErrorAction Stop
        Write-Host "[+] Certificate password stored in Credential Manager" -ForegroundColor Green
    } catch {
        Write-Host "[-] Certificate password not stored" -ForegroundColor Yellow
    }
    
    # Check environment file
    if (Test-Path '.env') {
        Write-Host "[+] Environment file found" -ForegroundColor Green
    } else {
        Write-Host "[-] Environment file missing (.env)" -ForegroundColor Yellow
        Write-Host "    Copy .env.example to .env and configure your AvaTax credentials" -ForegroundColor Gray
    }
    
    # Check CredentialManager module
    if (Get-Module -ListAvailable -Name "CredentialManager") {
        Write-Host "[+] CredentialManager PowerShell module installed" -ForegroundColor Green
    } else {
        Write-Host "[-] CredentialManager PowerShell module not installed" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Cyan
    Write-Host "  npm run release:patch   - Build and release patch version" -ForegroundColor Gray
    Write-Host "  npm run release:minor   - Build and release minor version" -ForegroundColor Gray
    Write-Host "  npm run smart-build     - Interactive build with version selection" -ForegroundColor Gray
}

# Main execution
Write-Host "AvaTax MCP Server Development Setup" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

if ($ShowStatus) {
    Show-SetupStatus
    exit 0
}

if ($RemoveCertificate) {
    if (Install-RequiredModules) {
        Remove-CertificateCredential
    }
    exit 0
}

if ($SetupCertificate) {
    if (Install-RequiredModules) {
        Set-CertificateCredential
    }
    exit 0
}

# Default: show help and status
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  .\scripts\setup.ps1 -SetupCertificate    # Set up certificate password for automatic signing"
Write-Host "  .\scripts\setup.ps1 -RemoveCertificate   # Remove stored certificate password"
Write-Host "  .\scripts\setup.ps1 -ShowStatus          # Show current setup status"
Write-Host ""

Show-SetupStatus
