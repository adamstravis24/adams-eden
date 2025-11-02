import type { LucideIcon } from 'lucide-react'
import { Calendar, Mail, MessageCircle, Sparkles, Users } from 'lucide-react'

export interface FeaturedGroup {
  name: string
  description: string
  members: string
  activity: string
  tags: string[]
  icon: LucideIcon
  href: string
}

export interface PlantbookPostPreview {
  id: string
  author: string
  initials: string
  gradient: string
  group: string
  time: string
  content: string
  image: string | null
  tags: string[]
  stats: {
    loves: number
    comments: number
    shares: number
  }
  loved: boolean
}

export interface MessagingChannel {
  title: string
  description: string
  icon: LucideIcon
  href: string
  cta: string
}

export interface ConversationPreview {
  id: string
  title: string
  participants: string
  lastMessageSnippet: string
  lastMessageAt: string
  unreadCount: number
  href: string
}

export interface FriendHighlight {
  id: string
  name: string
  initials: string
  gradient: string
  zone: string
  specialty: string
  headline: string
  mutualGroups: number
  currentProject: string
  isOnline: boolean
}

export interface GroupEvent {
  id: string
  title: string
  group: string
  schedule: string
  host: string
  tags: string[]
}

export const featuredGroups: FeaturedGroup[] = [
  {
    name: 'Pollinator Crew',
    description: 'Design beds for bees, butterflies, and birds. Weekly photo drops and seasonal planting calls.',
    members: '842 members',
    activity: 'Active daily',
    tags: ['native plants', 'wildlife', 'zone 6'],
    icon: Sparkles,
    href: '/socials/groups/pollinator-crew',
  },
  {
    name: 'Hydro Heads Collective',
    description: 'Share nutrient schedules, light maps, and troubleshoot towers or NFT channels with growers worldwide.',
    members: '615 members',
    activity: '3 events this week',
    tags: ['hydroponics', 'indoor'],
    icon: Users,
    href: '/socials/groups/hydro-heads',
  },
  {
    name: 'Neighborhood Harvest Swap',
    description: "Plan collaborative crop rotations, schedule swap nights, and trade recipes for the weekly haul.",
    members: '312 members',
    activity: 'New circle forming',
    tags: ['community', 'vegetables'],
    icon: Calendar,
    href: '/socials/groups/harvest-swap',
  },
]

export const plantbookPosts: PlantbookPostPreview[] = [
  {
    id: 'sarah-monstera',
    author: 'Sarah Martinez',
    initials: 'SM',
    gradient: 'from-emerald-400 via-emerald-500 to-teal-500',
    group: 'Plant Parents United',
    time: '2 hours ago',
    content: 'My Monstera deliciosa finally gave me a new leaf after repotting! The fenestrations are stunning. Remember: patience and proper soil drainage are key! 🪴✨',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=900&auto=format&fit=crop&q=80',
    tags: ['Monstera', 'IndoorPlants', 'PlantCare'],
    stats: { loves: 248, comments: 32, shares: 18 },
    loved: false,
  },
  {
    id: 'tom-pothos-tip',
    author: 'Tom Chen',
    initials: 'TC',
    gradient: 'from-lime-400 via-green-500 to-emerald-500',
    group: 'Beginner Corner',
    time: '5 hours ago',
    content: 'Quick tip for beginners: Yellow leaves on your pothos? Check for overwatering first! Let the soil dry between waterings. Your plants will thank you! 💧',
    image: null,
    tags: ['PlantTips', 'Pothos', 'BeginnerFriendly'],
    stats: { loves: 156, comments: 24, shares: 45 },
    loved: true,
  },
  {
    id: 'luna-propagation',
    author: 'Luna Park',
    initials: 'LP',
    gradient: 'from-emerald-300 via-emerald-400 to-primary-400',
    group: 'Propagation Station',
    time: '1 day ago',
    content: "My propagation station is thriving! Started with cuttings from friends' plants. Plant sharing is caring! Who wants to do a cutting swap? 🌿💚",
    image: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=900&auto=format&fit=crop&q=80',
    tags: ['Propagation', 'PlantSwap', 'CommunityGarden'],
    stats: { loves: 389, comments: 67, shares: 23 },
    loved: false,
  },
]

export const messagingChannels: MessagingChannel[] = [
  {
    title: 'Direct messages',
    description: 'Chat one-on-one, drop photos, or send a quick voice note when you need advice fast.',
    icon: MessageCircle,
    href: '/socials/messages',
    cta: 'Open inbox',
  },
  {
    title: 'Group huddles',
    description: 'Create topic threads for pruning crews, class attendees, or your inner circle of plant pals.',
    icon: Users,
    href: '/socials/groups/new',
    cta: 'Start a group',
  },
  {
    title: 'Weekly digests',
    description: 'Get a wrap-up of group highlights and DMs in your email so you never miss an invite.',
    icon: Mail,
    href: '/settings',
    cta: 'Manage alerts',
  },
]

export const conversationPreviews: ConversationPreview[] = [
  {
    id: 'hydro-lab',
    title: 'Hydro Heads lab notes',
    participants: 'You, Alex Ramirez, Mira Singh',
    lastMessageSnippet: 'Alex: Uploaded the new nutrient schedule for week 4. Thoughts?',
    lastMessageAt: '4m ago',
    unreadCount: 2,
    href: '/socials/messages/hydro-lab',
  },
  {
    id: 'swap-night',
    title: 'Neighborhood swap planning',
    participants: 'Nia Johnson, You',
    lastMessageSnippet: 'Nia: I can bring extra seed trays if someone covers potting mix.',
    lastMessageAt: '1h ago',
    unreadCount: 0,
    href: '/socials/messages/swap-night',
  },
  {
    id: 'mentor-checkin',
    title: 'Mentor check-in',
    participants: 'You, Priya Desai',
    lastMessageSnippet: 'Priya: Drop photos of the soil samples before Friday if you can.',
    lastMessageAt: 'Yesterday',
    unreadCount: 0,
    href: '/socials/messages/mentor-checkin',
  },
]

export const friendHighlights: FriendHighlight[] = [
  {
    id: 'nia-johnson',
    name: 'Nia Johnson',
    initials: 'NJ',
    gradient: 'from-emerald-500 via-green-500 to-primary-500',
    zone: 'Zone 7a',
    specialty: 'Herbal guilds',
    headline: 'Sharing permaculture kitchen garden plans this week',
    mutualGroups: 3,
    currentProject: 'Designing a pollinator-friendly herb spiral',
    isOnline: true,
  },
  {
    id: 'alex-ramirez',
    name: 'Alex Ramirez',
    initials: 'AR',
    gradient: 'from-lime-400 via-emerald-500 to-teal-500',
    zone: 'Zone 8b',
    specialty: 'Hydroponics',
    headline: 'Hosting a weekly LED lighting lab for tower growers',
    mutualGroups: 2,
    currentProject: 'Dialing in nutrient schedules for strawberry towers',
    isOnline: false,
  },
  {
    id: 'mira-singh',
    name: 'Mira Singh',
    initials: 'MS',
    gradient: 'from-emerald-400 via-primary-500 to-primary-600',
    zone: 'Zone 5b',
    specialty: 'Community food forests',
    headline: 'Coordinating volunteers for a neighborhood harvest swap',
    mutualGroups: 4,
    currentProject: 'Mapping fruit tree guild companions for fall',
    isOnline: true,
  },
]

export const upcomingGroupEvents: GroupEvent[] = [
  {
    id: 'soil-lab',
    title: 'Hands-on soil health lab',
    group: 'Soil Builders Guild',
    schedule: 'Thursday • 7:00 PM CT • Virtual',
    host: 'Hosted by Priya Desai',
    tags: ['soil science', 'lab', 'beginner friendly'],
  },
  {
    id: 'seed-swap',
    title: 'Neighborhood seed swap planning call',
    group: 'Neighborhood Harvest Swap',
    schedule: 'Saturday • 11:00 AM CT • Springfield Co-op',
    host: 'Hosted by the Harvest Swap team',
    tags: ['community', 'planning'],
  },
  {
    id: 'prop-cuttings',
    title: 'Propagation cuttings exchange',
    group: 'Propagation Station',
    schedule: 'Sunday • 3:00 PM CT • Greenhouse 4',
    host: 'Hosted by Luna Park',
    tags: ['cuttings', 'trade', 'indoor'],
  },
]
