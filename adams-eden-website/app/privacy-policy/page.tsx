import React from 'react';

export const metadata = {
  title: 'Privacy Policy | Adams Eden',
  description: 'How Adams Eden collects and uses data including camera permission usage.'
};

export default function PrivacyPolicyPage() {
  return (
    <main className="prose mx-auto px-4 py-8">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: 2025-11-07</em></p>
      <p>Adams Eden ("the App") respects your privacy. This page explains what data we collect, how we use it, and the choices you have. By using the App you consent to the practices described here.</p>
      <h2>1. Data We Collect</h2>
      <h3>Account & Authentication</h3>
      <ul>
        <li>Firebase Authentication UID</li>
        <li>Email (if provided by your auth method)</li>
      </ul>
      <h3>Subscription & Billing</h3>
      <ul>
        <li>Stripe customer & subscription metadata (status, period dates, cancellation flags)</li>
      </ul>
      <h3>Usage & Preferences</h3>
      <ul>
        <li>Local settings stored on your device (AsyncStorage / SecureStore)</li>
      </ul>
      <h3>Push Notifications (If Enabled)</h3>
      <ul>
        <li>Device push token used only for opted-in alerts</li>
      </ul>
      <h3>Images / Camera</h3>
      <p>The App requests <code>android.permission.CAMERA</code> solely so you can capture plant photos or upload images for personal garden tracking. Images remain on your device unless you explicitly upload or share them. We do not automatically transmit camera content.</p>
      <h2>2. How We Use Data</h2>
      <table>
        <thead>
          <tr><th>Purpose</th><th>Data Used</th><th>Legal Basis</th></tr>
        </thead>
        <tbody>
          <tr><td>Account access</td><td>Firebase UID, Email</td><td>Performance of service</td></tr>
          <tr><td>Subscription gating</td><td>Stripe subscription metadata</td><td>Performance of service</td></tr>
          <tr><td>Notifications</td><td>Push token</td><td>Consent</td></tr>
          <tr><td>Photo capture</td><td>Camera permission & captured image</td><td>Consent</td></tr>
        </tbody>
      </table>
      <p>We do <strong>not</strong> sell your data. We do <strong>not</strong> use third‑party advertising SDKs.</p>
      <h2>3. Data Sharing</h2>
      <ul>
        <li>Firebase (Auth & Realtime Database)</li>
        <li>Stripe (Billing)</li>
      </ul>
      <p>Providers process data under their own privacy policies and are restricted to service delivery.</p>
      <h2>4. Data Retention</h2>
      <ul>
        <li>Subscription records retained while account exists.</li>
        <li>Auth data retained until account deletion request.</li>
        <li>Push tokens removed after logout or permission revocation.</li>
      </ul>
      <h2>5. Security</h2>
      <p>TLS protects data in transit. Firebase infrastructure stores data at rest. Access is restricted to authorized server operations.</p>
      <h2>6. Your Choices & Controls</h2>
      <ul>
        <li>Disable notifications in device settings.</li>
        <li>Revoke camera permission any time (non-photo features still work).</li>
        <li>Request account deletion: <a href="mailto:privacy@adamseden.example">privacy@adamseden.example</a>.</li>
      </ul>
      <h2>7. Children’s Privacy</h2>
      <p>Not directed to children under 13. We delete data if discovered from a child.</p>
      <h2>8. International Users</h2>
      <p>Data may be processed in the United States; by using the App you consent to cross-border transfer.</p>
      <h2>9. Changes</h2>
      <p>Material changes posted via in‑app notice or release notes.</p>
      <h2>10. Contact</h2>
      <p>Email questions: <a href="mailto:privacy@adamseden.example">privacy@adamseden.example</a>.</p>
    </main>
  );
}
