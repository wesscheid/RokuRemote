; Roku AI Remote - Global Hotkeys
; Requires AutoHotkey v2.0+

#Requires AutoHotkey v2.0
#SingleInstance Force

; ==============================================================================
; CONFIGURATION
; ==============================================================================
; TODO: REPLACE THIS WITH YOUR ACTUAL ROKU IP ADDRESS
RokuIP := "192.168.0.5" 
; ==============================================================================

; HOTKEY: Alt + 1
!1::
{
    ; Visual feedback in Windows Tray
    TrayTip "Roku Remote", "Powering on and switching to HDMI 1...", 1
    
    try {
        ; 1. Power On (Try PowerOn first, fall back to Power if needed)
        SendRokuCommand("keypress/PowerOn")
        
        ; 2. Wait for TV to wake (3.5 seconds is usually safe for cold boot)
        Sleep(3500)
        
        ; 3. Switch Input to HDMI 1
        SendRokuCommand("launch/tvinput.hdmi1")
        
    } catch as e {
        TrayTip "Roku Error", "Failed to connect to Roku at " . RokuIP, 3
    }
}

; HOTKEY: Alt + 2
!2::
{
    ; Visual feedback in Windows Tray
    TrayTip "Roku Remote", "Powering off...", 1
    
    try {
        ; Power Off
        SendRokuCommand("keypress/PowerOff")
    } catch as e {
        TrayTip "Roku Error", "Failed to connect to Roku at " . RokuIP, 3
    }
}

; HOTKEY: Alt + 3
!3::
{
    ; Visual feedback in Windows Tray
    TrayTip "Roku Remote", "Turning Picture Off (Macro)...", 1
    
    try {
        ; 1. Open Options Menu (*)
        SendRokuCommand("keypress/Info")
        Sleep(500)
        
        ; 2. Navigate down 4 times to "Picture Off" (Verify count on your specific TV)
        Loop 4 {
            SendRokuCommand("keypress/Down")
            Sleep(250)
        }
        
        ; 3. Select
        SendRokuCommand("keypress/Select")
        
    } catch as e {
        TrayTip "Roku Error", "Failed to connect to Roku at " . RokuIP, 3
    }
}

; Helper Function to send POST requests
SendRokuCommand(endpoint) {
    url := "http://" . RokuIP . ":8060/" . endpoint
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("POST", url, true)
        whr.Send()
        whr.WaitForResponse()
    }
}
