# Build and Test Guide - After Setting Firebase Secrets

## ✅ Step 1: Build Production App

Now that Firebase environment variables are set, build your production app:

```bash
npm run eas:prod:android
```

This will create an **Android App Bundle (AAB)** which is required for Google Play Store.

## ✅ Step 2: Download and Test Locally

**IMPORTANT**: Test the build on a real device before uploading to Play Store!

1. After the build completes, download the AAB file from EAS
2. Convert AAB to APK for testing (or use a test device with Play Store access):
   ```bash
   # Install bundletool (if not installed)
   # Download from: https://github.com/google/bundletool/releases
   
   # Convert AAB to APK
   bundletool build-apks --bundle=your-app.aab --output=your-app.apks --mode=universal
   bundletool install-apks --apks=your-app.apks
   ```

   **OR** use EAS to build a test APK:
   ```bash
   # Build APK for testing (easier)
   npx eas-cli build -p android --profile production --local
   # Then modify eas.json temporarily to use "apk" instead of "app-bundle"
   ```

3. Install on a physical Android device
4. Test that the app:
   - Opens without crashing
   - Firebase authentication works
   - All features function correctly
   - No console errors

## ✅ Step 3: Check Logs (If Issues)

If the app still crashes, check device logs:

```bash
# Connect device via USB
adb logcat | grep -i "error\|exception\|fatal\|firebase"
```

Look for:
- Firebase initialization errors
- Missing environment variables
- ProGuard/minification issues
- Native module errors

## ✅ Step 4: Upload to Play Store

Once you've verified the app works:

1. Go to Google Play Console
2. Create a new release (or update existing)
3. Upload the AAB file from EAS
4. Complete the release process

## ✅ Step 5: Re-enable Minification (Optional)

After confirming the app works, you can re-enable minification to reduce app size:

1. Edit `app.config.js`
2. Change:
   ```javascript
   enableProguardInReleaseBuilds: false,  // Change to: true
   enableShrinkResourcesInReleaseBuilds: false,  // Change to: true
   ```
3. Rebuild and test again
4. If it works, you're good! If not, check ProGuard rules in `android/app/proguard-rules.pro`

## Troubleshooting

### App still crashes on launch
- Verify Firebase secrets are set: Check EAS dashboard or run `npx eas-cli env:list`
- Check device logs for specific error messages
- Verify all 6 Firebase environment variables are set correctly

### Build fails
- Check EAS build logs for errors
- Verify all dependencies are compatible
- Check for missing native modules

### App works but Firebase doesn't
- Double-check Firebase environment variables in EAS
- Verify Firebase project has Android app configured
- Check Firebase console for any restrictions

## What Was Fixed

1. ✅ **expo-dev-client excluded from production** - No longer crashes due to dev client in production builds
2. ✅ **Firebase env vars set in EAS** - App can now initialize Firebase
3. ✅ **ProGuard rules added** - Comprehensive rules for all native modules
4. ✅ **Android permissions added** - All required permissions included
5. ✅ **Minification disabled** - Temporarily disabled to isolate issues (can re-enable later)

## Next Build

For future builds, simply run:
```bash
npm run eas:prod:android
```

The build will automatically:
- Use Firebase secrets from EAS
- Exclude dev client from production
- Generate AAB for Play Store
- Increment version automatically (if configured)

