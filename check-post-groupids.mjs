#!/usr/bin/env node
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./scripts/service-account.json', 'utf-8'))

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

async function main() {
  console.log('🔍 Checking plantbookPosts for pollinators crew...\n')

  const groupId = 'mQLgaSjLZ9d3n7I0kM9j'
  const slug = 'pollinators-crew'

  // Check posts by actual groupId
  const postsByIdSnapshot = await db
    .collection('plantbookPosts')
    .where('groupId', '==', groupId)
    .limit(5)
    .get()

  console.log(`📊 Posts with groupId="${groupId}": ${postsByIdSnapshot.size}`)
  postsByIdSnapshot.forEach((doc) => {
    console.log(`  - ${doc.id}: groupId="${doc.data().groupId}"`)
  })

  // Check posts by slug (if any were mistakenly created with slug)
  const postsBySlugSnapshot = await db
    .collection('plantbookPosts')
    .where('groupId', '==', slug)
    .limit(5)
    .get()

  console.log(`\n📊 Posts with groupId="${slug}": ${postsBySlugSnapshot.size}`)
  postsBySlugSnapshot.forEach((doc) => {
    console.log(`  - ${doc.id}: groupId="${doc.data().groupId}"`)
  })

  console.log('\n✅ Done')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
