#!/usr/bin/env node
/*
  verify-android-env.mjs
  Quick diagnostics for Android + Expo dev on Windows
*/
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const isWin = process.platform === 'win32';

function log(ok, msg) {
  const prefix = ok ? '✓' : '✗';
  console.log(`${prefix} ${msg}`);
}

function tryExec(cmd, args = []) {
  try {
    const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf-8' });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(res.stderr || `Non-zero exit: ${res.status}`);
    return res.stdout.trim();
  } catch (e) {
    return undefined;
  }
}

function which(exe) {
  try {
    if (isWin) {
      const out = execSync(`where ${exe}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      return out.split(/\r?\n/)[0];
    }
    const out = execSync(`which ${exe}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

// Paths
const HOME = process.env.USERPROFILE || process.env.HOME || '';
const LOCALAPP = process.env.LOCALAPPDATA || '';
const ANDROID_SDK = process.env.ANDROID_SDK_ROOT || join(LOCALAPP, 'Android', 'Sdk');
const EMULATOR = join(ANDROID_SDK, 'emulator', 'emulator.exe');
const ADB = join(ANDROID_SDK, 'platform-tools', 'adb.exe');
const DEBUG_KEYSTORE = join(HOME, '.android', 'debug.keystore');
const APP_ROOT = process.cwd();
const GOOGLE_SERVICES = join(APP_ROOT, 'google-services.json');

console.log('— Verifying Android dev environment —');

// Node version
try {
  const v = process.versions.node;
  const ok = Number(v.split('.')[0]) >= 20;
  log(ok, `Node.js ${v} (>= 20 recommended)`);
} catch {
  log(false, 'Node.js version not detected');
}

// Java (JDK)
const javaPath = which('java');
log(!!javaPath, javaPath ? `Java found at ${javaPath}` : 'Java not found on PATH');

// Android SDK
log(existsSync(ANDROID_SDK), `Android SDK at ${ANDROID_SDK}`);
log(existsSync(EMULATOR), existsSync(EMULATOR) ? `Emulator binary at ${EMULATOR}` : 'Emulator not found');
log(existsSync(ADB), existsSync(ADB) ? `ADB at ${ADB}` : 'ADB not found');

// ADB devices
if (existsSync(ADB)) {
  const out = tryExec(ADB, ['devices']);
  if (!out) {
    log(false, 'ADB devices: failed to run');
  } else {
    const lines = out.split(/\r?\n/).slice(1).filter(Boolean);
    log(true, `ADB devices: ${lines.length} device(s)`);
  }
}

// Debug keystore
log(existsSync(DEBUG_KEYSTORE), existsSync(DEBUG_KEYSTORE) ? `Debug keystore present (${DEBUG_KEYSTORE})` : 'Missing debug keystore');

// google-services.json
if (!existsSync(GOOGLE_SERVICES)) {
  log(false, 'google-services.json missing in app root');
} else {
  try {
    const json = JSON.parse(readFileSync(GOOGLE_SERVICES, 'utf8'));
    const hasClient = Array.isArray(json.client) && json.client.length > 0;
    log(hasClient, hasClient ? 'google-services.json looks valid' : 'google-services.json present but no client entries');
  } catch (e) {
    log(false, `google-services.json unreadable: ${e.message}`);
  }
}

// Expo CLI
const expoCli = which('expo');
log(!!expoCli, expoCli ? `Expo CLI at ${expoCli}` : 'Expo CLI not found on PATH');

console.log('\nTips:');
console.log('- Ensure the Android emulator is created in Android Studio (Device Manager).');
console.log('- Start Metro with: npm run start:tunnel:clear (or start:clear on LAN).');
console.log('- If port 8081 is busy, Expo will pick an alternate port automatically.');
