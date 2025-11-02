import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const [, , uidArg] = process.argv

if (!uidArg) {
  console.error('Usage: node scripts/setModeratorClaim.mjs <firebase-uid>')
  process.exit(1)
}

const defaultPath = '../scripts/service-account.json'
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultPath

let serviceAccount

try {
  const filePath = resolve(serviceAccountPath)
  const raw = readFileSync(filePath, 'utf8')
  serviceAccount = JSON.parse(raw)
} catch (error) {
  console.error('Failed to load service account JSON. Set FIREBASE_SERVICE_ACCOUNT_PATH or place service-account.json in scripts/.')
  console.error(error)
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount),
})

async function main() {
  try {
    await getAuth().setCustomUserClaims(uidArg, { roles: ['plantbookModerator'] })
    console.log(`Moderator claim applied to ${uidArg}`)
  } catch (error) {
    console.error('Failed to set custom claims')
    console.error(error)
    process.exit(1)
  }
}

main()
