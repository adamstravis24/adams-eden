import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./scripts/service-account.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkMembership() {
  const userId = 'oe4p9vUZnjZwioRJwHkp5ORqmEK2';
  const groupId = 'mQLgaSjLZ9d3n7I0kM9j';
  const slug = 'pollinators-crew';

  console.log('\n🔍 Checking membership documents...\n');

  // Check primary doc
  const doc1 = await db.doc(`plantbookGroupMembers/${groupId}_${userId}`).get();
  console.log(`📄 ${groupId}_${userId}`);
  console.log(`   Exists: ${doc1.exists}`);
  if (doc1.exists) {
    console.log(`   Data:`, JSON.stringify(doc1.data(), null, 2));
  }

  // Check slug doc
  const doc2 = await db.doc(`plantbookGroupMembers/${slug}_${userId}`).get();
  console.log(`\n📄 ${slug}_${userId}`);
  console.log(`   Exists: ${doc2.exists}`);
  if (doc2.exists) {
    console.log(`   Data:`, JSON.stringify(doc2.data(), null, 2));
  }

  // List ALL membership docs for this user
  console.log(`\n📋 ALL membership docs for user ${userId}:\n`);
  const allDocs = await db
    .collection('plantbookGroupMembers')
    .where('userId', '==', userId)
    .get();

  if (allDocs.empty) {
    console.log('   ❌ NO membership documents found for this user!');
  } else {
    allDocs.forEach((doc) => {
      console.log(`   ✅ ${doc.id}`);
      console.log(`      Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }

  // Check the group itself
  console.log(`\n🎯 Checking group document...\n`);
  const groupDoc = await db.doc(`plantbookGroups/${groupId}`).get();
  console.log(`📄 plantbookGroups/${groupId}`);
  console.log(`   Exists: ${groupDoc.exists}`);
  if (groupDoc.exists) {
    const data = groupDoc.data();
    console.log(`   Name: ${data.name}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Owner: ${data.ownerId}`);
  }

  process.exit(0);
}

checkMembership().catch(console.error);
