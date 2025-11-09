import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, firebaseInitError, firebaseInitialized } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type User = { 
  id: string; 
  email: string;
  displayName?: string;
  photoURL?: string;
} | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseInitError) {
      console.error('[Auth] Skipping auth subscription due to Firebase init failure:', firebaseInitError);
      setLoading(false);
      return;
    }
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Load user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userData?.displayName,
            photoURL: userData?.photoURL,
          });
          console.log('[Auth] User signed in:', firebaseUser.email);
        } catch (error) {
          console.error('[Auth] Error loading user profile:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
          });
        }
      } else {
        setUser(null);
        console.log('[Auth] User signed out');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Login successful');
    } catch (error: any) {
      console.error('[Auth] Login error:', error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Signup successful');
    } catch (error: any) {
      console.error('[Auth] Signup error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('[Auth] Logout successful');
    } catch (error: any) {
      console.error('[Auth] Logout error:', error.message);
      throw error;
    }
  };

  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Update Firestore
      await setDoc(doc(db, 'users', user.id), {
        displayName,
        photoURL,
        email: user.email,
      }, { merge: true });

      // Update local state
      setUser({
        ...user,
        displayName,
        photoURL,
      });

      console.log('[Auth] Profile updated successfully');
    } catch (error: any) {
      console.error('[Auth] Profile update error:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
