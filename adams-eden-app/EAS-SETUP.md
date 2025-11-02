# EAS Build & Submit Setup (Expo)

This project is ready for Expo Application Services (EAS) builds. Follow these steps to create your first builds.

## Prerequisites
- Expo account
- Android/iOS developer accounts for Store submission (optional for internal/dev builds)
- Node 18+

## 1) Login and initialize the EAS project

```powershell
npm run eas:login
npm run eas:init
```

During `eas init`, choose this folder as the project root and accept creating the EAS project. The command will:
- Create/update the remote EAS project
- Set `extra.eas.projectId` in `app.json`
- Configure `updates.url` (if EAS Updates enabled later)

If the projectId isn't injected automatically, update `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "<THE_UUID_FROM_EAS>"
      }
    }
  }
}
```

## 2) Set app identifiers
Already set:
- iOS bundle identifier: `com.adamseden.gardenapp`
- Android package: `com.adamseden.gardenapp`

Adjust if needed in `app.json` under `ios.bundleIdentifier` and `android.package`.

## 3) Development builds (internal testing)
Create a dev client build you can install directly:

```powershell
npm run eas:dev:android
npm run eas:dev:ios
```

Install the resulting build file on your device/emulator/simulator. These builds include a development client for debugging.

## 4) Preview builds (internal distribution)
For internal QA/testing without dev client:

```powershell
npm run eas:preview:android
npm run eas:preview:ios
```

## 5) Production builds
When you’re ready for store submission:

```powershell
npm run eas:prod:android
npm run eas:prod:ios
```

`eas.json` enables auto-incrementing versions for production builds.

## 6) Store submission
With credentials configured (EAS can manage them), submit directly:

```powershell
npm run eas:submit:android
npm run eas:submit:ios
```

## Notes
- Dev client requires `expo-dev-client` if you need native debugging of arbitrary JS bundles. Managed builds here work without extra changes.
- If you plan to use EAS Updates (OTA), we can enable `updates` and set a `runtimeVersion` policy.
- If you need OAuth (e.g., Google Sign-In), we’ve set a custom scheme `adamseden`. We can wire deep links or AuthSession configs as needed.
- Firebase client SDK works in managed workflow. If you add native Firebase features (Messaging/Crashlytics), we’ll add the proper config plugins.
