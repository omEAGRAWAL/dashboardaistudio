'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  orgId: string | null;
  status: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  orgId: null,
  status: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
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

              // Delete ALL matching invites (prevents orphaned duplicates)
              await Promise.all(inviteDocs.docs.map(d => deleteDoc(d.ref)));
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
            status: 'active',
            createdAt: serverTimestamp(),
          };

          if (newOrgId) {
            userData.orgId = newOrgId;
          }
          
          await setDoc(userDocRef, userData);
          setRole(newRole);
          setOrgId(newOrgId);
          setStatus('active');
        } else {
          const data = userDoc.data();
          let resolvedRole = data.role;
          let resolvedOrgId = data.orgId || null;
          let resolvedStatus = data.status || 'active';

          // Ensure superadmin email always has superadmin role
          if (currentUser.email === 'agrawalom711@gmail.com' && resolvedRole !== 'superadmin') {
            resolvedRole = 'superadmin';
            await updateDoc(userDocRef, { role: 'superadmin' });
          }

          // If user exists but has no org (e.g. suspended or never joined),
          // check if there's a pending invite and apply it
          if (!resolvedOrgId && currentUser.email) {
            const invitesRef = collection(db, 'invites');
            const q = query(invitesRef, where('email', '==', currentUser.email));
            const inviteDocs = await getDocs(q);
            if (!inviteDocs.empty) {
              const inviteData = inviteDocs.docs[0].data();
              resolvedRole = inviteData.role;
              resolvedOrgId = inviteData.orgId;
              resolvedStatus = 'active';
              await Promise.all(inviteDocs.docs.map(d => deleteDoc(d.ref)));
              await updateDoc(userDocRef, { role: resolvedRole, orgId: resolvedOrgId, status: 'active' });
            }
          }

          setRole(resolvedRole);
          setOrgId(resolvedOrgId);
          setStatus(resolvedStatus);
        }
      } else {
        setRole(null);
        setOrgId(null);
        setStatus(null);
      }
      setLoading(false);

      // Silently refresh FCM token if notification permission is already granted.
      // Dynamic import keeps firebase/messaging out of the server-side module graph.
      if (currentUser) {
        import('@/lib/firebase-messaging').then(({ silentTokenRefresh }) => {
          silentTokenRefresh(currentUser.uid);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/cancelled-popup-request') return;
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
    <AuthContext.Provider value={{ user, role, orgId, status, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}
