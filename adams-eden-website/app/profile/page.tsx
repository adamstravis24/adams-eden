'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { doc, getDoc, setDoc, DocumentSnapshot, DocumentData } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import { FirebaseError } from 'firebase/app'
import { getErrorMessage } from '@/lib/errors'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from 'firebase/auth'

interface UserPreferences {
  theme: 'light' | 'dark'
  units: 'imperial' | 'metric'
  notifications: boolean
  zipCode: string
  location: string
}

interface UserProfile {
  displayName: string
  email: string
  createdAt: string
  firstName?: string
  lastName?: string
  photoURL?: string
  preferences: UserPreferences
}

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const loadProfile = useCallback(async () => {
    if (!user) return

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<DocumentSnapshot<DocumentData>>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const profilePromise = getDoc(doc(db, 'users', user.uid))

      const userDoc = await Promise.race<DocumentSnapshot<DocumentData>>([
        profilePromise,
        timeoutPromise,
      ])
      
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile)
      } else {
        // Create default profile if doesn't exist
        const defaultProfile: UserProfile = {
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            units: 'imperial',
            notifications: true,
            zipCode: '',
            location: '',
          }
        }
        await setDoc(doc(db, 'users', user.uid), defaultProfile)
        setProfile(defaultProfile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Set a default profile even if load fails
      setProfile({
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        createdAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          units: 'imperial',
          notifications: true,
          zipCode: '',
          location: '',
        }
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void loadProfile()
    }
  }, [user, loadProfile])

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    setMessage('')

    try {
      console.log('Attempting to save profile for user:', user.uid)
      console.log('Profile data:', {
        displayName: profile.displayName,
        firstName: profile.firstName,
        lastName: profile.lastName,
      })

      // Use setDoc with merge to create document if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email,
        createdAt: profile.createdAt,
        preferences: profile.preferences,
      }, { merge: true })
      
      // Update the auth context
      await updateUserProfile(profile.displayName)
      
      console.log('Profile saved successfully')
      setMessage('✓ Profile saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: unknown) {
      console.error('Error saving profile:', error)

      if (error instanceof FirebaseError) {
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)

        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
          setMessage('Unable to connect to database. Please check your internet connection.')
        } else if (error.code === 'permission-denied') {
          setMessage('Permission denied. Please sign out and sign in again.')
        } else {
          setMessage(`Error: ${getErrorMessage(error, 'Failed to save profile')}`)
        }
      } else {
        setMessage(`Error: ${getErrorMessage(error, 'Failed to save profile')}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      // Create a storage reference
      const filename = `profile_${user.uid}_${Date.now()}.jpg`
      const storageRef = ref(storage, `profilePictures/${user.uid}/${filename}`)

      // Upload the file
      await uploadBytes(storageRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Update user profile with photo URL
      await updateUserProfile(profile?.displayName, downloadURL)

      setMessage('✓ Profile picture uploaded successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: unknown) {
      console.error('Error uploading photo:', error)
      if (error instanceof FirebaseError && error.code === 'storage/unauthorized') {
        setMessage('Permission denied. Make sure Firebase Storage rules are configured.')
      } else {
        setMessage(`Error: ${getErrorMessage(error, 'Failed to upload photo')}`)
      }
    } finally {
      setUploading(false)
    }
  }

  const isPasswordProvider = !!user?.providerData?.some(p => p.providerId === 'password')

  const handleChangePassword = async () => {
    if (!user || !user.email) return
    setPasswordMsg('')
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('Please fill in all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg('New password must be at least 8 characters.')
      return
    }
    setChangingPassword(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPassword)
      setPasswordMsg('✓ Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/wrong-password') {
          setPasswordMsg('Current password is incorrect.')
        } else if (error.code === 'auth/weak-password') {
          setPasswordMsg('New password is too weak. Use at least 8 characters with a mix of letters and numbers.')
        } else if (error.code === 'auth/requires-recent-login') {
          setPasswordMsg('For your security, please sign out and sign in again before changing your password.')
        } else if (error.code === 'auth/too-many-requests') {
          setPasswordMsg('Too many attempts. Please try again later.')
        } else {
          setPasswordMsg(`Error: ${getErrorMessage(error, 'Failed to update password')}`)
        }
      } else {
        setPasswordMsg(`Error: ${getErrorMessage(error, 'Failed to update password')}`)
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSendResetEmail = async () => {
    if (!user?.email) return
    setPasswordMsg('')
    try {
      await sendPasswordResetEmail(auth, user.email)
      setPasswordMsg('✓ Password reset email sent. Check your inbox for further instructions.')
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/missing-email') {
          setPasswordMsg('Your account does not have an email address associated.')
        } else if (error.code === 'auth/invalid-email') {
          setPasswordMsg('Your email address appears invalid. Please contact support.')
        } else if (error.code === 'auth/user-not-found') {
          setPasswordMsg('We couldn’t find an email/password account for this address. If you sign in with Google or Apple, manage your password with that provider.')
        } else {
          setPasswordMsg(`Error: ${getErrorMessage(error, 'Failed to send reset email')}`)
        }
      } else {
        setPasswordMsg(`Error: ${getErrorMessage(error, 'Failed to send reset email')}`)
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Profile not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Profile Picture */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar 
                  photoURL={userProfile?.photoURL}
                  displayName={userProfile?.displayName || user?.displayName || undefined}
                  email={user?.email || undefined}
                  size={96}
                  className="ring-4 ring-primary-100"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition shadow-lg disabled:opacity-50"
                  title="Change profile picture"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-gray-600 mb-2">
                  {uploading ? 'Uploading...' : 'Click the camera icon to upload a new profile picture'}
                </p>
                <p className="text-sm text-gray-500">
                  Recommended: Square image, at least 200x200 pixels, max 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="How you want to be called"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                />
                <p className="text-sm text-gray-500 mt-1">This is what appears in the navigation menu</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <input
                  type="text"
                  value={new Date(profile.createdAt).toLocaleDateString()}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Location Preferences */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Location</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={profile.preferences.zipCode}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, zipCode: e.target.value }
                  })}
                  placeholder="Enter your ZIP code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                />
                <p className="text-sm text-gray-500 mt-1">Used for local weather and planting recommendations</p>
              </div>

              {profile.preferences.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profile.preferences.location}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <select
                  value={profile.preferences.theme}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, theme: e.target.value as 'light' | 'dark' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units
                </label>
                <select
                  value={profile.preferences.units}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, units: e.target.value as 'imperial' | 'metric' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="imperial">Imperial (feet, Fahrenheit)</option>
                  <option value="metric">Metric (meters, Celsius)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={profile.preferences.notifications}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, notifications: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                />
                <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                  Enable email notifications for planting reminders and garden updates
                </label>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Change Password</h2>
            {!isPasswordProvider ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your account is signed in with a third-party provider. To change your password, manage it with your provider (e.g., Google or Apple).
                </p>
                {user?.email && (
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    Send password reset email
                  </button>
                )}
                {passwordMsg && (
                  <div className={`p-3 rounded-md text-sm ${passwordMsg.startsWith('✓') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}>
                    {passwordMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 bg-white"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                  {user?.email && (
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      className="text-sm text-primary-700 hover:underline"
                    >
                      Send reset email instead
                    </button>
                  )}
                </div>
                {passwordMsg && (
                  <div className={`p-3 rounded-md text-sm ${passwordMsg.startsWith('✓') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {passwordMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="border-t pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-semibold"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
