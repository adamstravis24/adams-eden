# Ensures ADB reverse is set up and opens the Expo dev client to the local Metro server.
param(
  [string]$Port = "8081",
  # NOTE: This must match the scheme embedded in your installed dev client. If in doubt, try the slug ("adams-eden-app").
  [string]$Scheme = "adams-eden-app",
  [string]$Package = "com.adamseden.gardenapp"
)

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  Write-Error "ADB not found at $adb. Install Android Platform Tools or update the path."
  exit 1
}

# Verify device connected
$devices = & $adb devices | Select-String -Pattern "\tdevice$"
if (-not $devices) {
  Write-Error "No Android device connected. Plug in a device and enable USB debugging."
  exit 1
}

# Set up reverse port mappings commonly used by RN/Expo
& $adb reverse tcp:$Port tcp:$Port | Out-Null            # Metro bundle
& $adb reverse tcp:19000 tcp:19000 | Out-Null            # Legacy expo URL
& $adb reverse tcp:19001 tcp:19001 | Out-Null            # Legacy expo manifest/devtools
& $adb reverse tcp:8097 tcp:8097   | Out-Null            # Hermes inspector
Write-Host "ADB reverse set: [8081,19000,19001,8097] -> host"

# Construct deep link for dev client (use http URL inside the query for dev-client)
$bundleUrl = "http://127.0.0.1:$Port"
$deeplink = "exp+${Scheme}://expo-development-client/?url=$bundleUrl"

Write-Host "Opening dev client with: $deeplink"

# Launch the intent
& $adb shell am start -a android.intent.action.VIEW -d $deeplink $Package | Out-Host
