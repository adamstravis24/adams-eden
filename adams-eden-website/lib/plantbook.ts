import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as limitFn,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from './firebase'
import type {
  PlantbookFeedOptions,
  PlantbookGroup,
  PlantbookGroupInput,
  PlantbookGroupMembership,
  PlantbookGroupOptions,
  PlantbookComment,
  PlantbookCommentInput,
  PlantbookMedia,
  PlantbookPost,
  PlantbookPostInput,
  PlantbookPostUpdateInput,
} from '@/types/plantbook'
import { getErrorMessage } from './errors'

const PLANTBOOK_POSTS_COLLECTION = 'plantbookPosts'
const PLANTBOOK_GROUPS_COLLECTION = 'plantbookGroups'
const PLANTBOOK_GROUP_MEMBERS_COLLECTION = 'plantbookGroupMembers'
const PLANTBOOK_LOVES_SUBCOLLECTION = 'loves'
const PLANTBOOK_COMMENTS_SUBCOLLECTION = 'comments'
const PLANTBOOK_FRIENDS_SUBCOLLECTION = 'friends'
const PLANTBOOK_GROUP_COVERS_PATH = 'plantbookGroupCovers'

const MAX_IN_QUERY = 10

const moderatorTokens = (process.env.NEXT_PUBLIC_PLANTBOOK_MODERATORS || '')
  .split(',')
  .map((token) => token.trim().toLowerCase())
  .filter(Boolean)

const defaultModeratorEmails = (process.env.NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

export function isPlantbookModerator(uid?: string | null, email?: string | null) {
  if (!uid && !email) return false
  const normalizedUid = uid?.toLowerCase()
  const normalizedEmail = email?.toLowerCase()
  if (normalizedUid && moderatorTokens.includes(normalizedUid)) return true
  if (normalizedEmail && moderatorTokens.includes(normalizedEmail)) return true
  if (normalizedEmail && defaultModeratorEmails.includes(normalizedEmail)) return true
  return false
}

function toDate(value: PlantbookPost['createdAt']): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') {
    return value.toDate()
  }
  return null
}

function isPlantbookMedia(value: unknown): value is PlantbookMedia {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    (candidate.kind === 'image' || candidate.kind === 'video') &&
    typeof candidate.storagePath === 'string' &&
    typeof candidate.url === 'string'
  )
}

function serializeMedia(media: PlantbookMedia[] = []): PlantbookMedia[] {
  return media.map((item) => {
    const normalized: PlantbookMedia = {
      id: item.id,
      kind: item.kind,
      storagePath: item.storagePath,
      url: item.url,
    }

    if (typeof item.thumbnailUrl === 'string') {
      normalized.thumbnailUrl = item.thumbnailUrl
    }
    if (typeof item.aspectRatio === 'number') {
      normalized.aspectRatio = item.aspectRatio
    }
    if (typeof item.durationSeconds === 'number') {
      normalized.durationSeconds = item.durationSeconds
    }

    return normalized
  })
}

function parseComment(
  docId: string,
  postId: string,
  data: DocumentData | undefined
): PlantbookComment {
  return {
    id: docId,
    postId,
    authorId: typeof data?.authorId === 'string' ? data.authorId : '',
    authorDisplayName:
      typeof data?.authorDisplayName === 'string' ? data.authorDisplayName : 'Garden Friend',
    authorPhotoURL: typeof data?.authorPhotoURL === 'string' ? data.authorPhotoURL : null,
    content: typeof data?.content === 'string' ? data.content : '',
    createdAt: (data?.createdAt as PlantbookComment['createdAt']) ?? null,
    updatedAt: (data?.updatedAt as PlantbookComment['updatedAt']) ?? null,
  }
}

export function parsePlantbookComment(
  docId: string,
  postId: string,
  data: DocumentData | undefined
): PlantbookComment {
  return parseComment(docId, postId, data)
}

function parsePost(docId: string, data: DocumentData | undefined): PlantbookPost {
  const statsSource =
    data && typeof data.stats === 'object' && data.stats !== null
      ? (data.stats as Record<string, unknown>)
      : {}
  const mediaSource = Array.isArray(data?.media) ? data.media.filter(isPlantbookMedia) : []
  const attachmentSource = Array.isArray(data?.attachments)
    ? data.attachments.filter((item): item is string => typeof item === 'string')
    : []

  return {
    id: docId,
    authorId: typeof data?.authorId === 'string' ? data.authorId : '',
    authorDisplayName: typeof data?.authorDisplayName === 'string' ? data.authorDisplayName : 'Garden Friend',
    authorEmail: typeof data?.authorEmail === 'string' ? data.authorEmail : null,
    authorPhotoURL: typeof data?.authorPhotoURL === 'string' ? data.authorPhotoURL : null,
    content: typeof data?.content === 'string' ? data.content : '',
    createdAt: (data?.createdAt as PlantbookPost['createdAt']) ?? null,
    updatedAt: (data?.updatedAt as PlantbookPost['updatedAt']) ?? null,
    visibility: data?.visibility === 'group' ? 'group' : 'public',
    groupId: typeof data?.groupId === 'string' ? data.groupId : null,
    groupName: typeof data?.groupName === 'string' ? data.groupName : null,
    media: serializeMedia(mediaSource),
    stats: {
      loves: typeof statsSource.loves === 'number' ? statsSource.loves : 0,
      comments: typeof statsSource.comments === 'number' ? statsSource.comments : 0,
      shares: typeof statsSource.shares === 'number' ? statsSource.shares : 0,
    },
    viewerHasLoved: Boolean(data?.viewerHasLoved),
    attachments: attachmentSource,
  }
}

function parseGroup(docId: string, data: DocumentData | undefined): PlantbookGroup {
  const tags = Array.isArray(data?.tags)
    ? data.tags.filter((item): item is string => typeof item === 'string')
    : []
  const moderatorIds = Array.isArray(data?.moderatorIds)
    ? data.moderatorIds.filter((item): item is string => typeof item === 'string')
    : []

  return {
    id: docId,
  name: typeof data?.name === 'string' ? data.name : 'Plant Circle',
  slug: typeof data?.slug === 'string' ? data.slug : undefined,
  description: typeof data?.description === 'string' ? data.description : undefined,
  activityLabel: typeof data?.activityLabel === 'string' ? data.activityLabel : null,
  memberCount: typeof data?.memberCount === 'number' ? data.memberCount : 0,
    tags,
  coverImageUrl: typeof data?.coverImageUrl === 'string' ? data.coverImageUrl : null,
  featured: data?.featured === undefined ? undefined : Boolean(data?.featured),
  isPrivate: data?.isPrivate === undefined ? undefined : Boolean(data?.isPrivate),
  ownerId: typeof data?.ownerId === 'string' ? data.ownerId : '',
    moderatorIds,
    createdAt: (data?.createdAt as PlantbookGroup['createdAt']) ?? null,
  }
}

function parseGroupMembership(docId: string, data: DocumentData | undefined): PlantbookGroupMembership {
  const [idGroupId = '', idUserId = ''] = docId.split('_', 2)
  return {
    groupId: typeof data?.groupId === 'string' ? data.groupId : idGroupId,
    userId: typeof data?.userId === 'string' ? data.userId : idUserId,
    role: typeof data?.role === 'string' ? data.role : 'member',
    joinedAt: (data?.joinedAt as PlantbookGroupMembership['joinedAt']) ?? null,
  }
}

export async function fetchPlantbookFeed(options: PlantbookFeedOptions = {}) {
  const {
    limit = 20,
    groupIds = [],
    authorIds = [],
    includePublic = true,
    since,
  } = options

  const posts: PlantbookPost[] = []
  const postsRef = collection(db, PLANTBOOK_POSTS_COLLECTION)
  const cutoff = since
    ? since instanceof Date
      ? Timestamp.fromDate(since)
      : since
    : null

  const buildConstraints = (
    constraints: QueryConstraint[]
  ): QueryConstraint[] => {
    const result: QueryConstraint[] = [...constraints]
    if (cutoff) {
      result.push(where('createdAt', '>=', cutoff))
    }
    result.push(orderBy('createdAt', 'desc'))
    result.push(limitFn(limit))
    return result
  }

  const runQuery = async (constraints: QueryConstraint[]) => {
    const snapshot = await getDocs(query(postsRef, ...constraints))
    snapshot.forEach((docSnap) => {
      posts.push(parsePost(docSnap.id, docSnap.data()))
    })
  }

  if (includePublic) {
    await runQuery(buildConstraints([where('visibility', '==', 'public')]))
  }

  if (groupIds.length > 0) {
    for (let index = 0; index < groupIds.length; index += MAX_IN_QUERY) {
      const chunk = groupIds.slice(index, index + MAX_IN_QUERY)
      if (chunk.length === 0) {
        continue
      }
      await runQuery(buildConstraints([where('groupId', 'in', chunk)]))
    }
  }

  if (authorIds.length > 0) {
    for (let index = 0; index < authorIds.length; index += MAX_IN_QUERY) {
      const chunk = authorIds.slice(index, index + MAX_IN_QUERY)
      if (chunk.length === 0) {
        continue
      }
      await runQuery(buildConstraints([where('authorId', 'in', chunk)]))
    }
  }

  const uniquePosts = new Map<string, PlantbookPost>()
  posts.forEach((post) => {
    uniquePosts.set(post.id, post)
  })

  return Array.from(uniquePosts.values())
    .sort((a, b) => {
      const dateA = toDate(a.createdAt)?.getTime() ?? 0
      const dateB = toDate(b.createdAt)?.getTime() ?? 0
      return dateB - dateA
    })
    .slice(0, limit)
}

export async function fetchPlantbookFriendIds(userId: string) {
  const friendsRef = collection(
    db,
    'users',
    userId,
    PLANTBOOK_FRIENDS_SUBCOLLECTION
  )

  const snapshot = await getDocs(friendsRef)
  const friendIds = new Set<string>()

  snapshot.forEach((docSnap) => {
    const data = docSnap.data()
    if (typeof data?.friendId === 'string') {
      friendIds.add(data.friendId)
    } else {
      friendIds.add(docSnap.id)
    }
  })

  return Array.from(friendIds)
}

export async function fetchPlantbookGroups(options: PlantbookGroupOptions = {}) {
  const { limit = 6, featuredOnly = false } = options
  const groupsRef = collection(db, PLANTBOOK_GROUPS_COLLECTION)
  const constraints = [orderBy('memberCount', 'desc'), limitFn(limit)]

  let groupsQuery
  if (featuredOnly) {
    groupsQuery = query(groupsRef, where('featured', '==', true), ...constraints)
  } else {
    groupsQuery = query(groupsRef, ...constraints)
  }

  const snapshot = await getDocs(groupsQuery)
  const groups: PlantbookGroup[] = []
  snapshot.forEach((docSnap) => {
    groups.push(parseGroup(docSnap.id, docSnap.data()))
  })
  return groups
}

export async function fetchPlantbookGroup(identifier: string): Promise<PlantbookGroup | null> {
  const normalized = identifier.trim()
  if (!normalized) {
    return null
  }

  if (normalized.includes('/')) {
    return null
  }

  const byIdRef = doc(db, PLANTBOOK_GROUPS_COLLECTION, normalized)
  const byIdSnapshot = await getDoc(byIdRef)
  if (byIdSnapshot.exists()) {
    return parseGroup(byIdSnapshot.id, byIdSnapshot.data())
  }

  const groupsRef = collection(db, PLANTBOOK_GROUPS_COLLECTION)
  const slugCandidates = Array.from(new Set([normalized, normalized.toLowerCase()]))

  for (const candidate of slugCandidates) {
    const slugQuery = query(groupsRef, where('slug', '==', candidate), limitFn(1))
    const slugSnapshot = await getDocs(slugQuery)
    if (!slugSnapshot.empty) {
      const match = slugSnapshot.docs[0]
      return parseGroup(match.id, match.data())
    }
  }

  return null
}

interface FetchPlantbookGroupMembershipOptions {
  fallbackGroupIds?: string[]
}

export async function fetchPlantbookGroupMembership(
  groupId: string,
  userId: string,
  options: FetchPlantbookGroupMembershipOptions = {}
): Promise<PlantbookGroupMembership | null> {
  const trimmedPrimaryGroupId = groupId.trim()
  const trimmedUserId = userId.trim()

  if (!trimmedUserId) {
    return null
  }

  const candidates = new Set<string>()
  if (trimmedPrimaryGroupId) {
    candidates.add(trimmedPrimaryGroupId)
  }

  for (const fallback of options.fallbackGroupIds ?? []) {
    const trimmedFallback = fallback.trim()
    if (trimmedFallback) {
      candidates.add(trimmedFallback)
    }
  }

  for (const candidate of candidates) {
    const membershipRef = doc(
      db,
      PLANTBOOK_GROUP_MEMBERS_COLLECTION,
      `${candidate}_${trimmedUserId}`
    )
    const snapshot = await getDoc(membershipRef)
    if (snapshot.exists()) {
      return parseGroupMembership(snapshot.id, snapshot.data())
    }
  }

  return null
}

export async function uploadPlantbookGroupCover(ownerId: string, file: File) {
  const coverId = crypto.randomUUID()
  const storagePath = `${PLANTBOOK_GROUP_COVERS_PATH}/${ownerId}/${coverId}_${file.name}`
  const storageRef = ref(storage, storagePath)
  const uploadTask = uploadBytesResumable(storageRef, file, {
    cacheControl: 'public,max-age=604800',
    customMetadata: {
      ownerId,
      kind: 'plantbook-group-cover',
    },
  })

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      undefined,
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(url)
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

export async function createPlantbookGroup(ownerId: string, input: PlantbookGroupInput) {
  const payload = {
    name: input.name,
    slug: input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    description: input.description ?? '',
    tags: input.tags ?? [],
    memberCount: 1,
    isPrivate: Boolean(input.isPrivate),
    featured: Boolean(input.featured),
    coverImageUrl: input.coverImageUrl ?? null,
    activityLabel: 'New circle',
    ownerId,
    moderatorIds: [ownerId],
    createdAt: serverTimestamp(),
  }

  console.log('Plantbook group payload', payload)

  const groupRef = await addDoc(collection(db, PLANTBOOK_GROUPS_COLLECTION), payload)

  const membershipDoc = doc(db, PLANTBOOK_GROUP_MEMBERS_COLLECTION, `${groupRef.id}_${ownerId}`)

  try {
    await setDoc(membershipDoc, {
      groupId: groupRef.id,
      userId: ownerId,
      role: 'owner',
      joinedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Failed to create Plantbook group membership', error)
    throw error
  }

  const snapshot = await getDoc(groupRef)
  return parseGroup(snapshot.id, snapshot.data())
}

export async function createPlantbookPost(
  input: PlantbookPostInput,
  mediaFiles: File[] = []
) {
  const postRef = doc(collection(db, PLANTBOOK_POSTS_COLLECTION))
  const uploadedMedia: PlantbookMedia[] = []

  for (const file of mediaFiles) {
    const mediaId = crypto.randomUUID()
    const storagePath = `${PLANTBOOK_POSTS_COLLECTION}/${postRef.id}/media/${mediaId}_${file.name}`
    const storageRef = ref(storage, storagePath)
    const uploadTask = uploadBytesResumable(storageRef, file, {
      cacheControl: 'public,max-age=31536000',
      customMetadata: {
        authorId: input.authorId,
      },
    })

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        undefined,
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          uploadedMedia.push({
            id: mediaId,
            kind: file.type.startsWith('video') ? 'video' : 'image',
            storagePath,
            url,
          })
          resolve()
        }
      )
    })
  }

  await setDoc(postRef, {
    authorId: input.authorId,
    authorDisplayName: input.authorDisplayName,
    authorEmail: input.authorEmail ?? null,
    authorPhotoURL: input.authorPhotoURL ?? null,
    content: input.content,
    visibility: input.visibility ?? 'public',
    groupId: input.groupId ?? null,
    groupName: input.groupName ?? null,
    media: serializeMedia(uploadedMedia),
    stats: { loves: 0, comments: 0, shares: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const snapshot = await getDoc(postRef)
  return parsePost(snapshot.id, snapshot.data())
}

export async function fetchPlantbookComments(postId: string, limit = 50) {
  const comments: PlantbookComment[] = []
  const commentsRef = collection(
    db,
    PLANTBOOK_POSTS_COLLECTION,
    postId,
    PLANTBOOK_COMMENTS_SUBCOLLECTION
  )

  const commentsQuery = query(
    commentsRef,
    orderBy('createdAt', 'asc'),
    limitFn(limit)
  )

  const snapshot = await getDocs(commentsQuery)
  snapshot.forEach((docSnap) => {
    comments.push(parseComment(docSnap.id, postId, docSnap.data()))
  })

  return comments
}

export async function createPlantbookComment(postId: string, input: PlantbookCommentInput) {
  const postDocRef = doc(db, PLANTBOOK_POSTS_COLLECTION, postId)
  const commentDocRef = doc(
    collection(postDocRef, PLANTBOOK_COMMENTS_SUBCOLLECTION)
  )

  await runTransaction(db, async (transaction) => {
    const postSnapshot = await transaction.get(postDocRef)

    if (!postSnapshot.exists()) {
      throw new Error('Post not found')
    }

    transaction.set(commentDocRef, {
      authorId: input.authorId,
      authorDisplayName: input.authorDisplayName,
      authorPhotoURL: input.authorPhotoURL ?? null,
      content: input.content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    transaction.update(postDocRef, {
      'stats.comments': increment(1),
      updatedAt: serverTimestamp(),
    })
  })

  const snapshot = await getDoc(commentDocRef)
  return parseComment(snapshot.id, postId, snapshot.data())
}

export async function updatePlantbookPost(
  postId: string,
  requesterId: string,
  input: PlantbookPostUpdateInput,
  requesterEmail?: string | null
) {
  const postDocRef = doc(db, PLANTBOOK_POSTS_COLLECTION, postId)
  const snapshot = await getDoc(postDocRef)

  if (!snapshot.exists()) {
    throw new Error('Post not found')
  }

  const data = snapshot.data()
  const isOwner = data.authorId === requesterId
  const moderator = isPlantbookModerator(requesterId, requesterEmail ?? null)

  if (!isOwner && !moderator) {
    throw new Error('Only the author or a moderator can edit this post')
  }

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  if (typeof input.content === 'string') {
    payload.content = input.content
  }

  if (input.visibility) {
    payload.visibility = input.visibility
  }

  const nextVisibility = (payload.visibility as PlantbookPost['visibility']) ?? data.visibility

  if (nextVisibility === 'group') {
    if (input.groupId !== undefined) {
      payload.groupId = input.groupId
    }
    if (input.groupName !== undefined) {
      payload.groupName = input.groupName
    }
  } else {
    payload.groupId = null
    payload.groupName = null
  }

  await updateDoc(postDocRef, payload)

  const updatedSnapshot = await getDoc(postDocRef)
  return parsePost(updatedSnapshot.id, updatedSnapshot.data())
}

export async function togglePlantbookLove(postId: string, userId: string) {
  const postDocRef = doc(db, PLANTBOOK_POSTS_COLLECTION, postId)
  const loveDocRef = doc(db, PLANTBOOK_POSTS_COLLECTION, postId, PLANTBOOK_LOVES_SUBCOLLECTION, userId)

  return runTransaction(db, async (transaction) => {
    const loveSnapshot = await transaction.get(loveDocRef)
    const postSnapshot = await transaction.get(postDocRef)

    if (!postSnapshot.exists()) {
      throw new Error('Post not found')
    }

    if (loveSnapshot.exists()) {
      transaction.delete(loveDocRef)
      transaction.update(postDocRef, {
        'stats.loves': increment(-1),
      })
      return { loved: false }
    }

    transaction.set(loveDocRef, {
      userId,
      lovedAt: serverTimestamp(),
    })
    transaction.update(postDocRef, {
      'stats.loves': increment(1),
    })
    return { loved: true }
  })
}

export async function deletePlantbookPost(postId: string, requesterId: string, requesterEmail?: string | null) {
  const postDocRef = doc(db, PLANTBOOK_POSTS_COLLECTION, postId)
  const snapshot = await getDoc(postDocRef)

  if (!snapshot.exists()) {
    throw new Error('Post not found')
  }

  const data = snapshot.data()
  const isOwner = data.authorId === requesterId
  const moderator = isPlantbookModerator(requesterId, requesterEmail ?? null)

  if (!isOwner && !moderator) {
    throw new Error('Only the author or a moderator can delete this post')
  }

  await deleteDoc(postDocRef)
}

export function getPlantbookErrorMessage(error: unknown, fallback = 'Something went wrong with Plantbook') {
  return getErrorMessage(error, fallback)
}

export async function fetchPlantbookLoveStatuses(postIds: string[], userId: string) {
  if (!userId || postIds.length === 0) {
    return {}
  }

  const statuses: Record<string, boolean> = {}

  await Promise.all(
    postIds.map(async (postId) => {
      try {
        const loveDocRef = doc(
          db,
          PLANTBOOK_POSTS_COLLECTION,
          postId,
          PLANTBOOK_LOVES_SUBCOLLECTION,
          userId
        )
        const snapshot = await getDoc(loveDocRef)
        statuses[postId] = snapshot.exists()
      } catch (error) {
        console.error('Failed to load love status for Plantbook post', { postId, error })
      }
    })
  )

  return statuses
}

/**
 * Join a public group (instant membership)
 */
export async function joinPlantbookGroup(groupId: string, userId: string) {
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required to join a group')
  }

  const membershipId = `${groupId}_${userId}`
  const membershipRef = doc(db, PLANTBOOK_GROUP_MEMBERS_COLLECTION, membershipId)

  try {
    await setDoc(membershipRef, {
      groupId,
      userId,
      role: 'member',
      joinedAt: serverTimestamp(),
    })

    // Increment member count
    const groupRef = doc(db, PLANTBOOK_GROUPS_COLLECTION, groupId)
    await updateDoc(groupRef, {
      memberCount: increment(1),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to join Plantbook group', { groupId, userId, error })
    throw new Error(getPlantbookErrorMessage(error))
  }
}

/**
 * Leave a group (remove membership)
 */
export async function leavePlantbookGroup(groupId: string, userId: string) {
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required to leave a group')
  }

  const membershipId = `${groupId}_${userId}`
  const membershipRef = doc(db, PLANTBOOK_GROUP_MEMBERS_COLLECTION, membershipId)

  try {
    await deleteDoc(membershipRef)

    // Decrement member count
    const groupRef = doc(db, PLANTBOOK_GROUPS_COLLECTION, groupId)
    await updateDoc(groupRef, {
      memberCount: increment(-1),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to leave Plantbook group', { groupId, userId, error })
    throw new Error(getPlantbookErrorMessage(error))
  }
}
