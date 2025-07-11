@echo off
echo Creating self-signed certificate for code signing...

REM Create certificate
powershell -Command "New-SelfSignedCertificate -Type CodeSigningCert -Subject 'CN=AvaTax MCP Server' -KeyUsage DigitalSignature -FriendlyName 'AvaTax MCP Code Signing' -CertStoreLocation 'Cert:\CurrentUser\My' -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3', '2.5.29.19={text}')"

REM Export certificate
powershell -Command "$cert = Get-ChildItem -Path 'Cert:\CurrentUser\My' | Where-Object {$_.Subject -match 'AvaTax MCP Server'}; $password = ConvertTo-SecureString -String 'avatax123' -Force -AsPlainText; Export-PfxCertificate -Cert $cert -FilePath '.\codesign-cert.p12' -Password $password"

echo Certificate created and exported to codesign-cert.p12
echo Password: avatax123
echo.
echo Now update your package.json with:
echo "certificateFile": "codesign-cert.p12",
echo "certificatePassword": "avatax123"
pause
