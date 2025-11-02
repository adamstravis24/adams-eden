import type { Timestamp } from 'firebase/firestore'

export type PlantbookVisibility = 'public' | 'group'

export type PlantbookMediaKind = 'image' | 'video'

export interface PlantbookMedia {
  id: string
  kind: PlantbookMediaKind
  storagePath: string
  url: string
  thumbnailUrl?: string
  aspectRatio?: number
  durationSeconds?: number
}

export interface PlantbookComment {
  id: string
  postId: string
  authorId: string
  authorDisplayName: string
  authorPhotoURL?: string | null
  content: string
  createdAt: Timestamp | Date | null
  updatedAt?: Timestamp | Date | null
}

export interface PlantbookStats {
  loves: number
  comments: number
  shares: number
}

export interface PlantbookPost {
  id: string
  authorId: string
  authorDisplayName: string
  authorEmail?: string | null
  authorPhotoURL?: string | null
  content: string
  createdAt: Timestamp | Date | null
  updatedAt?: Timestamp | Date | null
  visibility: PlantbookVisibility
  groupId?: string | null
  groupName?: string | null
  media: PlantbookMedia[]
  stats: PlantbookStats
  viewerHasLoved?: boolean
  attachments?: string[]
}

export interface PlantbookPostInput {
  authorId: string
  authorDisplayName: string
  authorEmail?: string | null
  authorPhotoURL?: string | null
  content: string
  visibility?: PlantbookVisibility
  groupId?: string | null
  groupName?: string | null
}

export interface PlantbookCommentInput {
  authorId: string
  authorDisplayName: string
  authorPhotoURL?: string | null
  content: string
}

export interface PlantbookPostUpdateInput {
  content?: string
  visibility?: PlantbookVisibility
  groupId?: string | null
  groupName?: string | null
}

export interface PlantbookGroup {
  id: string
  name: string
  slug?: string
  description?: string
  activityLabel?: string | null
  memberCount: number
  tags: string[]
  coverImageUrl?: string | null
  featured?: boolean
  isPrivate?: boolean
  ownerId: string
  moderatorIds: string[]
  createdAt: Timestamp | Date | null
}

export interface PlantbookGroupMembership {
  groupId: string
  userId: string
  role: string
  joinedAt: Timestamp | Date | null
}

export interface PlantbookGroupInput {
  name: string
  description?: string
  tags?: string[]
  isPrivate?: boolean
  featured?: boolean
  coverImageUrl?: string | null
}

export interface PlantbookFeedOptions {
  limit?: number
  groupIds?: string[]
  authorIds?: string[]
  includePublic?: boolean
  since?: Date | Timestamp
}

export interface PlantbookGroupOptions {
  limit?: number
  featuredOnly?: boolean
}
