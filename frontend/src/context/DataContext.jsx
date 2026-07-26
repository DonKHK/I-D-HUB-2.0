import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDocs, query, orderBy, onSnapshot, getDoc, serverTimestamp, writeBatch } from '../firebase';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { sampleIdeas } from '../data/sampleIdeas';

const DataContext = createContext(null);

// Backend API base URL — uses Vite proxy (/api -> localhost:5000) by default
// For cross-computer sync, set VITE_API_URL to http://<A_COMPUTER_IP>:5000
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

const DEFAULT_FUNDING_SCHEMES = [
  {
    id: 'FS-0001',
    name: 'Innovation and Technology Fund (ITF)',
    provider: 'Innovation and Technology Commission',
    totalAmount: 50000000,
    description: 'Supports R&D projects in technology and innovation across various industries including construction.',
    eligibility: 'Registered companies in Hong Kong with at least 50% local ownership',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FS-0002',
    name: 'Construction Innovation and Technology Fund (CITF)',
    provider: 'Development Bureau (DEVB)',
    totalAmount: 100000000,
    description: 'Dedicated fund to promote the adoption of innovative construction technologies and digitalization.',
    eligibility: 'Contractors, consultants, and developers registered with the Construction Industry Council',
    deadline: '2026-06-30',
    status: 'Open',
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'FS-0003',
    name: 'Green Tech Fund',
    provider: 'Environment and Ecology Bureau',
    totalAmount: 20000000,
    description: 'Funding for green technology projects that contribute to environmental protection and carbon reduction.',
    eligibility: 'Local companies, research institutions, and NGOs with green technology proposals',
    deadline: '2026-09-30',
    status: 'Open',
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'FS-0004',
    name: 'Technology Voucher Programme (TVP)',
    provider: 'Innovation and Technology Commission',
    totalAmount: 15000000,
    description: 'Funds SMEs to adopt ready-to-use technology solutions to improve productivity and efficiency.',
    eligibility: 'SMEs with fewer than 100 employees in manufacturing or fewer than 50 in non-manufacturing',
    deadline: '2025-12-31',
    status: 'Closed',
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'FS-0005',
    name: 'BUD Fund - Branding, Upgrading and Domestic Sales',
    provider: 'Trade and Industry Department',
    totalAmount: 30000000,
    description: 'Supports local enterprises in branding, upgrading, and domestic sales initiatives with innovation components.',
    eligibility: 'Non-listed Hong Kong registered companies with substantive business in Hong Kong',
    deadline: '2026-03-31',
    status: 'Pending',
    createdAt: '2025-04-01T00:00:00Z',
  },
];

const COLLECTIONS = {
  PROJECTS: 'projects',
  IDEAS: 'ideas',
  FUNDING_SCHEMES: 'funding_schemes',
  SETTINGS: 'settings',
};

// Convert a Firestore doc snapshot to a plain object with id
const snapshotToData = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
});

// Generate a short-ish unique ID
const genId = () => Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

// Check if an error indicates Firestore is unavailable (permission denied or offline)
const isFirestoreUnavailable = (err) => {
  const msg = (err?.message || err?.code || '').toLowerCase();
  return msg.includes('permission') || msg.includes('unavailable') || msg.includes('not found') || msg.includes('failed');
};

// Backend API helpers for A/B computer sync
const apiGet = async () => {
  try {
    const res = await fetch(`${API_BASE}/ideas`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    // Backend not running — silent fallback
    return null;
  }
};

const apiPut = async (id, data) => {
  try {
    const res = await fetch(`${API_BASE}/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

const apiPost = async (data) => {
  try {
    const res = await fetch(`${API_BASE}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

const apiDelete = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/ideas/${id}`, { method: 'DELETE' });
    if (!res.ok) return false;
    return true;
  } catch (e) {
    return false;
  }
};

export function DataProvider({ children }) {
  const { user, firebaseUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [fundingSchemes, setFundingSchemes] = useState([]);
  const [settings, setSettings] = useState(() => DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [firestoreAvailable, setFirestoreAvailable] = useState(true);

  const uid = firebaseUser?.uid || user?.uid;

  // Refs to track seeding attempts (prevent infinite loops inside onSnapshot callbacks)
  const seededIdeasRef = useRef(false);
  const seededSchemesRef = useRef(false);
  const offlineModeRef = useRef(false);

  // Seed ideas directly into state (Firestore fallback mode)
  // Preserves any existing cached data so approved/rejected statuses don't get lost on reload
  const seedIdeasToState = useCallback(() => {
    // Check if we already have cached ideas (which may have status changes)
    let existingCached = [];
    try {
      existingCached = JSON.parse(localStorage.getItem('pmis_ideas') || '[]');
    } catch (e) { /* ignore */ }

    if (existingCached.length > 0) {
      // Use cached data — preserves approved/rejected/other user changes
      setIdeas(existingCached);
      seededIdeasRef.current = true;
      console.log(`%c[PMIS] Loaded ${existingCached.length} ideas from cache (OFFLINE MODE)`, 'color: green; font-weight: bold');
      return;
    }

    // First time — seed from sampleIdeas
    const now = new Date().toISOString();
    const localIdeas = sampleIdeas.map((idea, index) => ({
      ...idea,
      id: idea.id || `IDEA-LOCAL-${String(index + 1).padStart(6, '0')}`,
      uid,
      createdAt: idea.createdAt || now,
      status: idea.status || 'pending',
      aiAnalysis: idea.aiAnalysis || null,
    }));
    setIdeas(localIdeas);
    try {
      localStorage.setItem('pmis_ideas', JSON.stringify(localIdeas));
    } catch (e) { /* ignore */ }
    seededIdeasRef.current = true;
    console.log(`%c[PMIS] Seeded ${localIdeas.length} sample ideas (OFFLINE MODE)`, 'color: green; font-weight: bold');
  }, [uid]);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (!uid) {
      setProjects([]);
      setIdeas([]);
      setFundingSchemes([]);
      setSettings(DEFAULT_SETTINGS);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    setFirestoreAvailable(true);

    // Reset seeding refs
    seededIdeasRef.current = false;
    seededSchemesRef.current = false;

    // Real-time listeners for each collection
    const unsubProjects = onSnapshot(
      query(collection(db, COLLECTIONS.PROJECTS), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(snapshotToData);
        setProjects(list);
        try { localStorage.setItem('pmis_projects', JSON.stringify(list)); } catch (e) { /* ignore */ }
      },
      (err) => {
        console.error('Projects snapshot error:', err);
        setProjects([]);
        if (isFirestoreUnavailable(err)) setFirestoreAvailable(false);
      }
    );

    const unsubIdeas = onSnapshot(
      query(collection(db, COLLECTIONS.IDEAS), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(snapshotToData);
        if (list.length === 0 && !seededIdeasRef.current) {
          // No ideas yet for this user — seed sample ideas
          seedIdeasToState();
          // Attempt to seed to Firestore silently
          seedSampleIdeasToFirestore();
        } else {
          setIdeas(list);
          try { localStorage.setItem('pmis_ideas', JSON.stringify(list)); } catch (e) { /* ignore */ }
        }
      },
      (err) => {
        console.error('Ideas snapshot error:', err);
        if (isFirestoreUnavailable(err)) {
          setFirestoreAvailable(false);
          // Firestore is unavailable — seed from local data instead
          if (!seededIdeasRef.current) {
            seedIdeasToState();
          }
        } else {
          setIdeas([]);
        }
      }
    );

    const unsubSchemes = onSnapshot(
      query(collection(db, COLLECTIONS.FUNDING_SCHEMES), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(snapshotToData);
        if (list.length === 0 && !seededSchemesRef.current) {
          seedDefaultSchemes();
        } else {
          setFundingSchemes(list);
          try { localStorage.setItem('pmis_funding_schemes', JSON.stringify(list)); } catch (e) { /* ignore */ }
        }
      },
      (err) => {
        console.error('Funding schemes snapshot error:', err);
        if (isFirestoreUnavailable(err)) {
          setFirestoreAvailable(false);
          if (!seededSchemesRef.current) {
            setFundingSchemes(DEFAULT_FUNDING_SCHEMES);
            seededSchemesRef.current = true;
            try { localStorage.setItem('pmis_funding_schemes', JSON.stringify(DEFAULT_FUNDING_SCHEMES)); } catch (e) { /* ignore */ }
          }
        } else {
          setFundingSchemes([]);
        }
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, COLLECTIONS.SETTINGS, uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...snapshot.data() }));
        } else {
          // Set default settings
          setDoc(doc(db, COLLECTIONS.SETTINGS, uid), { ...DEFAULT_SETTINGS, uid }).catch(() => {
            // Settings write failed — keep defaults
            setSettings(DEFAULT_SETTINGS);
          });
          setSettings(DEFAULT_SETTINGS);
        }
      },
      (err) => {
        console.error('Settings snapshot error:', err);
        setSettings(DEFAULT_SETTINGS);
      }
    );

    // Also load from localStorage as fallback cache for immediate display
    try {
      const cachedProjects = JSON.parse(localStorage.getItem('pmis_projects') || '[]');
      if (cachedProjects.length > 0) setProjects(cachedProjects);
      const cachedIdeas = JSON.parse(localStorage.getItem('pmis_ideas') || '[]');
      if (cachedIdeas.length > 0 && !seededIdeasRef.current) setIdeas(cachedIdeas);
      const cachedSchemes = JSON.parse(localStorage.getItem('pmis_funding_schemes') || '[]');
      if (cachedSchemes.length > 0) setFundingSchemes(cachedSchemes);
    } catch (e) {
      // ignore cache errors
    }

    return () => {
      unsubProjects();
      unsubIdeas();
      unsubSchemes();
      unsubSettings();
    };
  }, [uid, seedIdeasToState]);

  // Seed default funding schemes if Firestore is empty
  const seedDefaultSchemes = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      for (const scheme of DEFAULT_FUNDING_SCHEMES) {
        const ref = doc(collection(db, COLLECTIONS.FUNDING_SCHEMES));
        batch.set(ref, { ...scheme, uid: 'system', createdAt: scheme.createdAt || new Date().toISOString() });
      }
      await batch.commit();
      seededSchemesRef.current = true;
    } catch (e) {
      console.error('Seed default schemes error:', e);
      // Fallback: set locally
      if (!seededSchemesRef.current) {
        setFundingSchemes(DEFAULT_FUNDING_SCHEMES);
        seededSchemesRef.current = true;
      }
    }
  }, []);

  // Seed sample ideas to Firestore (called silently, errors are handled)
  const seedSampleIdeasToFirestore = useCallback(async () => {
    if (!uid) return;
    try {
      const batch = writeBatch(db);
      for (const idea of sampleIdeas) {
        // Use idea.id (e.g. IDEA-000001) as the Firestore doc ID
        // so that approveIdea/updateIdea can find & update the correct doc
        const ref = doc(db, COLLECTIONS.IDEAS, idea.id);
        // Strip the id field from data to avoid conflict with doc ID
        const { id, ...cleanIdea } = idea;
        batch.set(ref, { ...cleanIdea, id: idea.id, uid, createdAt: idea.createdAt || new Date().toISOString(), status: idea.status || 'pending', aiAnalysis: idea.aiAnalysis || null });
      }
      await batch.commit();
      console.log(`%c[PMIS] Seeded ${sampleIdeas.length} sample ideas to Firestore for user ${uid}`, 'color: blue; font-weight: bold');
    } catch (e) {
      console.warn('Seed sample ideas to Firestore failed (offline mode enabled):', e.message || e);
      // Ideas are already set in state by seedIdeasToState(), so this is fine
    }
  }, [uid]);
  // Auto-save to Firestore (create/update helper)
  const saveToFirestore = useCallback(async (collectionName, id, data) => {
    try {
      if (id && id.length > 0) {
        const ref = doc(db, collectionName, id);
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
        return id;
      } else {
        const ref = await addDoc(collection(db, collectionName), { ...data, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        return ref.id;
      }
    } catch (e) {
      console.error(`Firestore save error (${collectionName}):`, e);
      return id || ('local-' + Date.now());
    }
  }, [uid]);

  // Also cache to localStorage
  const cacheToLocal = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }, []);

  // Project CRUD
  const addProject = useCallback(async (project) => {
    const newProject = { ...project, createdAt: new Date().toISOString(), uid };
    // Use the project's own id so Firestore doc ID matches our custom ID
    const projectId = project.id || null;
    const id = await saveToFirestore(COLLECTIONS.PROJECTS, projectId, newProject);
    const saved = { ...newProject, id };
    setProjects((prev) => {
      const updated = [saved, ...prev];
      cacheToLocal('pmis_projects', updated);
      return updated;
    });
    return saved;
  }, [uid, saveToFirestore, cacheToLocal, projects]);

  const updateProject = useCallback(async (id, updates) => {
    await saveToFirestore(COLLECTIONS.PROJECTS, id, updates);
    setProjects((prev) => {
      const newList = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      cacheToLocal('pmis_projects', newList);
      return newList;
    });
  }, [saveToFirestore, cacheToLocal]);

  const deleteProject = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));
    } catch (e) {
      console.error('Delete project error:', e);
    }
    setProjects((prev) => {
      const newList = prev.filter((p) => p.id !== id);
      cacheToLocal('pmis_projects', newList);
      return newList;
    });
  }, [cacheToLocal]);

  // Idea CRUD — also syncs to backend API for cross-computer A/B sync
  const addIdea = useCallback(async (idea) => {
    const newIdea = { ...idea, createdAt: new Date().toISOString(), status: 'pending', uid };
    const id = await saveToFirestore(COLLECTIONS.IDEAS, null, newIdea);
    const saved = { ...newIdea, id };
    setIdeas((prev) => [saved, ...prev]);
    cacheToLocal('pmis_ideas', [saved, ...ideas]);
    // Also push to backend API so the other computer can see it
    apiPost(saved);
    return saved;
  }, [uid, saveToFirestore, cacheToLocal, ideas]);

  const updateIdea = useCallback(async (id, updates) => {
    await saveToFirestore(COLLECTIONS.IDEAS, id, updates);
    setIdeas((prev) => {
      const newList = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      cacheToLocal('pmis_ideas', newList);
      return newList;
    });
    // Also push to backend API
    apiPut(id, updates);
  }, [saveToFirestore, cacheToLocal]);

  const deleteIdea = useCallback(async (id) => {
    const updates = { status: 'deleted', deletedAt: new Date().toISOString() };
    await saveToFirestore(COLLECTIONS.IDEAS, id, updates);
    setIdeas((prev) => {
      const newList = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      cacheToLocal('pmis_ideas', newList);
      return newList;
    });
    // Also sync to backend API
    apiDelete(id);
  }, [saveToFirestore, cacheToLocal]);

  const permanentlyDeleteIdea = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.IDEAS, id));
    } catch (e) {
      console.error('Permanent delete idea error:', e);
    }
    setIdeas((prev) => {
      const newList = prev.filter((i) => i.id !== id);
      cacheToLocal('pmis_ideas', newList);
      return newList;
    });
    apiDelete(id);
  }, [cacheToLocal]);

  const restoreIdea = useCallback(async (id) => {
    const updates = { status: 'pending', deletedAt: null };
    await saveToFirestore(COLLECTIONS.IDEAS, id, updates);
    setIdeas((prev) => {
      const newList = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      cacheToLocal('pmis_ideas', newList);
      return newList;
    });
    apiPut(id, updates);
  }, [saveToFirestore, cacheToLocal]);

  // Funding Scheme CRUD
  const addFundingScheme = useCallback(async (scheme) => {
    const newScheme = { ...scheme, createdAt: new Date().toISOString(), uid };
    const id = await saveToFirestore(COLLECTIONS.FUNDING_SCHEMES, null, newScheme);
    const saved = { ...newScheme, id };
    setFundingSchemes((prev) => [saved, ...prev]);
    cacheToLocal('pmis_funding_schemes', [saved, ...fundingSchemes]);
    return saved;
  }, [uid, saveToFirestore, cacheToLocal, fundingSchemes]);

  const updateFundingScheme = useCallback(async (id, updates) => {
    await saveToFirestore(COLLECTIONS.FUNDING_SCHEMES, id, updates);
    setFundingSchemes((prev) => {
      const newList = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      cacheToLocal('pmis_funding_schemes', newList);
      return newList;
    });
  }, [saveToFirestore, cacheToLocal]);

  const deleteFundingScheme = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.FUNDING_SCHEMES, id));
    } catch (e) {
      console.error('Delete funding scheme error:', e);
    }
    setFundingSchemes((prev) => {
      const newList = prev.filter((s) => s.id !== id);
      cacheToLocal('pmis_funding_schemes', newList);
      return newList;
    });
  }, [cacheToLocal]);

  // Approve idea → auto-generate project (no duplicate)
  const approveIdea = useCallback(async (id) => {
    const existingProject = projects.find((p) => p.originalIdeaId === id);
    if (existingProject) {
      await updateIdea(id, { status: 'approved', approvedAt: new Date().toISOString() });
      return existingProject;
    }

    const idea = ideas.find((i) => i.id === id);
    if (!idea) return null;

    const projectId = genId();
    const project = {
      id: projectId,
      name: idea.title || idea.projectTitle || 'Untitled',
      description: idea.oneLineDesc || idea.shortDescription || '',
      detailContent: idea.projectScope || idea.detailContent || '',
      applicantName: idea.applicantName || '',
      department: idea.department || '',
      contactNumber: idea.contactNumber || '',
      email: idea.email || '',
      projectManagerName: idea.projectManagerName || '',
      projectManagerDept: idea.projectManagerDept || '',
      projectManagerEmail: idea.projectManagerEmail || '',
      projectManagerPhone: idea.projectManagerPhone || '',
      ownerName: idea.ownerName || '',
      ownerDept: idea.ownerDept || '',
      ownerContact: idea.ownerContact || '',
      ownerEmail: idea.ownerEmail || '',
      techSupportName: idea.techSupportName || '',
      techSupportDept: idea.techSupportDept || '',
      techSupportContact: idea.techSupportContact || '',
      techSupportEmail: idea.techSupportEmail || '',
      projectType: idea.projectType || '',
      background: idea.background || '',
      painPoint: idea.painPoint || '',
      currentWorkarounds: idea.currentWorkarounds || '',
      deliverables: idea.deliverables || '',
      benefits: idea.benefits || '',
      projectPhases: idea.projectPhases || '',
      risks: idea.risks || '',
      targetCompletionDate: idea.targetCompletionDate || '',
      terminationCondition1: idea.terminationCondition1 || '',
      terminationCondition2: idea.terminationCondition2 || '',
      terminationCondition3: idea.terminationCondition3 || '',
      totalBudget: idea.totalBudget || idea.budget || 0,
      fundSource: idea.fundSource || '',
      budgetBreakdown: idea.budgetBreakdown || '',
      targetGovFund: idea.targetGovFund || 0,
      targetGovFundDetails: idea.targetGovFundDetails || '',
      budgetUsed: 0,
      resourceRequirements: idea.resourceRequirements || '',
      crossDeptAssistance: idea.crossDeptAssistance || '',
      techDirection: idea.techDirection || '',
      innovationElement: idea.innovationElement || '',
      technicalRequirements: idea.technicalRequirements || '',
      requireIP: idea.requireIP || 'No',
      ipRegion: idea.ipRegion || '',
      remarks: idea.remarks || '',
      businessProposalFile: idea.businessProposalFile || '',
      otherDocFile: idea.otherDocFile || '',
      governmentGrant: idea.governmentGrant || null,
      technicalSupport: idea.technicalSupport || idea.techSupportDept || '',
      manager: idea.manager || idea.projectManagerName || idea.ownerName || '',
      holder: idea.holder || idea.applicant || idea.applicantName || '',
      startDate: idea.startDate || idea.expectedStartDate || '',
      endDate: idea.endDate || idea.expectedEndDate || idea.targetCompletionDate || '',
      budget: idea.totalBudget || idea.budget || 0,
      status: 'Planning',
      stages: [],
      isIdeaConversion: true,
      originalIdeaId: idea.id,
      uid,
      createdAt: new Date().toISOString(),
    };

    await addProject(project);
    await updateIdea(id, { status: 'approved', approvedAt: new Date().toISOString() });

    return project;
  }, [ideas, projects, addProject, updateIdea]);

  const rejectIdea = useCallback(async (id, reason) => {
    await updateIdea(id, { status: 'rejected', rejectReason: reason || '' });
  }, [updateIdea]);

  const convertIdeaToProject = useCallback((idea) => {
    const project = {
      id: '',
      name: idea.title || idea.projectTitle || 'Untitled',
      description: idea.oneLineDesc || idea.shortDescription || '',
      detailContent: idea.projectScope || idea.detailContent || '',
      applicantName: idea.applicantName || '',
      department: idea.department || '',
      contactNumber: idea.contactNumber || '',
      email: idea.email || '',
      projectManagerName: idea.projectManagerName || '',
      projectManagerDept: idea.projectManagerDept || '',
      projectManagerEmail: idea.projectManagerEmail || '',
      projectManagerPhone: idea.projectManagerPhone || '',
      ownerName: idea.ownerName || '',
      ownerDept: idea.ownerDept || '',
      ownerContact: idea.ownerContact || '',
      ownerEmail: idea.ownerEmail || '',
      techSupportName: idea.techSupportName || '',
      techSupportDept: idea.techSupportDept || '',
      techSupportContact: idea.techSupportContact || '',
      techSupportEmail: idea.techSupportEmail || '',
      projectType: idea.projectType || '',
      background: idea.background || '',
      painPoint: idea.painPoint || '',
      currentWorkarounds: idea.currentWorkarounds || '',
      deliverables: idea.deliverables || '',
      benefits: idea.benefits || '',
      projectPhases: idea.projectPhases || '',
      risks: idea.risks || '',
      targetCompletionDate: idea.targetCompletionDate || '',
      terminationCondition1: idea.terminationCondition1 || '',
      terminationCondition2: idea.terminationCondition2 || '',
      terminationCondition3: idea.terminationCondition3 || '',
      totalBudget: idea.totalBudget || idea.budget || 0,
      fundSource: idea.fundSource || '',
      budgetBreakdown: idea.budgetBreakdown || '',
      targetGovFund: idea.targetGovFund || 0,
      targetGovFundDetails: idea.targetGovFundDetails || '',
      budgetUsed: 0,
      resourceRequirements: idea.resourceRequirements || '',
      crossDeptAssistance: idea.crossDeptAssistance || '',
      techDirection: idea.techDirection || '',
      innovationElement: idea.innovationElement || '',
      technicalRequirements: idea.technicalRequirements || '',
      requireIP: idea.requireIP || 'No',
      ipRegion: idea.ipRegion || '',
      remarks: idea.remarks || '',
      businessProposalFile: idea.businessProposalFile || '',
      otherDocFile: idea.otherDocFile || '',
      governmentGrant: idea.governmentGrant || null,
      technicalSupport: idea.technicalSupport || idea.techSupportDept || '',
      manager: idea.manager || idea.projectManagerName || idea.ownerName || '',
      holder: idea.holder || idea.applicant || idea.applicantName || '',
      startDate: idea.startDate || idea.expectedStartDate || '',
      endDate: idea.endDate || idea.expectedEndDate || idea.targetCompletionDate || '',
      budget: idea.totalBudget || idea.budget || 0,
      status: 'Planning',
      stages: [],
      isIdeaConversion: true,
      originalIdeaId: idea.id,
      createdAt: new Date().toISOString(),
    };
    return project;
  }, []);

  // Settings
  const updateSettings = useCallback(async (newSettings) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      if (uid) {
        setDoc(doc(db, COLLECTIONS.SETTINGS, uid), { ...merged, uid, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
      }
      return merged;
    });
  }, [uid]);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    if (uid) {
      setDoc(doc(db, COLLECTIONS.SETTINGS, uid), { ...DEFAULT_SETTINGS, uid, updatedAt: serverTimestamp() }, { merge: true }).catch(console.error);
    }
  }, [uid]);

  // Backup / Restore
  const backupAll = useCallback(() => {
    return {
      projects,
      ideas,
      settings,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
  }, [projects, ideas, settings]);

  const restoreBackup = useCallback(async (data) => {
    if (data.projects && Array.isArray(data.projects)) {
      for (const p of data.projects) {
        await saveToFirestore(COLLECTIONS.PROJECTS, p.id || null, p);
      }
      setProjects(data.projects);
      cacheToLocal('pmis_projects', data.projects);
    }
    if (data.ideas && Array.isArray(data.ideas)) {
      for (const i of data.ideas) {
        await saveToFirestore(COLLECTIONS.IDEAS, i.id || null, i);
      }
      setIdeas(data.ideas);
      cacheToLocal('pmis_ideas', data.ideas);
    }
    if (data.settings) {
      const merged = { ...DEFAULT_SETTINGS, ...data.settings };
      setSettings(merged);
      if (uid) {
        setDoc(doc(db, COLLECTIONS.SETTINGS, uid), { ...merged, uid }, { merge: true }).catch(console.error);
      }
    }
  }, [uid, saveToFirestore, cacheToLocal]);

  // Periodic backend API polling — sync changes from the other computer
  useEffect(() => {
    if (!uid) return;

    const pollInterval = setInterval(async () => {
      const remoteIdeas = await apiGet();
      if (!remoteIdeas || !Array.isArray(remoteIdeas) || remoteIdeas.length === 0) return;

      setIdeas((currentIdeas) => {
        // Merge remote ideas into local state
        // Keep all local ideas, but overwrite status/updated fields if remote has newer data
        const localById = {};
        currentIdeas.forEach((i) => { localById[i.id] = i; });

        let changed = false;
        remoteIdeas.forEach((remote) => {
          const local = localById[remote.id];
          if (local) {
            // If remote has a newer updatedAt, prefer remote status/fields
            const localUpdated = local.updatedAt || local.createdAt || '';
            const remoteUpdated = remote.updatedAt || remote.createdAt || '';
            if (remoteUpdated > localUpdated) {
              localById[remote.id] = { ...local, ...remote };
              changed = true;
            } else if (local.status !== remote.status && local.status === 'pending') {
              // If local is stale (still pending) but remote has been approved/rejected, take remote
              localById[remote.id] = { ...local, ...remote };
              changed = true;
            }
          } else {
            // New idea from the other computer
            localById[remote.id] = remote;
            changed = true;
          }
        });

        if (changed) {
          const merged = Object.values(localById);
          try { localStorage.setItem('pmis_ideas', JSON.stringify(merged)); } catch (e) { /* ignore */ }
          return merged;
        }
        return currentIdeas;
      });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [uid]);

  // Manual sync trigger
  const syncFromRemote = useCallback(async () => {
    const remoteIdeas = await apiGet();
    if (!remoteIdeas || !Array.isArray(remoteIdeas)) {
      return { success: false, message: 'Backend not reachable' };
    }
    setIdeas((currentIdeas) => {
      const byId = {};
      currentIdeas.forEach((i) => { byId[i.id] = i; });
      remoteIdeas.forEach((r) => { byId[r.id] = { ...(byId[r.id] || {}), ...r }; });
      const merged = Object.values(byId);
      try { localStorage.setItem('pmis_ideas', JSON.stringify(merged)); } catch (e) { /* ignore */ }
      return merged;
    });
    return { success: true, message: `Synced ${remoteIdeas.length} ideas from backend` };
  }, []);

  return (
    <DataContext.Provider
      value={{
        projects,
        ideas,
        deletedIdeas: ideas.filter((i) => i.status === 'deleted'),
        fundingSchemes,
        settings,
        loaded,
        firestoreAvailable,
        addProject,
        updateProject,
        deleteProject,
        addIdea,
        updateIdea,
        deleteIdea,
        permanentlyDeleteIdea,
        restoreIdea,
        approveIdea,
        rejectIdea,
        convertIdeaToProject,
        addFundingScheme,
        updateFundingScheme,
        deleteFundingScheme,
        updateSettings,
        resetSettings,
        backupAll,
        restoreBackup,
        syncFromRemote,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}