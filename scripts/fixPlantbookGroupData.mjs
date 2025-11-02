#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT_ENV = 'FIREBASE_SERVICE_ACCOUNT_PATH'
const WRITE_BATCH_LIMIT = 450

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadServiceAccount() {
  const configuredPath = process.env[SERVICE_ACCOUNT_ENV]
  const fallbackPath = path.resolve(__dirname, 'service-account.json')
  const resolvedPath = configuredPath
    ? path.resolve(configuredPath)
    : fallbackPath

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Service account JSON not found. Set ${SERVICE_ACCOUNT_ENV} or place service-account.json next to this script.`
    )
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8')
  return JSON.parse(raw)
}

function chunk(values, size) {
  const result = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}

async function buildGroupIndex(db) {
  const snapshot = await db.collection('plantbookGroups').get()
  const slugToId = new Map()
  const idToName = new Map()

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() ?? {}
    const docId = docSnap.id
    const name = typeof data.name === 'string' ? data.name : 'Plantbook circle'
    slugToId.set(docId, docId)
    idToName.set(docId, name)

    if (typeof data.slug === 'string') {
      const normalized = data.slug.trim()
      if (normalized) {
        slugToId.set(normalized, docId)
      }
    }
  })

  return { slugToId, idToName, total: snapshot.size }
}

async function fixPostGroupIds(db, slugToId, idToName) {
  const postsRef = db.collection('plantbookPosts')
  const snapshot = await postsRef.where('visibility', '==', 'group').get()
  const updates = []
  const missing = []

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() ?? {}
    const rawGroupId = typeof data.groupId === 'string' ? data.groupId.trim() : ''

    if (!rawGroupId) {
      missing.push({ id: docSnap.id, reason: 'groupId missing', visibility: data.visibility })
      return
    }

    const resolvedId = slugToId.get(rawGroupId) || null

    if (!resolvedId) {
      missing.push({ id: docSnap.id, reason: `No group match for "${rawGroupId}"`, visibility: data.visibility })
      return
    }

    if (resolvedId === rawGroupId) {
      return
    }

    updates.push({
      ref: docSnap.ref,
      from: rawGroupId,
      to: resolvedId,
      groupName: idToName.get(resolvedId) || data.groupName || null,
    })
  })

  for (const group of chunk(updates, WRITE_BATCH_LIMIT)) {
    const batch = db.batch()
    group.forEach((item) => {
      batch.update(item.ref, { groupId: item.to })
    })
    await batch.commit()
  }

  return {
    scanned: snapshot.size,
    updated: updates.length,
    unresolved: missing,
  }
}

async function fixMembershipDocuments(db, slugToId) {
  const membersRef = db.collection('plantbookGroupMembers')
  const snapshot = await membersRef.get()
  const existingIds = new Set(snapshot.docs.map((docSnap) => docSnap.id))

  const createRequests = []
  const updateRequests = []
  const skipped = []

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() ?? {}
    const [rawGroupKey = '', userId = ''] = docSnap.id.split('_', 2)

    if (!userId) {
      skipped.push({ id: docSnap.id, reason: 'Unable to parse userId from document ID' })
      return
    }

    const storedGroupId = typeof data.groupId === 'string' ? data.groupId.trim() : ''
    const resolvedFromId = slugToId.get(rawGroupKey) || null
    const resolvedFromField = storedGroupId ? slugToId.get(storedGroupId) || storedGroupId : null
    const finalGroupId = resolvedFromField || resolvedFromId || rawGroupKey

    if (!finalGroupId) {
      skipped.push({ id: docSnap.id, reason: 'Unable to resolve groupId' })
      return
    }

    const expectedId = `${finalGroupId}_${userId}`
    const payload = {
      groupId: finalGroupId,
      userId,
      role: typeof data.role === 'string' ? data.role : 'member',
      joinedAt: data.joinedAt ?? null,
    }

    if (expectedId === docSnap.id) {
      if (storedGroupId !== finalGroupId) {
        updateRequests.push({ ref: docSnap.ref, data: payload })
      }
      return
    }

    if (existingIds.has(expectedId)) {
      const targetRef = membersRef.doc(expectedId)
      updateRequests.push({ ref: targetRef, data: payload })
      return
    }

    const targetRef = membersRef.doc(expectedId)
    createRequests.push({ ref: targetRef, data: payload, sourceId: docSnap.id })
    existingIds.add(expectedId)
  })

  for (const group of chunk(updateRequests, WRITE_BATCH_LIMIT)) {
    const batch = db.batch()
    group.forEach((item) => {
      batch.update(item.ref, item.data)
    })
    await batch.commit()
  }

  for (const group of chunk(createRequests, WRITE_BATCH_LIMIT)) {
    const batch = db.batch()
    group.forEach((item) => {
      batch.set(item.ref, item.data, { merge: true })
    })
    await batch.commit()
  }

  return {
    scanned: snapshot.size,
    updated: updateRequests.length,
    created: createRequests.length,
    skipped,
  }
}

async function main() {
  console.log('Preparing Firebase Admin environment...')
  const serviceAccount = loadServiceAccount()

  initializeApp({
    credential: cert(serviceAccount),
  })

  const db = getFirestore()

  console.log('Indexing Plantbook circles...')
  const { slugToId, idToName, total } = await buildGroupIndex(db)
  console.log(`Indexed ${total} groups; mapped ${slugToId.size} identifiers.`)

  console.log('Normalizing group-bound posts...')
  const postResult = await fixPostGroupIds(db, slugToId, idToName)
  console.log(`Scanned ${postResult.scanned} group posts; updated ${postResult.updated}.`)
  if (postResult.unresolved.length > 0) {
    console.warn('Some posts could not be matched to a group ID:')
    postResult.unresolved.slice(0, 10).forEach((item) => {
      console.warn(` • ${item.id}: ${item.reason}`)
    })
    if (postResult.unresolved.length > 10) {
      console.warn(`   ...and ${postResult.unresolved.length - 10} more.`)
    }
  }

  console.log('Aligning membership documents...')
  const membershipResult = await fixMembershipDocuments(db, slugToId)
  console.log(
    `Scanned ${membershipResult.scanned} membership docs; updated ${membershipResult.updated}, created ${membershipResult.created}.`
  )
  if (membershipResult.skipped.length > 0) {
    console.warn('Some membership docs were skipped:')
    membershipResult.skipped.slice(0, 10).forEach((item) => {
      console.warn(` • ${item.id}: ${item.reason}`)
    })
    if (membershipResult.skipped.length > 10) {
      console.warn(`   ...and ${membershipResult.skipped.length - 10} more.`)
    }
  }

  console.log('Done. Review the logs above and rerun if additional groups are added later.')
}

main().catch((error) => {
  console.error('Failed to fix Plantbook group data:', error)
  process.exit(1)
})
