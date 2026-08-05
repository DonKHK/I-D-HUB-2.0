import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, doc, getDoc, collection, query, where, getDocs, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from '../firebase';
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
          // Try 1: Look up by Firebase Auth UID (document ID = firebaseUser.uid)
          const userDocRef = doc(db, 'UID', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'superadmin') {
              role = ROLES.SUPER_ADMIN;
            }
          } else {
            // Try 2: Fallback — look up by email field in UID collection
            const emailQuery = query(collection(db, 'UID'), where('email', '==', firebaseUser.email));
            const emailSnapshot = await getDocs(emailQuery);
            if (!emailSnapshot.empty) {
              const userData = emailSnapshot.docs[0].data();
              if (userData.role === 'superadmin') {
                role = ROLES.SUPER_ADMIN;
              }
            } else {
              // Try 3: Use email address as document ID directly
              const emailDocRef = doc(db, 'UID', firebaseUser.email);
              const emailDocSnap = await getDoc(emailDocRef);
              if (emailDocSnap.exists()) {
                const userData = emailDocSnap.data();
                if (userData.role === 'superadmin') {
                  role = ROLES.SUPER_ADMIN;
                }
              }
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
        // Anonymous user - could be guest OR project_user
        setFirebaseUser(firebaseUser);
        
        // Check if this anonymous session has a stored project login
        const storedProjectId = sessionStorage.getItem('pmis_project_login_id');
        if (storedProjectId) {
          const storedRole = sessionStorage.getItem('pmis_project_role') === 'owner' ? 'owner' : 'pm';
          setUser({
            uid: firebaseUser.uid,
            email: `project_${storedProjectId}@project`,
            displayName: `Project: ${storedProjectId} (${storedRole === 'owner' ? 'Owner' : 'PM'})`,
            role: ROLES.PROJECT_USER,
            projectId: storedProjectId,
            projectRole: storedRole,
            loginTime: new Date().toISOString(),
          });
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: 'guest@guest',
            displayName: 'Guest',
            role: ROLES.GUEST,
            loginTime: new Date().toISOString(),
          });
        }
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
      sessionStorage.removeItem('pmis_project_login_id');
      sessionStorage.removeItem('pmis_project_role');
      const result = await signInAnonymously(auth);
      return { success: true };
    } catch (error) {
      console.error('Guest login error:', error);
      return { success: false, error: 'Guest login failed: ' + error.message };
    }
  };

  const projectLogin = async (loginId, password) => {
    try {
      const inputId = String(loginId || '').trim();
      const pwd = String(password || '').trim();

      // Step 1: Sign in anonymously FIRST to get auth credentials
      const userCredential = await signInAnonymously(auth);
      const fbUser = userCredential.user;

      // Step 2: Build candidate project IDs.
      //   New login format: {projectId}pm  /  {projectId}owner
      //   Legacy format:    {projectId} + projectPassword
      const candidates = [inputId];
      const lower = inputId.toLowerCase();
      if (lower.endsWith('pm') && inputId.length > 2) candidates.push(inputId.slice(0, -2));
      if (lower.endsWith('owner') && inputId.length > 5) candidates.push(inputId.slice(0, -5));
      const uniqueCandidates = [...new Set(candidates)];

      // Step 3: Verify project credentials from Firestore (we're authenticated)
      let valid = false;
      let projectId = inputId;
      let projectRole = 'pm'; // 'pm' | 'owner' (legacy defaults to PM)

      const q = query(collection(db, 'projects'), where('id', 'in', uniqueCandidates));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const projectDocId = data.id || docSnap.id;

        if (projectDocId === inputId) {
          // Exact project ID match — legacy single-password login
          if (data.projectPassword === pwd) {
            valid = true;
            projectId = projectDocId;
            projectRole = 'pm';
            break;
          }
        } else if (lower.endsWith('owner') && projectDocId === inputId.slice(0, -5)) {
          // Owner login: {projectId}owner + ownerPassword (accept legacy projectPassword too)
          if (data.ownerPassword === pwd || data.projectPassword === pwd) {
            valid = true;
            projectId = projectDocId;
            projectRole = 'owner';
            break;
          }
        } else if (lower.endsWith('pm') && projectDocId === inputId.slice(0, -2)) {
          // PM login: {projectId}pm + pmPassword (accept legacy projectPassword too)
          if (data.pmPassword === pwd || data.projectPassword === pwd) {
            valid = true;
            projectId = projectDocId;
            projectRole = 'pm';
            break;
          }
        }
      }

      if (!valid) {
        // Fallback: try matching by Firestore document ID directly (legacy)
        const projectRef = doc(db, 'projects', inputId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists() && projectSnap.data().projectPassword === pwd) {
          valid = true;
          projectId = projectSnap.id;
          projectRole = 'pm';
        }
      }

      if (!valid) {
        // Wrong credentials: sign out and clean up
        await signOut(auth);
        return { success: false, error: 'Project ID 或密碼不正確' };
      }

      const roleLabel = projectRole === 'owner' ? 'Owner' : 'PM';

      // Step 4: Store project ID + role in session storage
      sessionStorage.setItem('pmis_project_login_id', projectId);
      sessionStorage.setItem('pmis_project_role', projectRole);

      // Step 5: Manually set user as PROJECT_USER (onAuthStateChanged may have already fired as GUEST)
      setFirebaseUser(fbUser);
      setUser({
        uid: fbUser.uid,
        email: `project_${projectId}@project`,
        displayName: `Project: ${projectId} (${roleLabel})`,
        role: ROLES.PROJECT_USER,
        projectId,
        projectRole,
        loginTime: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      sessionStorage.removeItem('pmis_project_login_id');
      sessionStorage.removeItem('pmis_project_role');
      console.error('Project login error:', error);
      return { success: false, error: '登入失敗：' + error.message };
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('pmis_project_login_id');
    sessionStorage.removeItem('pmis_project_role');
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
  const isProjectUser = isAuthenticated && user?.role === ROLES.PROJECT_USER;
  const userProjectId = isProjectUser ? user?.projectId : null;

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
        projectLogin,
        logout,
        isAuthenticated,
        isAdmin,
        isGuest,
        isSuperAdmin,
        isProjectUser,
        userProjectId,
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