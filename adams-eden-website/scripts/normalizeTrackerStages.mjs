#!/usr/bin/env node
/**
 * Normalize tracker stages in Firestore to "vegetative growth/flowering".
 *
 * - Updates users/{uid}/tracker/{docId} docs:
 *   - currentStage
 *   - milestones[].name
 * - Safe by default: use --dry-run to preview, remove to write changes
 * - Scope by user: --user <uid> (otherwise processes all users)
 * - Service account:
 *    - Reads GOOGLE_APPLICATION_CREDENTIALS if set
 *    - Else tries common local path ../../Plantbook project/scripts/service-account.json
 */

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import process from 'node:process'
import admin from 'firebase-admin'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { dryRun: false, user: null, output: null, creds: null }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--dry-run' || a === '--dryrun' || a === '-n') opts.dryRun = true
    else if (a === '--user' || a === '-u') {
      opts.user = args[i + 1] || null
      i++
    } else if (a === '--output' || a === '-o') {
      opts.output = args[i + 1] || null
      i++
    } else if (a === '--creds' || a === '--credential' || a === '--service-account') {
      opts.creds = args[i + 1] || null
      i++
    }
  }
  return opts
}

function normalizeStageName(value) {
  if (!value) return value
  const t = String(value).toLowerCase().trim()
  if (!t) return value
  // Any variant mentioning flowering should normalize
  if (t === 'flowering' || t === 'vegetative growth' || t.includes('flowering')) {
    return 'vegetative growth/flowering'
  }
  return value
}

function pickServiceAccountPath(opts) {
  // 0) Explicit --creds
  if (opts?.creds) {
    const p = path.resolve(process.cwd(), opts.creds)
    console.log(`• Trying --creds path: ${p} ${fs.existsSync(p) ? '(found)' : '(missing)'}`)
    if (fs.existsSync(p)) return p
  }
  // 1) Respect GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(`• Using GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`)
    return process.env.GOOGLE_APPLICATION_CREDENTIALS
  }
  // 2) Try common local path used in this repo
  const candidate = path.resolve(__dirname, '../../Plantbook project/scripts/service-account.json')
  console.log(`• Checking repo service account at: ${candidate} ${fs.existsSync(candidate) ? '(found)' : '(missing)'}`)
  if (fs.existsSync(candidate)) return candidate
  return null
}

async function ensureFirebase(opts) {
  if (admin.apps.length > 0) return
  const saPath = pickServiceAccountPath(opts)
  if (saPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    console.log('• Initialized Firebase Admin with explicit service account')
    return
  }
  // Try application default as a fallback (gcloud, env-provided, etc.)
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() })
    console.log('• Initialized Firebase Admin with application default credentials')
  } catch (err) {
    throw new Error('Could not locate credentials. Use --creds <path> or set GOOGLE_APPLICATION_CREDENTIALS.')
  }
}

async function processUser(db, uid, opts, changesOut) {
  const trackerRef = db.collection('users').doc(uid).collection('tracker')
  const snap = await trackerRef.get()
  if (snap.empty) {
    return { docsChecked: 0, docsUpdated: 0, milestonesUpdated: 0, stagesUpdated: 0 }
  }

  let docsUpdated = 0
  let milestonesUpdated = 0
  let stagesUpdated = 0

  const batch = db.batch()
  let opsInBatch = 0

  for (const doc of snap.docs) {
    const data = doc.data() || {}
    let changed = false
    const updates = {}

    // currentStage
    const normalizedStage = normalizeStageName(data.currentStage)
    if (normalizedStage && normalizedStage !== data.currentStage) {
      updates.currentStage = normalizedStage
      stagesUpdated++
      changed = true
    }

    // milestones[].name
    if (Array.isArray(data.milestones)) {
      const newMilestones = data.milestones.map((m) => {
        if (!m || typeof m !== 'object') return m
        const newName = normalizeStageName(m.name)
        if (newName && newName !== m.name) {
          milestonesUpdated++
          return { ...m, name: newName }
        }
        return m
      })
      // Only set if something actually changed
      const changedMilestones = JSON.stringify(newMilestones) !== JSON.stringify(data.milestones)
      if (changedMilestones) {
        updates.milestones = newMilestones
        changed = true
      }
    }

    if (changed) {
      docsUpdated++
      if (Array.isArray(changesOut)) {
        changesOut.push({
          userId: uid,
          docId: doc.id,
          path: `users/${uid}/tracker/${doc.id}`,
          before: {
            currentStage: data.currentStage ?? null,
            milestones: Array.isArray(data.milestones) ? data.milestones.map(m => ({ name: m?.name ?? null })) : []
          },
          after: {
            currentStage: updates.currentStage ?? data.currentStage ?? null,
            milestones: (updates.milestones ?? data.milestones ?? []).map(m => ({ name: m?.name ?? null }))
          }
        })
      }
      if (!opts.dryRun) {
        batch.update(doc.ref, updates)
        opsInBatch++
        if (opsInBatch >= 450) { // keep below 500 op limit
          await batch.commit()
          opsInBatch = 0
        }
      }
    }
  }

  if (!opts.dryRun && opsInBatch > 0) {
    await batch.commit()
  }

  return { docsChecked: snap.size, docsUpdated, milestonesUpdated, stagesUpdated }
}

async function main() {
  const opts = parseArgs()
  await ensureFirebase(opts)
  const db = admin.firestore()

  const start = Date.now()
  console.log(`\n▶ Normalizing tracker stages ${opts.dryRun ? '(dry run)' : ''}`)

  const usersRef = db.collection('users')
  const usersSnap = opts.user
    ? { docs: [await usersRef.doc(opts.user).get()] }
    : await usersRef.get()

  let totalChecked = 0
  let totalUpdated = 0
  let totalMilestones = 0
  let totalStages = 0

  const changes = []
  for (const userDoc of usersSnap.docs) {
    if (!userDoc.exists) continue
    const uid = userDoc.id
    const { docsChecked, docsUpdated, milestonesUpdated, stagesUpdated } = await processUser(db, uid, opts, changes)
    totalChecked += docsChecked
    totalUpdated += docsUpdated
    totalMilestones += milestonesUpdated
    totalStages += stagesUpdated
    console.log(`  • ${uid}: checked ${docsChecked}, updated ${docsUpdated} (milestones ${milestonesUpdated}, stages ${stagesUpdated})`)
  }

  console.log(`\nDone in ${Math.round((Date.now() - start) / 1000)}s.`)
  console.log(`Checked: ${totalChecked} docs, Updated: ${totalUpdated} docs (milestones ${totalMilestones}, stages ${totalStages})`)

  if (opts.output) {
    const outPath = path.resolve(process.cwd(), opts.output)
    fs.writeFileSync(outPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      checked: totalChecked,
      updated: totalUpdated,
      changes
    }, null, 2))
    console.log(`\nWrote changeset to ${outPath}`)
  }

  if (opts.dryRun) {
    console.log('\nDry-run complete. Re-run without --dry-run to apply changes.')
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
