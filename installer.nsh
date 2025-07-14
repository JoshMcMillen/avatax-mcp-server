; Custom NSIS installer script for AvaTax MCP Server
; Handles detection of running instances and existing installations

!include "MUI2.nsh"
!include "FileFunc.nsh"

; Variables
Var /GLOBAL IsUpgrade
Var /GLOBAL OldVersion

; Get version from package.json or use default
!ifndef VERSION
  !define VERSION "1.0.2"
!endif

; Function to check if application is running using tasklist
Function CheckRunningApp
  ClearErrors
  
  ; Check for AvaTax MCP Server executable
  nsExec::Exec 'tasklist /FI "IMAGENAME eq AvaTax MCP Server.exe" | find "AvaTax MCP Server.exe"'
  Pop $0
  
  ; Also check for electron processes that might be running the app
  ${If} $0 != 0
    nsExec::Exec 'tasklist /FI "IMAGENAME eq electron.exe" | find "electron.exe"'
    Pop $0
  ${EndIf}
  
  ${If} $0 = 0
    ; Try graceful shutdown first
    DetailPrint "Attempting to close AvaTax MCP Server gracefully..."
    nsExec::ExecToLog 'taskkill /IM "AvaTax MCP Server.exe" /T'
    Sleep 2000
    
    ; Force kill electron processes
    nsExec::ExecToLog 'taskkill /F /IM "electron.exe" /T'
    Sleep 1000
    
    ; Force kill any remaining AvaTax processes
    nsExec::ExecToLog 'taskkill /F /IM "AvaTax MCP Server.exe" /T'
    Sleep 1000
    
    DetailPrint "Application processes terminated."
  ${EndIf}
FunctionEnd

; Function to detect existing installation
Function DetectExistingInstall
  ; Check registry for existing installation
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AvaTax MCP Server" "DisplayVersion"
  ${If} $R0 != ""
    StrCpy $IsUpgrade "true"
    StrCpy $OldVersion $R0
  ${Else}
    ; Check for existing installation in common locations
    ${If} ${FileExists} "$PROGRAMFILES64\AvaTax MCP Server\AvaTax MCP Server.exe"
      StrCpy $IsUpgrade "true"
      StrCpy $OldVersion "Unknown"
    ${ElseIf} ${FileExists} "$PROGRAMFILES\AvaTax MCP Server\AvaTax MCP Server.exe"
      StrCpy $IsUpgrade "true"
      StrCpy $OldVersion "Unknown"
    ${ElseIf} ${FileExists} "$LOCALAPPDATA\Programs\AvaTax MCP Server\AvaTax MCP Server.exe"
      StrCpy $IsUpgrade "true"
      StrCpy $OldVersion "Unknown"
    ${Else}
      StrCpy $IsUpgrade "false"
    ${EndIf}
  ${EndIf}
  
  ; Handle existing installation
  ${If} $IsUpgrade == "true"
    ${If} $OldVersion != "Unknown"
      MessageBox MB_YESNO|MB_ICONQUESTION "An existing installation of AvaTax MCP Server (version $OldVersion) was detected.$\n$\nDo you want to upgrade to the new version?" /SD IDYES IDNO UserAbort2
    ${Else}
      MessageBox MB_YESNO|MB_ICONQUESTION "An existing installation of AvaTax MCP Server was detected.$\n$\nDo you want to upgrade to the new version?" /SD IDYES IDNO UserAbort2
    ${EndIf}
    
    ; Backup user configuration
    ${If} ${FileExists} "$APPDATA\AvaTax MCP Server\config.json"
      DetailPrint "Backing up user configuration..."
      CreateDirectory "$TEMP\AvaTax_Backup"
      CopyFiles "$APPDATA\AvaTax MCP Server\config.json" "$TEMP\AvaTax_Backup\config.json"
    ${EndIf}
    Return
    
    UserAbort2:
    MessageBox MB_OK|MB_ICONINFORMATION "Installation cancelled by user."
    Quit
  ${Else}
    MessageBox MB_OK|MB_ICONINFORMATION "Welcome to the AvaTax MCP Server installer!$\n$\nThis will install AvaTax MCP Server on your computer."
  ${EndIf}
FunctionEnd

; Custom pre-directory page function
Function CustomPreDirectory
  Call CheckRunningApp
  Call DetectExistingInstall
FunctionEnd

; Override the directory page to include our custom logic
!define MUI_PAGE_CUSTOMFUNCTION_PRE CustomPreDirectory
!insertmacro MUI_PAGE_DIRECTORY

; Function called after successful installation  
Function .onInstSuccess
  ; Restore backed up configuration
  ${If} ${FileExists} "$TEMP\AvaTax_Backup\config.json"
    DetailPrint "Restoring user configuration..."
    CreateDirectory "$APPDATA\AvaTax MCP Server"
    CopyFiles "$TEMP\AvaTax_Backup\config.json" "$APPDATA\AvaTax MCP Server\config.json"
    RMDir /r "$TEMP\AvaTax_Backup"
  ${EndIf}
  
  ; Set install/upgrade flags for the application to detect
  ${If} $IsUpgrade == "true"
    ; Mark as upgrade - app will open config tab
    WriteRegStr HKCU "Software\AvaTax MCP Server" "PostUpgrade" "true"
    WriteRegStr HKCU "Software\AvaTax MCP Server" "FromVersion" "$OldVersion"
  ${Else}
    ; Mark as first install - app will open config tab
    WriteRegStr HKCU "Software\AvaTax MCP Server" "FirstRun" "true"
  ${EndIf}
  
  ; Write current version for future upgrades
  WriteRegStr HKCU "Software\AvaTax MCP Server" "Version" "${VERSION}"
  
  ; Don't show blocking message box - let the installer complete naturally
  ; The application will handle showing appropriate messages when it launches
FunctionEnd
