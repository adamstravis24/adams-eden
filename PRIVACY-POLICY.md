# Adams Eden Privacy Policy

Last updated: 2025-11-07

Adams Eden ("the App") respects your privacy. This policy explains what data we collect, how we use it, and the choices you have. By using the App you consent to the practices described here.

## 1. Data We Collect
We collect only the minimum data required to provide core functionality:

### Account & Authentication
- Firebase Authentication UID
- Email (if you sign up with email/password or a provider that shares it)

### Subscription & Billing
- Stripe Customer ID and Subscription status fields (active, cancel_at_period_end, current period timestamps) stored in Firebase Realtime Database to gate premium features.

### Usage & Preferences
- Non-sensitive in-app settings stored locally on your device (AsyncStorage / SecureStore) for convenience.

### Push Notifications (If Enabled)
- Device push token (Expo/Firebase Cloud Messaging) used only to send relevant alerts you opt into.

### Images / Camera
The App requests `android.permission.CAMERA` solely to allow you to capture plant‑related photos or upload images for your personal garden tracking. Captured images stay on your device unless you explicitly choose to upload or share them. We do not automatically transmit camera content.

## 2. How We Use Data
| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| Account access | Firebase UID, Email | Performance of service |
| Subscription gating | Stripe subscription metadata | Performance of service |
| Notifications you opt into | Push token | Consent |
| Photo capture | Camera permission, image you take | Consent |

We do NOT sell your data. We do NOT use third‑party advertising SDKs.

## 3. Data Sharing
We share data only with service providers essential to functionality:
- Firebase (Authentication, Realtime Database)
- Stripe (Subscription billing)
Providers process data under their own privacy policies and are restricted to service delivery.

## 4. Data Retention
- Subscription records: retained while your account exists for billing history.
- Auth account: kept until you delete your account (contact support or use any provided in‑app deletion flow when available).
- Push tokens: deleted when you log out or revoke notification permission.

## 5. Security
We use industry-standard TLS for data in transit and Firebase’s managed infrastructure for data at rest. Access controls limit operations to authorized server functions.

## 6. Your Choices & Controls
- Revoke notifications: Disable in device settings.
- Camera permission: You can deny or revoke; core non-photo features still work.
- Account deletion: Contact support at privacy@adamseden.example (replace with your real address) to request deletion until self‑serve deletion is implemented.

## 7. Children’s Privacy
The App is not directed to children under 13. If we learn we unknowingly collected data from a child, we will delete it.

## 8. International Users
Data may be processed in the United States. By using the App you consent to cross-border transfer.

## 9. Changes to This Policy
Material changes will be announced via an in‑app notice or version release notes.

## 10. Contact
Questions or requests: privacy@adamseden.example (replace with active monitored email).

---
This document is provided for compliance with Google Play policy regarding CAMERA usage. Keep it updated as features evolve.
