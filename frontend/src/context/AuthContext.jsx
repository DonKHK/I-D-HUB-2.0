import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, doc, getDoc, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from '../firebase';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state and fetch role from Firestore UID collection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        setFirebaseUser(firebaseUser);

        // Fetch user role from Firestore 'UID' collection
        let role = ROLES.ADMIN;
        try {
          const userDocRef = doc(db, 'UID', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'superadmin') {
              role = ROLES.SUPER_ADMIN;
            }
          }
        } catch (err) {
          console.error('Error fetching user role from Firestore:', err);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role,
          loginTime: new Date().toISOString(),
        });
      } else if (firebaseUser && firebaseUser.isAnonymous) {
        // Anonymous guest user
        setFirebaseUser(firebaseUser);
        setUser({
          uid: firebaseUser.uid,
          email: 'guest@guest',
          displayName: 'Guest',
          role: ROLES.GUEST,
          loginTime: new Date().toISOString(),
        });
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let message = '登入失敗';
      switch (error.code) {
        case 'auth/user-not-found': message = '找不到此用戶'; break;
        case 'auth/wrong-password': message = '密碼錯誤'; break;
        case 'auth/invalid-email': message = '無效的電郵地址'; break;
        case 'auth/invalid-credential': message = '電郵或密碼錯誤'; break;
        case 'auth/too-many-requests': message = '嘗試次數過多，請稍後再試'; break;
        default: message = error.message;
      }
      return { success: false, error: message };
    }
  };

  const guestLogin = async () => {
    try {
      const result = await signInAnonymously(auth);
      return { success: true };
    } catch (error) {
      console.error('Guest login error:', error);
      return { success: false, error: 'Guest login failed: ' + error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && user?.role === ROLES.ADMIN;
  const isSuperAdmin = isAuthenticated && user?.role === ROLES.SUPER_ADMIN;
  const isGuest = isAuthenticated && user?.role === ROLES.GUEST;

  const hasPermission = (roles) => {
    if (!user || !roles) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        guestLogin,
        logout,
        isAuthenticated,
        isAdmin,
        isGuest,
        isSuperAdmin,
        hasPermission,
        ROLES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}