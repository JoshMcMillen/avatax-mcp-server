# PowerShell script to build and create GitHub release from VS Code
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$ReleaseNotes = "New release of AvaTax MCP Server"
)

Write-Host "Building AvaTax MCP Server v$Version..." -ForegroundColor Green

# Build the application
npm run electron:build-unsigned

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green

# Check if release files exist
$installerPath = "release\AvaTax MCP Server Setup $Version.exe"
if (-not (Test-Path $installerPath)) {
    Write-Host "Installer file not found: $installerPath" -ForegroundColor Red
    exit 1
}

Write-Host "Creating GitHub release v$Version..." -ForegroundColor Green

# Create GitHub release and upload installer
gh release create "v$Version" `
    --title "AvaTax MCP Server v$Version" `
    --notes "$ReleaseNotes" `
    "$installerPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Release v$Version created successfully!" -ForegroundColor Green
    Write-Host "🔗 View at: https://github.com/JoshMcMillen/avatax-mcp-server/releases" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to create release" -ForegroundColor Red
    exit 1
}
