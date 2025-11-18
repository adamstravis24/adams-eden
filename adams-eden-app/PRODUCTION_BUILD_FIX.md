# Production Build Fix Guide

## Issues Fixed

1. **expo-dev-client in Production**: The dev client plugin was being included in production builds, which can cause crashes. Now it's conditionally included only in development builds via `app.config.js`.

2. **ProGuard Rules**: Added comprehensive ProGuard rules for all React Native libraries, Firebase, Expo modules, and native dependencies.

3. **Android Permissions**: Added missing permissions (CAMERA, etc.) to app.config.js.

4. **Build Configuration**: Updated EAS build configuration for production.

## Critical: Firebase Environment Variables

**⚠️ THIS IS THE MOST LIKELY CAUSE OF YOUR CRASH ⚠️**

Your app requires Firebase environment variables to be set in EAS. **If these are missing, the app will crash immediately on startup** because Firebase configuration validation happens at module load time, before the app can render any UI.

### Why This Causes Crashes

The `src/services/firebase.ts` file calls `validateFirebaseConfig()` at the top level (line 30), which throws an error if any Firebase env vars are missing. This happens before React Native can render any error screen, causing an immediate crash.

### Set Firebase Environment Variables

**Option 1: Use the setup script (recommended)**

**Windows (PowerShell):**
```powershell
.\scripts\setup-firebase-secrets.ps1
```

**Mac/Linux (Bash):**
```bash
chmod +x scripts/setup-firebase-secrets.sh
./scripts/setup-firebase-secrets.sh
```

**Option 2: Manual setup**

Run these commands to set your Firebase environment variables as EAS secrets:

```bash
# Replace with your actual Firebase values from Firebase Console
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-auth-domain"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-storage-bucket"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your-sender-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your-app-id"
```

**Where to find Firebase values:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Select your Android app (or create one if it doesn't exist)
6. Copy the config values

### Verify Secrets Are Set

```bash
eas secret:list
```

## Next Steps

1. **Set Firebase Environment Variables** (see above) - THIS IS CRITICAL
2. **Rebuild the production app**:
   ```bash
   npm run eas:prod:android
   ```
3. **Test the new build** before uploading to Play Store
4. **If the app works without minification**, re-enable it in `app.config.js`:
   - Change `enableProguardInReleaseBuilds: false` to `true`
   - Change `enableShrinkResourcesInReleaseBuilds: false` to `true`
   - Rebuild and test again

## Testing the Fix

1. Build a production APK/AAB:
   ```bash
   npm run eas:prod:android
   ```

2. Download and install the build on a device (not via Play Store initially)

3. Check if the app opens without crashing

4. If it still crashes, check device logs:
   ```bash
   adb logcat | grep -i "error\|exception\|fatal"
   ```

## Common Issues

### App crashes immediately on launch
- **Most likely cause**: Missing Firebase environment variables
- **Solution**: Set all `EXPO_PUBLIC_FIREBASE_*` secrets in EAS

### App crashes with ProGuard errors
- **Solution**: Minification is currently disabled. If you re-enable it and see errors, check the ProGuard rules in `android/app/proguard-rules.pro`

### App works in dev but not production
- **Check**: Firebase env vars are set in EAS secrets (not just local .env)
- **Check**: All native dependencies have ProGuard rules
- **Check**: No dev-only code is being executed in production

## Files Changed

- `app.config.js` - Created with conditional expo-dev-client plugin
- `app.json` - Removed expo-dev-client plugin (now handled in app.config.js)
- `android/app/proguard-rules.pro` - Added comprehensive ProGuard rules
- `eas.json` - Updated production build configuration

## Rollback

If you need to rollback, you can:
1. Delete `app.config.js`
2. Restore `app.json` to include expo-dev-client plugin
3. Revert ProGuard rules to minimal set

However, the Firebase environment variables MUST still be set in EAS for the app to work.

