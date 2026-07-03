import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, updateProfile, updateEmail, reauthenticateWithPopup, verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileData: (displayName: string, photoURL: string | null, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }
          
          if (!userSnap?.exists()) {
            const userData: any = {
              uid: currentUser.uid,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            };
            if (currentUser.email) userData.email = currentUser.email;
            if (currentUser.displayName) userData.displayName = currentUser.displayName;
            if (currentUser.photoURL) userData.photoURL = currentUser.photoURL;
            
            try {
              await setDoc(userRef, userData);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          } else {
            const updateData: any = {
              lastLoginAt: serverTimestamp(),
            };
            if (currentUser.displayName) updateData.displayName = currentUser.displayName;
            if (currentUser.photoURL) updateData.photoURL = currentUser.photoURL;
            
            try {
              await updateDoc(userRef, updateData);
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
            }
          }
        } catch (error) {
          console.error("Error saving user to Firestore:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  };

  const updateProfileData = async (displayName: string, photoURL: string | null, email: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user is currently signed in.");

    // Validate inputs
    if (!displayName.trim()) {
      throw new Error("Display name cannot be empty.");
    }
    if (!email.trim() || !email.includes('@')) {
      throw new Error("Please enter a valid email address.");
    }

    const emailChanged = email.trim() !== currentUser.email;
    const profileChanged = displayName.trim() !== currentUser.displayName || photoURL !== currentUser.photoURL;

    if (profileChanged) {
      await updateProfile(currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL,
      });
    }

    let verificationSent = false;

    if (emailChanged) {
      // Check if user is signed in with Google
      const isGoogleUser = currentUser.providerData.some(p => p.providerId === 'google.com');
      if (isGoogleUser) {
        throw new Error("Your email address is managed by Google and cannot be modified here.");
      }

      try {
        await updateEmail(currentUser, email.trim());
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(currentUser, provider);
          try {
            await updateEmail(currentUser, email.trim());
          } catch (innerError: any) {
            if (innerError.code === 'auth/operation-not-allowed' || innerError.message?.includes('verify the new email') || innerError.message?.includes('verification')) {
              await verifyBeforeUpdateEmail(currentUser, email.trim());
              verificationSent = true;
            } else {
              throw innerError;
            }
          }
        } else if (error.code === 'auth/operation-not-allowed' || error.message?.includes('verify the new email') || error.message?.includes('verification')) {
          await verifyBeforeUpdateEmail(currentUser, email.trim());
          verificationSent = true;
        } else {
          throw error;
        }
      }
    }

    // Now sync with Firestore
    if (profileChanged || (emailChanged && !verificationSent)) {
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: any = {
        displayName: displayName.trim(),
        photoURL: photoURL,
        lastLoginAt: serverTimestamp(),
      };
      await updateDoc(userRef, updateData);
    } else if (profileChanged && verificationSent) {
      // If profile changed but email is still pending verification, we only sync profile data
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: any = {
        displayName: displayName.trim(),
        photoURL: photoURL,
        lastLoginAt: serverTimestamp(),
      };
      await updateDoc(userRef, updateData);
    }

    // Reload and force state refresh
    await currentUser.reload();
    setUser({ ...auth.currentUser } as User);

    if (verificationSent) {
      throw new Error("verification-email-sent");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
