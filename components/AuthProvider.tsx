'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  orgId: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  orgId: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Check if they have a pending invite
          let newRole = 'agent';
          let newOrgId = null;
          
          if (currentUser.email) {
            const invitesRef = collection(db, 'invites');
            const q = query(invitesRef, where('email', '==', currentUser.email));
            const inviteDocs = await getDocs(q);
            
            if (!inviteDocs.empty) {
              const invite = inviteDocs.docs[0];
              const inviteData = invite.data();
              newRole = inviteData.role;
              newOrgId = inviteData.orgId;
              
              // Delete the invite since it's used
              await deleteDoc(invite.ref);
            }
          }

          const isFirstUser = currentUser.email === 'agrawalom711@gmail.com';
          if (isFirstUser) {
            newRole = 'superadmin';
          }
          
          const userData: any = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: newRole,
            createdAt: serverTimestamp(),
          };

          if (newOrgId) {
            userData.orgId = newOrgId;
          }
          
          await setDoc(userDocRef, userData);
          setRole(newRole);
          setOrgId(newOrgId);
        } else {
          const data = userDoc.data();
          setRole(data.role);
          setOrgId(data.orgId || null);
        }
      } else {
        setRole(null);
        setOrgId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, orgId, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}
