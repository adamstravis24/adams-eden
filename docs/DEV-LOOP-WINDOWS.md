# Adams Eden – Android dev loop (Windows)

This is a quick-reference for running the Expo app reliably on Windows with an Android emulator.

## Prereqs
- JDK 21 installed and on PATH
- Android Studio with SDK + Platform Tools
- At least one AVD created (e.g., Medium_Phone)
- Expo CLI installed (npx expo is fine)
- `adams-eden-app/google-services.json` present
- `.env` created from `.env.example` with Firebase keys

## Typical workflow
1. Launch the Android emulator from Android Studio (Device Manager) or with a helper script.
2. From `adams-eden-app`, start Metro using a tunnel and clear cache when switching projects:
   - `npm run start:tunnel:clear`
3. If port 8081 is busy, Expo will choose another port (e.g., 8083). The dev client will connect automatically.
4. Build/install the dev client when native modules change:
   - `npm run android` (same as `expo run:android`)
5. Use email/password or biometrics to log in. Google Sign-In is intentionally hidden.

## Troubleshooting
- Run a quick environment check:
  - `npm run android:verify`
- If Metro is misbehaving, restart it with cache clear:
  - `npm run start:clear` (LAN) or `npm run start:tunnel:clear`
- Ensure `google-services.json` is at `adams-eden-app/google-services.json` and that `app.json` points to `./google-services.json`.
- If ADB cannot see the emulator, open Android Studio > Device Manager and boot the device, then rerun the start script.

## Notifications (Android)
- On first launch after this change, Android will ask for notification permission.
- Watering reminders: scheduled locally based on your tracked plants’ watering interval and last watered time (default 9:00 AM next due day).
- Freeze/frost alerts: the app registers a background task that checks the 7‑day forecast roughly every few hours and posts a local notification if tonight’s low is ≤ 36°F (frost risk) or ≤ 32°F (freeze).
- Note: Background execution timing is controlled by the OS; exact check times may vary. On some devices, battery optimizations can delay background tasks.

## Google Sign-In (paused)
- The UI button is hidden on purpose. To re-enable later:
  - Add your SHA‑1 to Firebase Android app and download a `google-services.json` containing an `android` client entry (`client_type: 1`).
  - Confirm OAuth: Web client allowed origins `https://auth.expo.io` and redirect `https://auth.expo.io/@adamst2020/adams-eden-app`.
  - Flip the feature flag in `.env` (EXPO_PUBLIC_GOOGLE_SIGNIN_ENABLED=true) and rebuild the dev client if needed.
