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
  {
    id: 'FS-0006',
    name: 'Enterprise Support Scheme (ESS) - 企業支援計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Supports private companies to conduct in-house R&D activities to create new products, processes or services.',
    eligibility: 'Private companies incorporated and carrying out substantive business operations in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-04-15T00:00:00Z',
  },
  {
    id: 'FS-0007',
    name: 'General Support Programme (GSP) - 一般支援計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Supports non-profit making and organisations to foster technology and innovation culture in Hong Kong.',
    eligibility: 'Non-profit making organisations in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-04-15T00:00:00Z',
  },
  {
    id: 'FS-0008',
    name: 'New Industrialisation Acceleration Scheme (NIAS) - 新型工業加速計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 2000000000,
    description: 'Provides funding support of 1:2 (Government:Company) matching for projects setting up new smart production lines in Hong Kong.',
    eligibility: 'Companies with a new or existing production line in Hong Kong; minimum HK$300 million project investment or 50+ new jobs',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0009',
    name: 'New Industrialisation Funding Scheme (NIFS) - 新型工業化資助計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 200000000,
    description: 'Provides funding on a 1:2 (Government:Company) matching basis for new smart production lines in Hong Kong.',
    eligibility: 'Companies to set up new smart production lines in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0010',
    name: 'Public Sector Trial Scheme (PSTS) - 公營機構試用計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Supports the trial use of locally-developed, mature and ready-to-market technologies in the public sector.',
    eligibility: 'Public sector organisations to trial products developed by local companies',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0011',
    name: 'PSTS - HKSTP & Cyberport - 香港科技園公司及數碼港公營機構試用計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Supports trial use of innovative products from HKSTP and Cyberport incubatees in public sector organisations.',
    eligibility: 'Public sector organisations; products from HKSTP or Cyberport companies',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0012',
    name: 'PSTS - TC - 公營機構試用計劃 - TC',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'A dedicated stream of the Public Sector Trial Scheme for products/solutions from Technology Companies (TC).',
    eligibility: 'Public sector organisations; technology companies with mature products',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0013',
    name: 'Research Talent Hub (RTH-ITF) - 研究人才庫計劃',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Provides funding to support companies/institutions to hire research and development talent.',
    eligibility: 'Companies, universities and research institutions holding approved ITF projects',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0014',
    name: 'Research Talent Hub - HKSTP & Cyberport - 為香港科技園及數碼港而設的研究人才庫',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Supports HKSTP and Cyberport companies to employ research talent for technology development.',
    eligibility: 'Companies at HKSTP or Cyberport',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0015',
    name: 'Research Talent Hub - Tech Companies - 為在港進行研究及發展活動的科技公司而設的研究人才庫',
    provider: 'Innovation and Technology Commission',
    totalAmount: 0,
    description: 'Supports technology companies conducting R&D in Hong Kong to employ research talent.',
    eligibility: 'Technology companies conducting R&D activities in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'FS-0016',
    name: 'Environment and Conservation Fund (ECF) - 環境及自然保育基金',
    provider: 'Environmental Protection Department',
    totalAmount: 50000000,
    description: 'Funds projects contributing to environmental protection, nature conservation and building a green community.',
    eligibility: 'Local organisations, schools, NGOs and green groups',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-15T00:00:00Z',
  },
  {
    id: 'FS-0017',
    name: 'Green Transport Fund - 綠色運輸基金',
    provider: 'Transport Department / Environmental Protection Department',
    totalAmount: 200000000,
    description: 'Subsidises trials and adoption of green transport technologies to reduce roadside air pollution.',
    eligibility: 'Public transport operators and businesses in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-15T00:00:00Z',
  },
  {
    id: 'FS-0018',
    name: 'Smart Traffic Fund - 智慧交通基金',
    provider: 'Transport Department',
    totalAmount: 100000000,
    description: 'Funds projects applying technology or innovation to improve road and traffic efficiency and drivers convenience.',
    eligibility: 'Local organisations including companies, research institutions and public bodies',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-15T00:00:00Z',
  },
  {
    id: 'FS-0019',
    name: 'Recycling Fund - 回收基金',
    provider: 'Environmental Protection Department',
    totalAmount: 1000000000,
    description: 'Supports the recycling industry to enhance capabilities and boost productivity through technology.',
    eligibility: 'Recycling industry operators and trade associations in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-15T00:00:00Z',
  },
  {
    id: 'FS-0020',
    name: 'Cleaner Production Partnership Programme (CP3) - 清潔生產夥伴計劃',
    provider: 'Environmental Protection Department',
    totalAmount: 0,
    description: 'Promotes cleaner production in Hong Kong and the Pearl River Delta region to reduce pollution.',
    eligibility: 'Hong Kong-owned factories operating in Hong Kong or the Pearl River Delta',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-05-15T00:00:00Z',
  },
  {
    id: 'FS-0021',
    name: 'Low-carbon Green Research Fund - 低碳綠色科研基金',
    provider: 'Environment and Ecology Bureau',
    totalAmount: 200000000,
    description: 'Funds R&D projects that support low-carbon green technology and decarbonisation.',
    eligibility: 'Local research institutions, universities, and companies',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'FS-0022',
    name: 'Solar Feed-in Tariff - 太陽能發電上網電價補貼',
    provider: 'CLP Power / HK Electric',
    totalAmount: 0,
    description: 'Provides remuneration for electricity generated from renewable energy systems under the Feed-in Tariff Scheme.',
    eligibility: 'Owners of solar PV or wind power systems connected to the grid in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'FS-0023',
    name: 'SME Financing Guarantee Scheme (SFGS) - SME 融資擔保計劃',
    provider: 'Hong Kong Mortgage Corporation',
    totalAmount: 0,
    description: 'Provides guarantees to help SMEs obtain loans for business development and equipment acquisition.',
    eligibility: 'SMEs with fewer than 100 employees in manufacturing or fewer than 50 in non-manufacturing',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'FS-0024',
    name: 'SME Export Marketing Fund (EMF) - 中小企市場推廣基金',
    provider: 'Trade and Industry Department',
    totalAmount: 0,
    description: 'Provides funding for SMEs to participate in export promotion activities to expand markets.',
    eligibility: 'SMEs registered in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'FS-0025',
    name: 'Digital Transformation Support Pilot Programme (DTS) - 數碼轉型支援先導計劃',
    provider: 'Digital Policy Office / Innovation and Technology Commission',
    totalAmount: 500000000,
    description: 'SME-centric programme providing reimbursable funding for ready-to-use basic digital transformation solutions.',
    eligibility: 'SMEs in food, retail, tourism, transportation and other sectors in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 'FS-0026',
    name: 'Innovation and Technology Living Fund (ITLF) - 創科生活基金',
    provider: 'Digital Policy Office',
    totalAmount: 0,
    description: 'Funds social innovation and technology projects that benefit the community.',
    eligibility: 'Non-profit organisations in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 'FS-0027',
    name: 'Chinese Medicine Development Fund (CMDF) - 中藥發展基金',
    provider: 'Chinese Medicine Regulatory Office / DH',
    totalAmount: 0,
    description: 'Supports the development of the Chinese medicine industry in Hong Kong.',
    eligibility: 'Chinese medicine practitioners and industry players in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 'FS-0028',
    name: 'Film Development Fund (FDF) - 電影發展基金',
    provider: 'Create Hong Kong (CreateHK)',
    totalAmount: 0,
    description: 'Supports film production, promotion and talent development in Hong Kong.',
    eligibility: 'Film production companies and professionals in Hong Kong',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: 'FS-0029',
    name: 'Greater Bay Area Youth Employment Scheme - 大灣區青年就業計劃',
    provider: 'Labour Department',
    totalAmount: 0,
    description: 'Provides incentives for enterprises to employ university graduates to work in the GBA cities.',
    eligibility: 'Enterprises in Hong Kong employing graduates at HK$18,000+ monthly salary for GBA positions',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'FS-0030',
    name: 'Greater Bay Area Youth Entrepreneurship Scheme - 大灣區青年創業資助計劃',
    provider: 'Home and Youth Affairs Bureau',
    totalAmount: 0,
    description: 'Supports NGOs to provide startup funding, mentorship and supporting services for young entrepreneurs in GBA.',
    eligibility: 'Hong Kong youth aged 18-40 with business proposals for the GBA',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'FS-0031',
    name: 'Qianhai Modern Services Cooperation Zone - 前海深港現代服務業合作區扶持政策',
    provider: 'Qianhai Authority / Shenzhen Government',
    totalAmount: 0,
    description: 'Policies and subsidies supporting Hong Kong enterprises and talent setting up in the Qianhai cooperation zone.',
    eligibility: 'Hong Kong enterprises and individuals establishing business in Qianhai',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'FS-0032',
    name: 'Hengqin Guangdong-Macao Deep Cooperation Zone - 橫琴粵澳深度合作區支持政策',
    provider: 'Hengqin Government',
    totalAmount: 0,
    description: 'Support policies and innovation incentives for enterprises operating in the Hengqin cooperation zone.',
    eligibility: 'Enterprises registered in the Hengqin cooperation zone with cross-boundary innovation activities',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'FS-0033',
    name: 'Nansha Comprehensive Cooperation Demonstration Zone - 南沙粵港澳全面合作示範區政策',
    provider: 'Nansha Government / Guangzhou',
    totalAmount: 0,
    description: 'Policies supporting Hong Kong and Macau enterprises, talent and innovation in the Nansha demonstration zone.',
    eligibility: 'Hong Kong/Macau enterprises and talent operating in Nansha',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'FS-0034',
    name: 'HKSTP GBA Innovation Park Programmes - 大灣區跨境創科（科技園園區計劃）',
    provider: 'Hong Kong Science and Technology Parks (HKSTP)',
    totalAmount: 0,
    description: 'Cross-boundary innovation and incubation programmes supporting Hong Kong companies expanding into GBA.',
    eligibility: 'HKSTP tenants and incubatees expanding into GBA cities',
    deadline: '2026-12-31',
    status: 'Open',
    createdAt: '2025-07-01T00:00:00Z',
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

// Generate a unique project ID in format: IDND + YYMM + 3-digit sequential number
// e.g. IDND2608009 (year 26, month 08, seq 009)
const generateProjectId = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `IDND${yy}${mm}`;
  const counterKey = `pmis_project_counter_${yy}${mm}`;

  // Read existing counter from localStorage
  let lastSeq = 0;

  // First: scan all existing projects in localStorage to find max seq for this month
  try {
    const cachedProjects = JSON.parse(localStorage.getItem('pmis_projects') || '[]');
    for (const p of cachedProjects) {
      if (p.id && p.id.startsWith(prefix)) {
        const numPart = parseInt(p.id.slice(-3), 10);
        if (!isNaN(numPart) && numPart > lastSeq) {
          lastSeq = numPart;
        }
      }
    }
  } catch (e) { /* ignore */ }

  // Also check the stored counter (in case it's higher than what's in projects)
  try {
    const storedCounter = parseInt(localStorage.getItem(counterKey) || '0', 10);
    if (storedCounter > lastSeq) {
      lastSeq = storedCounter;
    }
  } catch (e) { /* ignore */ }

  // Increment
  const newSeq = lastSeq + 1;
  const seqStr = String(newSeq).padStart(3, '0');

  // Save counter back
  try {
    localStorage.setItem(counterKey, String(newSeq));
  } catch (e) { /* ignore */ }

  return `${prefix}${seqStr}`;
};

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
  const migrationRunningRef = useRef(false);
  const projectMigrationDoneRef = useRef(false);

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

  // Migrate old-format project IDs (e.g. auto-generated Firestore IDs like "MS13KDWRP3TG")
  // to the new IDNDYYMMSSS format.
  // Uses localStorage to track already-migrated projects so it won't re-attempt on re-render.
  const migrateOldProjects = useCallback(async (oldProjects) => {
    if (migrationRunningRef.current) return;
    migrationRunningRef.current = true;

    // Load previously migrated IDs from localStorage
    let migratedIds = [];
    try {
      migratedIds = JSON.parse(localStorage.getItem('pmis_migrated_project_ids') || '[]');
    } catch (e) { /* ignore */ }

    for (const oldProject of oldProjects) {
      const oldId = oldProject.id;
      if (!oldId || oldId.startsWith('IDND') || migratedIds.includes(oldId)) continue;

      const newId = generateProjectId();
      const { id: _, ...projectData } = oldProject;

      try {
        console.log(`Migrating project ${oldId} -> ${newId}`);
        // Step 1: Create new doc with IDND format
        await setDoc(doc(db, COLLECTIONS.PROJECTS, newId), {
          ...projectData,
          id: newId,
          updatedAt: serverTimestamp(),
        });

        // Track as migrated IMMEDIATELY in localStorage (persist after each success)
        // This prevents duplicate IDND docs if subsequent steps fail
        migratedIds.push(oldId);
        try {
          localStorage.setItem('pmis_migrated_project_ids', JSON.stringify(migratedIds));
        } catch (e) { /* ignore */ }

        // Step 2: Mark old doc as migrated (in case delete fails, we can still identify it)
        await setDoc(doc(db, COLLECTIONS.PROJECTS, oldId), {
          _migratedTo: newId,
          _migratedAt: new Date().toISOString(),
        }, { merge: true });
        // Step 3: Try to delete old doc (may fail due to security rules — that's okay)
        try {
          await deleteDoc(doc(db, COLLECTIONS.PROJECTS, oldId));
        } catch (deleteErr) {
          console.warn(`Could not delete old doc ${oldId} (marked as migrated instead):`, deleteErr.message);
        }

        console.log(`Migration successful: ${oldId} -> ${newId}`);
      } catch (e) {
        console.error(`Migration failed for project ${oldId}:`, e);
      }
    }

    migrationRunningRef.current = false;
  }, []);

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

        // Run migration: convert old Firestore auto-generated project IDs
        // (e.g. "MS13KDWRP3TG") to the new IDNDYYMMSSS format.
        // Runs every time onSnapshot fires to catch any remaining old projects.
        const oldProjects = list.filter((p) => p.id && !p.id.startsWith('IDND') && !p._migratedTo);
        if (oldProjects.length > 0) {
          migrateOldProjects(oldProjects);
        }
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
          // Backfill any missing default schemes so newer ones appear for logged-in users
          mergeMissingSchemes(list);
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
  }, [uid, seedIdeasToState, migrateOldProjects]);

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

  // Merge missing default funding schemes into Firestore (by id or name).
  // Ensures logged-in users (admin/superadmin) also get the latest funding
  // scheme list even when Firestore already has older records.
  const mergeMissingSchemes = useCallback(async (existingSchemes) => {
    try {
      const missingSchemes = DEFAULT_FUNDING_SCHEMES.filter((ds) => {
        const nameKey = (ds.name || '').toLowerCase();
        return !existingSchemes.some((s) =>
          s.id === ds.id || (s.name || '').toLowerCase() === nameKey
        );
      });

      if (missingSchemes.length > 0) {
        const batch = writeBatch(db);
        for (const scheme of missingSchemes) {
          const ref = doc(collection(db, COLLECTIONS.FUNDING_SCHEMES));
          batch.set(ref, { ...scheme, uid: 'system', createdAt: scheme.createdAt || new Date().toISOString() });
        }
        await batch.commit();
        console.log(`%c[PMIS] Added ${missingSchemes.length} missing funding schemes to Firestore`, 'color: blue; font-weight: bold');
      }
    } catch (e) {
      console.warn('Merge missing schemes failed:', e.message || e);
    }
  }, []);

  // Seed sample ideas to Firestore (called silently, errors are handled)
  // ONLY seeds documents that don't already exist — NEVER overwrites existing docs
  const seedSampleIdeasToFirestore = useCallback(async () => {
    if (!uid) return;
    try {
      const batch = writeBatch(db);
      for (const idea of sampleIdeas) {
        // Use idea.id (e.g. IDEA-000001) as the Firestore doc ID
        // so that approveIdea/updateIdea can find & update the correct doc
        const ref = doc(db, COLLECTIONS.IDEAS, idea.id);
        // Check if document already exists before overwriting
        const docSnap = await getDoc(ref);
        if (docSnap.exists()) continue; // Skip — don't overwrite approved/rejected ideas
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
    const existingProject = projects.find((p) => p.originalIdeaId === id && !p._migratedTo);
    if (existingProject) {
      await updateIdea(id, { status: 'approved', approvedAt: new Date().toISOString() });
      return existingProject;
    }

    const idea = ideas.find((i) => i.id === id);
    if (!idea) return null;

    const projectId = generateProjectId();
    const project = {
      id: projectId,
      name: idea.title || idea.projectTitle || 'Untitled',
      description: idea.oneLineDesc || idea.shortDescription || idea.background || idea.projectScope || '',
      detailContent: idea.projectScope || idea.detailContent || idea.background || '',
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
      terminationCondition1: idea.terminationCondition1 || '',
      terminationCondition2: idea.terminationCondition2 || '',
      terminationCondition3: idea.terminationCondition3 || '',
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
      description: idea.oneLineDesc || idea.shortDescription || idea.background || idea.projectScope || '',
      detailContent: idea.projectScope || idea.detailContent || idea.background || '',
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

  // Generate a random password for project login
  const generateProjectPassword = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }, []);

  // Set/update project password
  const updateProjectPassword = useCallback(async (projectId, password) => {
    await saveToFirestore(COLLECTIONS.PROJECTS, projectId, { projectPassword: password });
    setProjects((prev) => {
      const newList = prev.map((p) => (p.id === projectId ? { ...p, projectPassword: password } : p));
      cacheToLocal('pmis_projects', newList);
      return newList;
    });
    return password;
  }, [saveToFirestore, cacheToLocal]);

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
        generateProjectPassword,
        updateProjectPassword,
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