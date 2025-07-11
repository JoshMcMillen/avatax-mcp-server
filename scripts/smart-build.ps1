# Smart build script that helps with version management
param(
    [Parameter(Mandatory=$false)]
    [string]$VersionType = "",
    
    [Parameter(Mandatory=$false)]
    [string]$CustomVersion = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ReleaseNotes = "Bug fixes and improvements"
)

# Function to set up certificate password securely
function Set-CertificatePassword {
    # Check if CSC_KEY_PASSWORD is already set
    if ($env:CSC_KEY_PASSWORD) {
        Write-Host "Certificate password already configured." -ForegroundColor Green
        return
    }
    
    # Check if certificate file exists
    if (-not (Test-Path 'codesign-cert.p12')) {
        Write-Host "Warning: Code signing certificate 'codesign-cert.p12' not found." -ForegroundColor Yellow
        Write-Host "The build will proceed without code signing." -ForegroundColor Yellow
        $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
        return
    }
    
    # Try to get password from Windows Credential Manager first
    try {
        $credential = Get-StoredCredential -Target "AvaTax-MCP-CodeSigning" -ErrorAction SilentlyContinue
        if ($credential) {
            $env:CSC_KEY_PASSWORD = $credential.GetNetworkCredential().Password
            Write-Host "Certificate password loaded from Windows Credential Manager." -ForegroundColor Green
            return
        }
    } catch {
        # Credential Manager not available or no stored credential
    }
    
    # Check for password in a secure file (optional)
    $securePasswordFile = ".codesign-password.txt"
    if (Test-Path $securePasswordFile) {
        try {
            $env:CSC_KEY_PASSWORD = Get-Content $securePasswordFile -Raw
            Write-Host "Certificate password loaded from secure file." -ForegroundColor Green
            return
        } catch {
            Write-Host "Failed to read password from secure file." -ForegroundColor Yellow
        }
    }
    
    # Last resort: prompt for password and offer to save it
    Write-Host ""
    Write-Host "Certificate password required for code signing." -ForegroundColor Yellow
    $securePassword = Read-Host -Prompt "Enter certificate password" -AsSecureString
    $env:CSC_KEY_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
    
    # Offer to save the password for future builds
    $savePassword = Read-Host "Save password for future builds? (y/N)"
    if ($savePassword -eq "y" -or $savePassword -eq "Y") {
        try {
            # Try to save to Windows Credential Manager
            New-StoredCredential -Target "AvaTax-MCP-CodeSigning" -UserName "codesign" -Password $env:CSC_KEY_PASSWORD -Persist LocalMachine -ErrorAction Stop
            Write-Host "Password saved to Windows Credential Manager." -ForegroundColor Green
        } catch {
            # Fallback: save to secure file
            $env:CSC_KEY_PASSWORD | Out-File -FilePath $securePasswordFile -NoNewline
            Write-Host "Password saved to secure file. Keep this file secure and don't commit it to git!" -ForegroundColor Yellow
        }
    }
}

# Function to check for required PowerShell modules
function Install-RequiredModules {
    $credentialManagerModule = "CredentialManager"
    if (-not (Get-Module -ListAvailable -Name $credentialManagerModule)) {
        Write-Host "Installing $credentialManagerModule module..." -ForegroundColor Yellow
        try {
            Install-Module -Name $credentialManagerModule -Force -Scope CurrentUser -ErrorAction Stop
            Write-Host "$credentialManagerModule installed successfully." -ForegroundColor Green
        } catch {
            Write-Host "Failed to install $credentialManagerModule. Will use fallback method." -ForegroundColor Yellow
        }
    }
}

# Install required modules
Install-RequiredModules

# Set up certificate password
Set-CertificatePassword

# Get current version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version

Write-Host "Current version: $currentVersion" -ForegroundColor Cyan

# Parse current version
$versionParts = $currentVersion.Split('.')
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1] 
$patch = [int]$versionParts[2]

# Calculate suggested versions
$nextPatch = "$major.$minor.$($patch + 1)"
$nextMinor = "$major.$($minor + 1).0"
$nextMajor = "$($major + 1).0.0"

# If no version specified, prompt user
if ([string]::IsNullOrEmpty($VersionType) -and [string]::IsNullOrEmpty($CustomVersion)) {
    Write-Host ""
    Write-Host "Version options:" -ForegroundColor Yellow
    Write-Host "1. Patch (bug fixes): $nextPatch" -ForegroundColor Green
    Write-Host "2. Minor (new features): $nextMinor" -ForegroundColor Green  
    Write-Host "3. Major (breaking changes): $nextMajor" -ForegroundColor Green
    Write-Host "4. Custom version" -ForegroundColor Green
    Write-Host "5. Patch existing version" -ForegroundColor Green
    Write-Host ""
    
    $choice = Read-Host "Select version type (1-5)"
    
    switch ($choice) {
        "1" { $newVersion = $nextPatch }
        "2" { $newVersion = $nextMinor }
        "3" { $newVersion = $nextMajor }
        "4" { 
            $newVersion = Read-Host "Enter custom version (e.g., 2.1.5)"
            # Validate version format
            if ($newVersion -notmatch '^\d+\.\d+\.\d+$') {
                Write-Host "Invalid version format. Please use x.y.z format." -ForegroundColor Red
                exit 1
            }
        }
        "5" {
            $newVersion = $currentVersion # Automatically use the current version for patching
        }
        default {
            Write-Host "Invalid choice. Exiting." -ForegroundColor Red
            exit 1
        }
    }
} elseif (![string]::IsNullOrEmpty($CustomVersion)) {
    $newVersion = $CustomVersion
} else {
    switch ($VersionType.ToLower()) {
        "patch" { $newVersion = $nextPatch }
        "minor" { $newVersion = $nextMinor }
        "major" { $newVersion = $nextMajor }
        default {
            Write-Host "Invalid version type. Use 'patch', 'minor', 'major', or provide -CustomVersion" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "Building version: $newVersion" -ForegroundColor Green
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Proceed with building v$newVersion? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Build cancelled." -ForegroundColor Yellow
    exit 0
}

# Get release notes if not provided
if ($ReleaseNotes -eq "Bug fixes and improvements") {
    Write-Host ""
    $customNotes = Read-Host "Enter release notes (or press Enter for default)"
    if (![string]::IsNullOrEmpty($customNotes)) {
        $ReleaseNotes = $customNotes
    }
}

# Update package.json version
if ($newVersion -ne $currentVersion) {
    Write-Host "Updating package.json version to $newVersion..." -ForegroundColor Yellow
    npm version $newVersion --no-git-tag-version

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to update package.json version!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Version unchanged. Skipping package.json update." -ForegroundColor Yellow
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript build failed!" -ForegroundColor Red
    exit 1
}

# Build Electron app
Write-Host "Building Electron application..." -ForegroundColor Yellow
npm run electron:build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Electron build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build completed successfully!" -ForegroundColor Green

# Check if release files exist
$installerPath = "release\AvaTax MCP Server Setup $newVersion.exe"
if (-not (Test-Path $installerPath)) {
    Write-Host "Warning: Installer file not found at expected location: $installerPath" -ForegroundColor Yellow
    Write-Host "Checking release directory..." -ForegroundColor Yellow
    Get-ChildItem "release\*.exe" | ForEach-Object { Write-Host "Found: $($_.Name)" -ForegroundColor Cyan }
    Write-Host ""
}

# Ask if user wants to create GitHub release
Write-Host ""
$createRelease = Read-Host "Create GitHub release? (y/N)"
if ($createRelease -eq "y" -or $createRelease -eq "Y") {
    # Ensure GitHub CLI is in PATH
    $env:PATH += ";C:\Program Files\GitHub CLI"
    
    Write-Host "Creating GitHub release v$newVersion..." -ForegroundColor Green
    
    # Create GitHub release and upload installer
    gh release create "v$newVersion" `
        --title "AvaTax MCP Server v$newVersion" `
        --notes "$ReleaseNotes" `
        "$installerPath"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Success! Release v$newVersion created successfully!" -ForegroundColor Green
        Write-Host "View at: https://github.com/JoshMcMillen/avatax-mcp-server/releases" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to create GitHub release" -ForegroundColor Red
        Write-Host "You can create it manually or run the release script later." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Build completed! You can create a release later using:" -ForegroundColor Yellow
    Write-Host "scripts\create-release.ps1 -Version $newVersion" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Version $newVersion is ready!" -ForegroundColor Green
