!include "MUI2.nsh"

Name "QuadDown"
OutFile "QuadDown-Setup.exe"
InstallDir "$PROGRAMFILES64\QuadDown"
RequestExecutionLevel admin

!define MUI_ICON "readme\logo\ico\QuadDown_256x.ico"
!define MUI_UNICON "readme\logo\ico\QuadDown_256x.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
    SetOutPath "$INSTDIR"
    File /r "*.*"
    
    CreateDirectory "$SMPROGRAMS\QuadDown"
    CreateShortcut "$SMPROGRAMS\QuadDown\QuadDown.lnk" "$INSTDIR\electron\app.js"
    CreateShortcut "$DESKTOP\QuadDown.lnk" "$INSTDIR\electron\app.js"
    
    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir /r "$INSTDIR"
    Delete "$SMPROGRAMS\QuadDown\*.*"
    RMDir "$SMPROGRAMS\QuadDown"
    Delete "$DESKTOP\QuadDown.lnk"
SectionEnd
