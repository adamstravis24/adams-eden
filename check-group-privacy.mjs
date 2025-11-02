import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./scripts/service-account.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkGroupPrivacy() {
  const groupId = 'mQLgaSjLZ9d3n7I0kM9j';
  
  const groupDoc = await db.collection('plantbookGroups').doc(groupId).get();
  
  if (!groupDoc.exists) {
    console.log('❌ Group not found');
    return;
  }
  
  const data = groupDoc.data();
  console.log('Group data:', {
    id: groupDoc.id,
    name: data.name,
    slug: data.slug,
    isPrivate: data.isPrivate,
    ownerId: data.ownerId,
    memberCount: data.memberCount
  });
}

checkGroupPrivacy().catch(console.error);
