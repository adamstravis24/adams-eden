'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

type UserProfile = {
  displayName?: string
  photoURL?: string
}

type AuthContextType = {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __plantbookAuth?: typeof auth }).__plantbookAuth = auth
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      // Load user profile from Firestore
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserProfile({
              displayName: data.displayName,
              photoURL: data.photoURL,
            })
          }
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    // Handle redirect result (e.g., when popup is blocked and we fell back to redirect)
    // Ensure user profile gets created on redirect sign-in as well.
    ;(async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          const u = result.user
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid))
            if (!userDoc.exists()) {
              await setDoc(doc(db, 'users', u.uid), {
                displayName: u.displayName || 'User',
                email: u.email,
                createdAt: new Date().toISOString(),
                preferences: {
                  theme: 'light',
                  units: 'imperial',
                  notifications: true,
                  zipCode: '',
                  location: '',
                }
              })
            }
          } catch (e) {
            console.error('Error ensuring user profile after redirect:', e)
          }
        }
      } catch (e) {
        // Swallow redirect result errors to avoid blocking app load
        console.warn('getRedirectResult failed:', e)
      }
    })()

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      // Ensure user profile exists (non-blocking, don't wait for it)
      setTimeout(async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              displayName: user.displayName || email.split('@')[0],
              email: user.email,
              createdAt: new Date().toISOString(),
              preferences: {
                theme: 'light',
                units: 'imperial',
                notifications: true,
                zipCode: '',
                location: '',
              }
            })
          }
        } catch (error) {
          console.error('Error checking/creating profile:', error)
          // Don't block login if profile check fails
        }
      }, 0)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true)

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create user profile in Firestore with default preferences
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email,
        createdAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          units: 'imperial',
          notifications: true,
          zipCode: '',
          location: '',
        }
      })
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    setLoading(true)

    try {
      const { user } = await signInWithPopup(auth, provider)

      // Check if user profile exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName || 'User',
          email: user.email,
          createdAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            units: 'imperial',
            notifications: true,
            zipCode: '',
            location: '',
          }
        })
      }
    } catch (error: any) {
      // If popup is blocked or not supported (e.g., in some in-app browsers), fall back to redirect
      const code = error?.code as string | undefined
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider)
          // After redirect, onAuthStateChanged will run; we also handle getRedirectResult above
          return
        } catch (redirectErr) {
          setLoading(false)
          throw redirectErr
        }
      } else {
        setLoading(false)
        throw error
      }
    }
  }

  const signOut = async () => {
    setLoading(true)

    try {
      await firebaseSignOut(auth)
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    if (!user) throw new Error('No user logged in')
    
    const updates: Partial<UserProfile> = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (photoURL !== undefined) updates.photoURL = photoURL
    
    await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
    
    setUserProfile(prev => ({
      ...prev,
      ...updates
    }))
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      signOut,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
