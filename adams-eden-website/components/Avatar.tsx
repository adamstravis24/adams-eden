'use client'

import Image from 'next/image'

interface AvatarProps {
  photoURL?: string | null
  displayName?: string
  email?: string
  size?: number
  className?: string
}

export default function Avatar({ 
  photoURL, 
  displayName, 
  email, 
  size = 40,
  className = '' 
}: AvatarProps) {
  // If we have a photo URL, display it
  if (photoURL) {
    return (
      <div 
        className={`relative overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={photoURL}
          alt={displayName || email || 'User'}
          fill
          className="object-cover"
        />
      </div>
    )
  }

  // Generate initials from displayName or email
  const getInitials = () => {
    if (displayName) {
      const names = displayName.trim().split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return displayName.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Generate a consistent color based on email or name
  const getColor = () => {
    const str = email || displayName || 'default'
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div
      className={`${getColor()} text-white flex items-center justify-center font-semibold rounded-full ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.4
      }}
    >
      {getInitials()}
    </div>
  )
}
