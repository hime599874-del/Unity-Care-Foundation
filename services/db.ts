
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  deleteDoc,
  runTransaction,
  writeBatch,
  increment,
  limit,
  setDoc,
  getDocs,
  getDoc,
  getDocFromServer
} from "firebase/firestore";
import { User, Transaction, UserStatus, TransactionStatus, AppStats, Notification, Expense, AssistanceRequest, AssistanceStatus, Suggestion, Complaint, ContactConfig, ProjectProgress, MemberActivity, ActivityType, RecipientInfo, FundType, SmsRecord } from '../types';

import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let firestore: any;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  // If dbId is "(default)", we should pass undefined to use the default database
  const actualDbId = dbId && dbId !== '(default)' ? dbId : undefined;
  
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, actualDbId);
} catch (e: any) {
  if (e.message && e.message.includes('already been called')) {
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    const actualDbId = dbId && dbId !== '(default)' ? dbId : undefined;
    firestore = getFirestore(app, actualDbId);
  } else {
    console.error("🔥 Firestore Initialization Error:", e);
    // Fallback to basic getFirestore
    firestore = getFirestore(app);
  }
}

async function testConnection() {
  try {
    // Use a more robust check that doesn't rely on a specific document existing
    await getDocFromServer(doc(firestore, 'metadata', 'stats'));
    console.log("✅ Firebase: Connection verified successfully.");
  } catch (error) {
    if(error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('offline') || msg.includes('reach cloud firestore')) {
        console.error("🔥 Firebase Connection Error: Could not reach Cloud Firestore. Please check your internet connection or Firebase project status.");
      } else if (msg.includes('permission-denied') || msg.includes('missing or insufficient permissions')) {
        console.error("🔥 Firebase Permission Error: Security rules might be blocking access. Please verify your firestore.rules.");
      } else {
        console.warn("⚠️ Firebase Connection Warning:", error.message);
      }
    }
  }
}
testConnection();

/**
 * Safe logging to prevent circularity errors during error reporting.
 */
const safeError = (msg: string, err: any) => {
    try {
        // Avoid JSON.stringify on potentially circular Firestore error objects.
        // Modern consoles handle circularity. If we need a plain object, we'd need a circular-safe clone.
        console.error(msg, err);
    } catch (e) {
        console.error(msg, "[Circular Error Object]");
    }
};

/**
 * Robust deep cleaning to convert Firestore snapshots to plain JS objects.
 * Prevents internal circular references from polluting the application state.
 * Specifically targets minified Firestore internal objects like 'Q$1' and 'Sa'.
 */
const toPlainObject = (data: any, visited = new WeakSet()): any => {
  if (data === null || data === undefined) return data;
  
  const type = typeof data;
  if (type !== 'object') return data;
  
  // Circularity check
  if (visited.has(data)) return "[Circular]";
  
  // Convert Firestore Timestamp to epoch
  if (typeof data.toDate === 'function') return data.toDate().getTime();
  
  // Standard Dates to epoch
  if (data instanceof Date) return data.getTime();
  
  // Arrays
  if (Array.isArray(data)) {
    visited.add(data);
    return data.map(i => toPlainObject(i, visited));
  }
  
  // Fast path for plain objects that don't look like Firestore internals
  const constructorName = data.constructor?.name;
  if (constructorName && (
    constructorName === 'Q$1' || 
    constructorName === 'Sa' || 
    constructorName === 'DocumentReference' || 
    constructorName === 'Query' ||
    constructorName === 'CollectionReference'
  )) {
    try {
      if (data.id && typeof data.id === 'string') return data.id;
      if (data.path && typeof data.path === 'string') return data.path;
    } catch (e) {}
    return null;
  }

  // Plain Objects
  visited.add(data);
  const result: any = {};
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (key.startsWith('_') || key === 'firestore' || key === 'converter' || key === 'src' || key === 'i') continue;
      
      const val = data[key];
      if (typeof val === 'function') continue;
      result[key] = toPlainObject(val, visited);
    }
  }
  return result;
};

const sanitizeForUpload = (data: any, visited = new WeakSet()): any => {
  if (data === null || data === undefined) return null;
  
  const type = typeof data;
  if (type === 'string' || type === 'number' || type === 'boolean') return data;
  if (data instanceof Date) return data.getTime();
  
  if (type === 'object') {
    if (visited.has(data)) return null;
    visited.add(data);

    if (Array.isArray(data)) {
      return data.map(i => sanitizeForUpload(i, visited)).filter(i => i !== null);
    }

    const constructorName = data.constructor?.name;
    const proto = Object.getPrototypeOf(data);
    const isPlain = proto === Object.prototype || proto === null;
    
    const hasMarkers = 
      data.firestore || 
      data._firestore || 
      data.src || 
      data.i || 
      data._delegate ||
      (constructorName && (
        constructorName === 'Q$1' || 
        constructorName === 'Sa' || 
        constructorName.length <= 3
      ));

    if (!isPlain || hasMarkers) {
      return null;
    }

    const clean: any = {};
    const keys = Object.keys(data);
    for (const key of keys) {
      if (key.startsWith('_') || key === 'src' || key === 'i' || key === 'firestore') continue;
      try {
        const val = sanitizeForUpload(data[key], visited);
        if (val !== null && val !== undefined) clean[key] = val;
      } catch (e) {}
    }
    return Object.keys(clean).length > 0 ? clean : null;
  }
  return null;
};

class FirebaseDB {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private assistanceRequests: AssistanceRequest[] = [];
  private expenses: Expense[] = [];
  private projects: ProjectProgress[] = [];
  private suggestions: Suggestion[] = [];
  private complaints: Complaint[] = [];
  private activities: MemberActivity[] = [];
  private recipients: RecipientInfo[] = [];
  private smsHistory: SmsRecord[] = [];
  private stats: AppStats = { totalCollection: 0, totalExpense: 0, totalUsers: 0, pendingRequests: 0, totalSmsSent: 0 };
  private contactConfig: ContactConfig = {
    whatsapp: 'https://chat.whatsapp.com/C39euDOPaskI3KoeNZMW2H?mode=gi_t',
    facebook: 'https://www.facebook.com/share/17peDnCVEV/',
    messenger: 'https://m.me/unitycarefoundation',
    email: 'unitycarefoundation07@gmail.com',
    phone: '01777599874',
    policyUrl: 'https://drive.google.com/file/d/13v3j9HdOhmpU3UZ60W9xbGy4C4_lM9S-/view?usp=drivesdk',
    maintenanceMode: typeof localStorage !== 'undefined' ? localStorage.getItem('maintenance_mode') === 'true' : false,
    disableRegistration: false
  };
  private listeners: (() => void)[] = [];
  private isReady: boolean = false;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private metadataListenersAttached: boolean = false;
  private unsubscribeContact: (() => void) | null = null;
  private unsubscribeStats: (() => void) | null = null;

  constructor() { 
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
      
      // Safety timeout: Resolve ready state after 8 seconds even if some syncs are slow
      // This prevents the app from being stuck on the splash screen indefinitely
      setTimeout(() => {
        if (!this.isReady) {
          console.warn("🔥 Firebase: Ready state reached via timeout. Some data may still be syncing.");
          this.isReady = true;
          this.resolveReady();
        }
      }, 8000);
    });
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }
    
    this.loadData(); 
  }

  getIsOnline(): boolean { return this.isOnline; }

  private async loadData(collectionsToRefresh?: string[]) {
    try {
      const refreshAll = !collectionsToRefresh || collectionsToRefresh.length === 0;
      
      if (refreshAll && !this.metadataListenersAttached) {
        this.metadataListenersAttached = true;
        
        const attachContactListener = () => {
          if (this.unsubscribeContact) this.unsubscribeContact();
          this.unsubscribeContact = onSnapshot(doc(firestore, "metadata", "contact"), (snapshot) => {
            if (snapshot.exists()) {
              const data = toPlainObject(snapshot.data());
              if (data) {
                this.contactConfig = data as ContactConfig;
                // Cache maintenance mode
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('maintenance_mode', String(this.contactConfig.maintenanceMode));
                }
                this.notify();
              }
            }
          }, (error) => {
            console.error("Contact listener error:", error);
            // Re-attach after delay if it fails (e.g., quota exceeded)
            setTimeout(attachContactListener, 10000);
          });
        };
        attachContactListener();

        const attachStatsListener = () => {
          if (this.unsubscribeStats) this.unsubscribeStats();
          this.unsubscribeStats = onSnapshot(doc(firestore, "metadata", "stats"), (snapshot) => {
            if (snapshot.exists()) {
              const data = toPlainObject(snapshot.data());
              if (data) {
                this.stats = { 
                  ...this.stats, 
                  totalCollection: data.totalCollection || 0, 
                  totalExpense: data.totalExpense || 0,
                  totalSmsSent: data.totalSmsSent || 0
                };
                this.notify();
              }
            }
          }, (error) => {
            console.error("Stats listener error:", error);
            setTimeout(attachStatsListener, 10000);
          });
        };
        attachStatsListener();

        const promises: Promise<void>[] = [];

        const fetchCollection = async (colName: string, queryObj: any, callback: (data: any[]) => void) => {
          try {
            const snapshot = await getDocs(queryObj);
            const data = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) }));
            callback(data);
          } catch (error) {
            console.error(`Error fetching ${colName}:`, error);
          }
        };

        promises.push(fetchCollection('users', query(collection(firestore, "users"), limit(50)), (data) => this.users = data as User[]));
        promises.push(fetchCollection('transactions', query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(50)), (data) => this.transactions = data as Transaction[]));
        promises.push(fetchCollection('assistance_requests', query(collection(firestore, "assistance_requests"), orderBy("timestamp", "desc"), limit(20)), (data) => this.assistanceRequests = data as AssistanceRequest[]));
        promises.push(fetchCollection('expenses', query(collection(firestore, "expenses"), orderBy("timestamp", "desc"), limit(20)), (data) => this.expenses = data as Expense[]));
        promises.push(fetchCollection('projects', query(collection(firestore, "projects"), orderBy("timestamp", "desc"), limit(20)), (data) => this.projects = data as ProjectProgress[]));
        promises.push(fetchCollection('suggestions', query(collection(firestore, "suggestions"), orderBy("timestamp", "desc"), limit(20)), (data) => this.suggestions = data as Suggestion[]));
        promises.push(fetchCollection('complaints', query(collection(firestore, "complaints"), orderBy("timestamp", "desc"), limit(20)), (data) => this.complaints = data as Complaint[]));
        promises.push(fetchCollection('activities', query(collection(firestore, "activities"), orderBy("timestamp", "desc"), limit(20)), (data) => this.activities = data as MemberActivity[]));
        promises.push(fetchCollection('recipients', query(collection(firestore, "recipients"), orderBy("timestamp", "desc"), limit(20)), (data) => this.recipients = data as RecipientInfo[]));
        promises.push(fetchCollection('sms_history', query(collection(firestore, "sms_history"), orderBy("timestamp", "desc"), limit(20)), (data) => this.smsHistory = data as SmsRecord[]));

        await Promise.all(promises);

        this.updateLocalStats();
        this.notify();

        if (!this.isReady) {
          this.isReady = true;
          this.resolveReady();
        }
      }
    } catch (e) { 
      safeError("Firestore: Data loading error:", e); 
      // Resolve anyway so the app doesn't hang forever
      if (!this.isReady) {
        this.isReady = true;
        this.resolveReady();
      }
    }
  }

  // Allow manual refresh of data
  async refreshData(collectionsToRefresh?: string[]) {
    if (!collectionsToRefresh || collectionsToRefresh.length === 0) return;

    const promises: Promise<void>[] = [];

    const fetchCollection = async (colName: string, queryObj: any, callback: (data: any[]) => void) => {
      try {
        const snapshot = await getDocs(queryObj);
        const data = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) }));
        callback(data);
      } catch (error) {
        console.error(`Error refreshing ${colName}:`, error);
      }
    };

    if (collectionsToRefresh.includes('users')) {
      promises.push(fetchCollection('users', query(collection(firestore, "users"), limit(20)), (data) => this.users = data as User[]));
    }
    if (collectionsToRefresh.includes('transactions')) {
      promises.push(fetchCollection('transactions', query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(20)), (data) => this.transactions = data as Transaction[]));
    }
    if (collectionsToRefresh.includes('assistance_requests')) {
      promises.push(fetchCollection('assistance_requests', query(collection(firestore, "assistance_requests"), orderBy("timestamp", "desc"), limit(20)), (data) => this.assistanceRequests = data as AssistanceRequest[]));
    }
    if (collectionsToRefresh.includes('expenses')) {
      promises.push(fetchCollection('expenses', query(collection(firestore, "expenses"), orderBy("timestamp", "desc"), limit(20)), (data) => this.expenses = data as Expense[]));
    }
    if (collectionsToRefresh.includes('projects')) {
      promises.push(fetchCollection('projects', query(collection(firestore, "projects"), orderBy("timestamp", "desc"), limit(20)), (data) => this.projects = data as ProjectProgress[]));
    }
    if (collectionsToRefresh.includes('suggestions')) {
      promises.push(fetchCollection('suggestions', query(collection(firestore, "suggestions"), orderBy("timestamp", "desc"), limit(20)), (data) => this.suggestions = data as Suggestion[]));
    }
    if (collectionsToRefresh.includes('complaints')) {
      promises.push(fetchCollection('complaints', query(collection(firestore, "complaints"), orderBy("timestamp", "desc"), limit(20)), (data) => this.complaints = data as Complaint[]));
    }
    if (collectionsToRefresh.includes('activities')) {
      promises.push(fetchCollection('activities', query(collection(firestore, "activities"), orderBy("timestamp", "desc"), limit(20)), (data) => this.activities = data as MemberActivity[]));
    }
    if (collectionsToRefresh.includes('recipients')) {
      promises.push(fetchCollection('recipients', query(collection(firestore, "recipients"), orderBy("timestamp", "desc"), limit(20)), (data) => this.recipients = data as RecipientInfo[]));
    }
    if (collectionsToRefresh.includes('sms_history')) {
      promises.push(fetchCollection('sms_history', query(collection(firestore, "sms_history"), orderBy("timestamp", "desc"), limit(20)), (data) => this.smsHistory = data as SmsRecord[]));
    }

    await Promise.all(promises);
    this.updateLocalStats();
    this.notify();
  }

  private updateLocalStats() {
    this.stats = {
      ...this.stats,
      totalUsers: this.users.length,
      pendingRequests: this.transactions.filter(t => t.status === TransactionStatus.PENDING).length + 
                       this.users.filter(u => u.status === UserStatus.PENDING).length
    };
  }

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  private notify() { this.listeners.forEach(l => l()); }

  async loadMore(collectionName: string) {
    let q;
    let currentData: any[] = [];
    const pageSize = 20;

    switch (collectionName) {
      case 'users':
        currentData = this.users;
        q = query(collection(firestore, "users"), orderBy("registeredAt", "desc"), limit(currentData.length + pageSize));
        break;
      case 'transactions':
        currentData = this.transactions;
        q = query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'assistance':
      case 'assistance_requests':
        currentData = this.assistanceRequests;
        q = query(collection(firestore, "assistance_requests"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'expenses':
        currentData = this.expenses;
        q = query(collection(firestore, "expenses"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'activities':
        currentData = this.activities;
        q = query(collection(firestore, "activities"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'recipients':
        currentData = this.recipients;
        q = query(collection(firestore, "recipients"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'suggestions':
        currentData = this.suggestions;
        q = query(collection(firestore, "suggestions"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'complaints':
        currentData = this.complaints;
        q = query(collection(firestore, "complaints"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      case 'sms_history':
        currentData = this.smsHistory;
        q = query(collection(firestore, "sms_history"), orderBy("timestamp", "desc"), limit(currentData.length + pageSize));
        break;
      default:
        return;
    }

    try {
      const snapshot = await getDocs(q);
      const newData = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) }));
      
      switch (collectionName) {
        case 'users': this.users = newData as User[]; break;
        case 'transactions': this.transactions = newData as Transaction[]; break;
        case 'assistance':
        case 'assistance_requests': this.assistanceRequests = newData as AssistanceRequest[]; break;
        case 'expenses': this.expenses = newData as Expense[]; break;
        case 'activities': this.activities = newData as MemberActivity[]; break;
        case 'recipients': this.recipients = newData as RecipientInfo[]; break;
        case 'suggestions': this.suggestions = newData as Suggestion[]; break;
        case 'complaints': this.complaints = newData as Complaint[]; break;
        case 'sms_history': this.smsHistory = newData as SmsRecord[]; break;
      }
      
      this.updateLocalStats();
      this.notify();
    } catch (error) {
      console.error(`Error loading more ${collectionName}:`, error);
    }
  }

  getUsers(): User[] { return this.users; }
  getTransactions(): Transaction[] { return this.transactions; }
  getAssistanceRequests(): AssistanceRequest[] { return this.assistanceRequests; }
  getExpenses(): Expense[] { return this.expenses; }
  getProjects(): ProjectProgress[] { return this.projects; }
  getSuggestions(): Suggestion[] { return this.suggestions; }
  getComplaints(): Complaint[] { return this.complaints; }
  getActivities(): MemberActivity[] { return this.activities; }
  getRecipients(): RecipientInfo[] { return this.recipients; }
  getSmsHistory(): SmsRecord[] { return this.smsHistory; }
  getStats(): AppStats { return this.stats; }
  getContactConfig(): ContactConfig { return this.contactConfig; }
  
  async forceCheckMaintenanceMode(): Promise<boolean> {
    try {
      const docSnap = await getDocFromServer(doc(firestore, "metadata", "contact"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.maintenanceMode === 'boolean') {
          this.contactConfig.maintenanceMode = data.maintenanceMode;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('maintenance_mode', String(data.maintenanceMode));
          }
          this.notify();
          return data.maintenanceMode;
        }
      }
    } catch (e) {
      console.error("Force check maintenance mode failed:", e);
    }
    return this.contactConfig.maintenanceMode;
  }

  whenReady(): Promise<void> { return this.readyPromise; }
  isDbReady(): boolean { return this.isReady; }

  async updateContactConfig(config: ContactConfig) {
    await setDoc(doc(firestore, "metadata", "contact"), sanitizeForUpload(config), { merge: true });
  }

  async recalculateStats() {
    const txSnapshot = await getDocs(query(collection(firestore, "transactions"), where("status", "==", TransactionStatus.APPROVED)));
    const expSnapshot = await getDocs(collection(firestore, "expenses"));
    let totalCol = 0; txSnapshot.forEach(d => { totalCol += d.data().amount || 0; });
    let totalExp = 0; expSnapshot.forEach(d => { totalExp += d.data().amount || 0; });
    const statsRef = doc(firestore, "metadata", "stats");
    await setDoc(statsRef, { totalCollection: totalCol, totalExpense: totalExp }, { merge: true });
    return { totalCol, totalExp };
  }

  async registerUser(userData: any) {
    const phoneId = userData.phone.replace(/\D/g, '');
    const cleanData = sanitizeForUpload({ 
      ...userData, 
      status: UserStatus.PENDING, 
      totalDonation: 0, 
      transactionCount: 0, 
      registeredAt: Date.now(), 
      lastActive: Date.now() 
    });
    const id = `u_${phoneId}`;
    await setDoc(doc(firestore, "users", id), cleanData);
    
    // Manual local state update
    const newUser = { id, ...cleanData } as User;
    const existingIndex = this.users.findIndex(u => u.id === id);
    if (existingIndex > -1) {
      this.users[existingIndex] = newUser;
    } else {
      this.users.unshift(newUser);
    }
    this.updateLocalStats();
    this.notify();
  }

  async submitTransaction(txData: any) {
    const cleanTx = sanitizeForUpload({ ...txData, status: TransactionStatus.PENDING, timestamp: Date.now() });
    const docRef = await addDoc(collection(firestore, "transactions"), cleanTx);
    
    // Manual local state update
    this.transactions.unshift({ id: docRef.id, ...cleanTx } as Transaction);
    this.updateLocalStats();
    this.notify();
  }

  async submitSuggestion(userId: string, userName: string, message: string) {
    const cleanData = sanitizeForUpload({ userId, userName, message, timestamp: Date.now() });
    const docRef = await addDoc(collection(firestore, "suggestions"), cleanData);
    
    // Manual local state update
    this.suggestions.unshift({ id: docRef.id, ...cleanData } as Suggestion);
    this.notify();
  }

  async submitComplaint(userId: string, userName: string, message: string) {
    const cleanData = sanitizeForUpload({ userId, userName, message, timestamp: Date.now() });
    const docRef = await addDoc(collection(firestore, "complaints"), cleanData);
    
    // Manual local state update
    this.complaints.unshift({ id: docRef.id, ...cleanData } as Complaint);
    this.notify();
  }

  async addManualTransaction(userId: string, userName: string, amount: number, method: string = 'Manual', customDate?: string, fundType: FundType = 'General') {
    const txData = { userId, userName, amount, method, status: TransactionStatus.APPROVED, transactionId: `ADM-${Date.now().toString().slice(-6)}`, date: customDate || new Date().toISOString().split('T')[0], timestamp: customDate ? new Date(customDate).getTime() : Date.now(), fundType };
    
    let newTxId = "";
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", userId);
      const statsRef = doc(firestore, "metadata", "stats");
      const txRef = doc(collection(firestore, "transactions"));
      newTxId = txRef.id;
      transaction.set(txRef, txData);
      transaction.update(userRef, { totalDonation: increment(amount), transactionCount: increment(1) });
      transaction.set(statsRef, { totalCollection: increment(amount) }, { merge: true });
    });

    // Manual local state update
    this.transactions.unshift({ id: newTxId, ...txData } as Transaction);
    this.users = this.users.map(u => u.id === userId ? { ...u, totalDonation: (u.totalDonation || 0) + amount, transactionCount: (u.transactionCount || 0) + 1 } : u);
    this.updateLocalStats();
    this.notify();
  }

  async approveTransaction(txId: string) {
    const txDocRef = doc(firestore, "transactions", txId);
    let userPhone = "";
    let userName = "";
    let amount = 0;
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const txSnap = await transaction.get(txDocRef);
        if (!txSnap.exists()) throw new Error("Transaction not found");
        const txData = txSnap.data();
        if (txData.status === TransactionStatus.APPROVED) return;
        
        amount = Number(txData.amount) || 0;
        
        const statsRef = doc(firestore, "metadata", "stats");
        
        let userSnap = null;
        let userRef = null;
        if (txData.userId) {
          userRef = doc(firestore, "users", txData.userId);
          userSnap = await transaction.get(userRef);
        }

        transaction.update(txDocRef, { status: TransactionStatus.APPROVED });
        transaction.set(statsRef, { totalCollection: increment(amount) }, { merge: true });

        if (userSnap && userSnap.exists() && userRef) {
          userPhone = userSnap.data().phone;
          userName = userSnap.data().name || 'Member';
          transaction.update(userRef, { 
            totalDonation: increment(amount), 
            transactionCount: increment(1) 
          });
        }
      });

      // Manual local state update
      this.transactions = this.transactions.map(t => t.id === txId ? { ...t, status: TransactionStatus.APPROVED } : t);
      const approvedTx = this.transactions.find(t => t.id === txId);
      if (approvedTx && approvedTx.userId) {
        this.users = this.users.map(u => u.id === approvedTx.userId ? { ...u, totalDonation: (u.totalDonation || 0) + amount, transactionCount: (u.transactionCount || 0) + 1 } : u);
      }
      this.updateLocalStats();
      this.notify();

      // Send SMS after successful transaction
      if (userPhone && amount > 0) {
        try {
          const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const message = `Dear ${userName}, Thank you! Your donation of BDT ${amount} to Unity Care Foundation was successfully received on ${dateStr}.`;
          const encodedMessage = encodeURIComponent(message);
          const url = `https://panel2.smsbangladesh.com/api?user=jahid599874@gmail.com&password=${encodeURIComponent('Jahidul599874@')}&to=${userPhone}&text=${encodedMessage}`;
          
          fetch(url, { method: 'GET', mode: 'no-cors' })
            .then(() => {
              updateDoc(doc(firestore, "metadata", "stats"), { totalSmsSent: increment(1) }).catch(console.error);
              updateDoc(txDocRef, { smsSent: true }).catch(console.error);
            })
            .catch(error => console.error('Error sending SMS:', error));
        } catch (error) {
          console.error('Failed to trigger SMS:', error);
        }
      }
    } catch (error: any) {
      console.error("Transaction approval failed:", error);
      throw error;
    }
    await this.refreshData(['transactions', 'users']);
  }

  async sendGenericSms(phone: string, message: string) {
    const encodedMessage = encodeURIComponent(message);
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 11) formattedPhone = '880' + formattedPhone.slice(1);
    
    const url = `https://panel2.smsbangladesh.com/api?user=jahid599874@gmail.com&password=${encodeURIComponent('Jahidul599874@')}&to=${formattedPhone}&text=${encodedMessage}`;
    
    // Try multiple proxies to bypass CORS and network issues
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
    ];
    
    let lastError = null;
    for (const proxyUrl of proxies) {
      try {
        console.log(`Attempting SMS via proxy: ${proxyUrl.split('?')[0]}`);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        console.log('SMS API Response:', text);
        
        // Check for success indicators from SMS Bangladesh API (1701 is success)
        if (text.toLowerCase().includes('success') || text.includes('1701') || text.includes('sent')) {
          try {
            await updateDoc(doc(firestore, "metadata", "stats"), { totalSmsSent: increment(1) });
          } catch (e) {
            console.error("Failed to update SMS stats:", e);
          }
          return { success: true, response: text };
        } else {
          lastError = new Error(text || 'API Error');
        }
      } catch (error) {
        console.warn(`SMS Proxy failed (${proxyUrl.split('?')[0]}):`, error);
        lastError = error;
      }
    }
    
    // Fallback to no-cors if all proxies fail
    try {
      console.log('All SMS proxies failed, attempting direct no-cors fetch...');
      await fetch(url, { method: 'GET', mode: 'no-cors' });
      try {
        await updateDoc(doc(firestore, "metadata", "stats"), { totalSmsSent: increment(1) });
      } catch (e) {}
      return { success: true, response: 'Sent (Opaque Fallback)' };
    } catch (e) {
      console.error('Final SMS fallback failed:', e);
      throw lastError || new Error('এসএমএস পাঠানো সম্ভব হয়নি।');
    }
  }

  async logSmsHistory(record: Omit<SmsRecord, 'id'>) {
    await addDoc(collection(firestore, "sms_history"), sanitizeForUpload(record));
  }

  async updateSmsRecord(id: string, data: Partial<SmsRecord>): Promise<void> {
    const docRef = doc(firestore, 'sms_history', id);
    await updateDoc(docRef, data);
    await this.refreshData(['sms_history']);
  }

  async sendManualSms(txId: string) {
    const txDoc = await getDoc(doc(firestore, "transactions", txId));
    if (!txDoc.exists()) throw new Error('লেনদেন পাওয়া যায়নি।');
    const txData = txDoc.data() as Transaction;
    
    const userDoc = await getDoc(doc(firestore, "users", txData.userId));
    if (!userDoc.exists()) throw new Error('ব্যবহারকারী পাওয়া যায়নি।');
    const userData = userDoc.data() as User;
    
    const dateStr = new Date(txData.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const message = `Dear ${userData.name}, Thank you! Your donation of BDT ${txData.amount} to Unity Care Foundation was successfully received on ${dateStr}.`;
    
    await this.sendGenericSms(userData.phone, message);
    await updateDoc(doc(firestore, "transactions", txId), { smsSent: true });
    await this.refreshData(['transactions']);
    return message;
  }

  async rejectTransaction(txId: string) {
    const txDoc = await getDoc(doc(firestore, "transactions", txId));
    if (txDoc.exists()) {
      const txData = txDoc.data() as Transaction;
      const userDoc = await getDoc(doc(firestore, "users", txData.userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const dateStr = new Date(txData.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const message = `Dear ${userData.name}, your transaction of BDT ${txData.amount} on ${dateStr} has been cancelled by the admin. Please contact Unity Care Foundation for details.`;
        
        try {
          await this.sendGenericSms(userData.phone, message);
        } catch (e) {
          console.error("Failed to send rejection SMS:", e);
        }
      }
    }
    await updateDoc(doc(firestore, "transactions", txId), { status: TransactionStatus.REJECTED });
    
    // Manual local state update
    this.transactions = this.transactions.map(t => t.id === txId ? { ...t, status: TransactionStatus.REJECTED } : t);
    this.updateLocalStats();
    this.notify();
  }
  
  async deleteTransaction(txId: string) {
    console.log("Attempting to delete transaction:", txId);
    const txDocRef = doc(firestore, "transactions", txId);
    let amount = 0;
    let userId = "";
    let wasApproved = false;

    try {
      await runTransaction(firestore, async (transaction) => {
        const txSnap = await transaction.get(txDocRef);
        if (!txSnap.exists()) {
          console.error("Transaction document does not exist:", txId);
          return;
        }
        const txData = txSnap.data();
        amount = txData.amount;
        userId = txData.userId;
        wasApproved = txData.status === TransactionStatus.APPROVED;
        
        if (wasApproved) {
          const userRef = doc(firestore, "users", userId);
          const userSnap = await transaction.get(userRef);
          const statsRef = doc(firestore, "metadata", "stats");
          
          if (userSnap.exists()) {
            transaction.update(userRef, { 
              totalDonation: increment(-amount), 
              transactionCount: increment(-1) 
            });
          }
          
          transaction.set(statsRef, { 
            totalCollection: increment(-amount) 
          }, { merge: true });
        }
        
        transaction.delete(txDocRef);
      });

      // Manual local state update
      this.transactions = this.transactions.filter(t => t.id !== txId);
      if (wasApproved && userId) {
        this.users = this.users.map(u => u.id === userId ? { ...u, totalDonation: (u.totalDonation || 0) - amount, transactionCount: (u.transactionCount || 0) - 1 } : u);
      }
      this.updateLocalStats();
      this.notify();
    } catch (error) {
      console.error("Error in deleteTransaction transaction:", error);
      throw error;
    }
  }

  async addDetailedExpense(amount: number, reason: string, proofImage?: string) {
    let newExpId = "";
    const expData = { amount, reason, date: new Date().toISOString().split('T')[0], timestamp: Date.now(), proofImage };
    
    await runTransaction(firestore, async (transaction) => {
      const statsRef = doc(firestore, "metadata", "stats");
      const statsSnap = await transaction.get(statsRef);
      const statsData = statsSnap.data() || { totalCollection: 0, totalExpense: 0 };
      const currentBalance = (statsData.totalCollection || 0) - (statsData.totalExpense || 0);
      if (amount > currentBalance) throw new Error("Insufficient Funds: তহবিলে পর্যাপ্ত টাকা নেই!");
      const expRef = doc(collection(firestore, "expenses"));
      newExpId = expRef.id;
      transaction.set(expRef, sanitizeForUpload(expData));
      transaction.set(statsRef, { totalExpense: increment(amount) }, { merge: true });
    });

    // Manual local state update
    this.expenses.unshift({ id: newExpId, ...expData } as Expense);
    this.updateLocalStats();
    this.notify();
  }

  async deleteExpense(id: string, amount: number) {
    await runTransaction(firestore, async (transaction) => {
      const expRef = doc(firestore, "expenses", id);
      const statsRef = doc(firestore, "metadata", "stats");
      transaction.delete(expRef);
      transaction.set(statsRef, { totalExpense: increment(-amount) }, { merge: true });
    });

    // Manual local state update
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.updateLocalStats();
    this.notify();
  }

  async addProject(projectData: any) {
    const cleanData = sanitizeForUpload({ ...projectData, timestamp: Date.now() });
    const docRef = await addDoc(collection(firestore, "projects"), cleanData);
    
    // Manual local state update
    this.projects.unshift({ id: docRef.id, ...cleanData } as ProjectProgress);
    this.notify();
  }

  async updateProject(id: string, projectData: any) {
    const cleanData = sanitizeForUpload(projectData);
    await updateDoc(doc(firestore, "projects", id), cleanData);
    
    // Manual local state update
    this.projects = this.projects.map(p => p.id === id ? { ...p, ...cleanData } : p);
    this.notify();
  }

  async deleteProject(id: string) {
    await deleteDoc(doc(firestore, "projects", id));
    
    // Manual local state update
    this.projects = this.projects.filter(p => p.id !== id);
    this.notify();
  }

  async logActivity(userId: string, userName: string, type: ActivityType, description: string, path?: string) {
    try {
      const activity = sanitizeForUpload({
        userId,
        userName,
        type,
        description,
        path,
        timestamp: Date.now()
      });
      const docRef = await addDoc(collection(firestore, "activities"), activity);
      
      // Manual local state update
      this.activities.unshift({ id: docRef.id, ...activity } as MemberActivity);
      this.notify();
    } catch (e) {
      safeError("Firestore: Activity logging error:", e);
    }
  }

  async updateLastActive(userId: string) { 
    try { 
      await updateDoc(doc(firestore, "users", userId), { lastActive: Date.now() }); 
      // Manual local state update
      this.users = this.users.map(u => u.id === userId ? { ...u, lastActive: Date.now() } : u);
      this.notify();
    } catch (e) {} 
  }
  async deleteUser(id: string) { 
    await deleteDoc(doc(firestore, "users", id)); 
    // Manual local state update
    this.users = this.users.filter(u => u.id !== id);
    this.updateLocalStats();
    this.notify();
  }
  async updateUser(id: string, updates: any) {
    if (updates.status === UserStatus.APPROVED) {
      try {
        const userRef = doc(firestore, "users", id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.status !== UserStatus.APPROVED) {
            const userPhone = userData.phone;
            const userName = userData.name || 'Member';
            
            if (userPhone) {
              const message = `Dear ${userName}, your account has been successfully approved. You can now log in to Unity Care Foundation.`;
              const encodedMessage = encodeURIComponent(message);
              const url = `https://panel2.smsbangladesh.com/api?user=jahid599874@gmail.com&password=${encodeURIComponent('Jahidul599874@')}&to=${userPhone}&text=${encodedMessage}`;
              
              fetch(url, { method: 'GET', mode: 'no-cors' })
                .then(() => {
                  console.log('User approval SMS request sent to gateway.');
                  updateDoc(doc(firestore, "metadata", "stats"), { totalSmsSent: increment(1) }).catch(console.error);
                })
                .catch(error => console.error('Error sending user approval SMS:', error));
            }
          }
        }
      } catch (e) {
        console.error('Failed to process user approval SMS:', e);
      }
    }
    const cleanUpdates = sanitizeForUpload(updates);
    await updateDoc(doc(firestore, "users", id), cleanUpdates); 
    
    // Manual local state update
    this.users = this.users.map(u => u.id === id ? { ...u, ...cleanUpdates } : u);
    this.updateLocalStats();
    this.notify();
  }
  async sendNotification(userId: string, message: string) { await addDoc(collection(firestore, "notifications"), sanitizeForUpload({ userId, message, timestamp: Date.now(), isRead: false })); }
  async updateAssistanceStatus(reqId: string, status: AssistanceStatus, adminNote?: string) {
    const reqRef = doc(firestore, "assistance_requests", reqId);
    let updatedData: any = {};
    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(reqRef);
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const timeline = data.timeline || [];
      const newEvent = { status, timestamp: Date.now(), note: adminNote };
      
      updatedData = { 
        status, 
        adminNote: adminNote || data.adminNote || '',
        timeline: [...timeline, newEvent]
      };
      
      transaction.update(reqRef, updatedData);

      // Send notification to user
      const getStatusBengali = (s: AssistanceStatus) => {
        switch (s) {
          case AssistanceStatus.PENDING: return 'অপেক্ষমান';
          case AssistanceStatus.REVIEWING: return 'যাচাই চলছে';
          case AssistanceStatus.APPROVED: return 'গৃহীত';
          case AssistanceStatus.PROCESSING: return 'প্রক্রিয়াধীন';
          case AssistanceStatus.REJECTED: return 'বাতিল';
          case AssistanceStatus.DISBURSED: return 'প্রদান করা হয়েছে';
          default: return s;
        }
      };

      const notifRef = doc(collection(firestore, "notifications"));
      transaction.set(notifRef, sanitizeForUpload({ 
        userId: data.userId, 
        message: `আপনার সাহায্যের আবেদনের অবস্থা পরিবর্তন হয়েছে: ${getStatusBengali(status)}`, 
        timestamp: Date.now(), 
        isRead: false 
      }));
    });

    // Manual local state update
    this.assistanceRequests = this.assistanceRequests.map(r => r.id === reqId ? { ...r, ...updatedData } : r);
    this.notify();
  }

  async subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    try {
      const q = query(collection(firestore, "notifications"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Notification[];
      callback(notifs.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Error fetching notifications:", e);
      callback([]);
    }
  }
  async markNotificationAsRead(notifId: string) { await updateDoc(doc(firestore, "notifications", notifId), { isRead: true }); }
  getUser(id: string): User | undefined { return this.users.find(u => u.id === id); }
  
  async getUserAsync(id: string): Promise<User | undefined> {
    // 1. Check local cache
    const cached = this.getUser(id);
    if (cached) return cached;

    // 2. Fetch from server
    try {
      const userDoc = await getDoc(doc(firestore, "users", id));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...toPlainObject(userDoc.data()) } as User;
        // Add to local cache if not present
        if (!this.users.find(u => u.id === userData.id)) {
          this.users.push(userData);
          this.notify();
        }
        return userData;
      }
    } catch (e) {
      console.error("Firestore: getUserAsync error:", e);
    }
    return undefined;
  }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    const normalize = (p: string) => p.replace(/\D/g, '').slice(-10);
    const searchDigits = normalize(phone);
    
    if (!searchDigits) return undefined;

    // 1. Check local cache first (fastest)
    const cached = this.users.find(u => normalize(u.phone) === searchDigits);
    if (cached) return cached;
    
    // 2. If not in cache, try to fetch from server directly using a collection group query or specific collection
    // This ensures we find users even if they weren't in the initial 20 loaded
    try {
      const q = query(collection(firestore, "users"), where("phone", "==", phone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const userData = { id: d.id, ...toPlainObject(d.data()) } as User;
        // Add to local cache
        if (!this.users.find(u => u.id === userData.id)) {
          this.users.push(userData);
        }
        return userData;
      }
    } catch (e) {
      console.error("Firestore: getUserByPhone server fetch error:", e);
    }
    
    // 3. Fallback to existing ID/Format logic if needed
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const idsToTry = [
        `u_${phoneDigits}`,
        `u_${searchDigits}`,
        `u_880${searchDigits}`,
        `u_0${searchDigits}`
      ];

      for (const id of idsToTry) {
        const userDoc = await getDoc(doc(firestore, "users", id));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...toPlainObject(userDoc.data()) } as User;
          if (!this.users.find(u => u.id === userData.id)) {
            this.users.push(userData);
          }
          return userData;
        }
      }
    } catch (e) {
      console.error("Firestore: getUserByPhone ID fetch error:", e);
    }
    
    return undefined;
  }

  async submitAssistanceRequest(reqData: any) { 
    const timestamp = Date.now();
    const initialEvent = { status: AssistanceStatus.PENDING, timestamp, note: 'আবেদন জমা দেওয়া হয়েছে' };
    const cleanData = sanitizeForUpload({ 
      ...reqData, 
      status: AssistanceStatus.PENDING, 
      timestamp,
      timeline: [initialEvent]
    });
    const docRef = await addDoc(collection(firestore, "assistance_requests"), cleanData);
    
    // Manual local state update
    this.assistanceRequests.unshift({ id: docRef.id, ...cleanData } as AssistanceRequest);
    this.notify();
  }

  async addRecipient(data: any) {
    const cleanData = sanitizeForUpload({ ...data, timestamp: Date.now() });
    const docRef = await addDoc(collection(firestore, "recipients"), cleanData);
    
    // Manual local state update
    this.recipients.unshift({ id: docRef.id, ...cleanData } as RecipientInfo);
    this.notify();
  }

  async updateRecipient(id: string, data: any) {
    const cleanData = sanitizeForUpload(data);
    await updateDoc(doc(firestore, "recipients", id), cleanData);
    
    // Manual local state update
    this.recipients = this.recipients.map(r => r.id === id ? { ...r, ...cleanData } : r);
    this.notify();
  }

  async deleteRecipient(id: string) {
    await deleteDoc(doc(firestore, "recipients", id));
    
    // Manual local state update
    this.recipients = this.recipients.filter(r => r.id !== id);
    this.notify();
  }

  async adminSignIn() {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async cleanupOldData() {
    if (!auth.currentUser) return;
    
    const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000);
    const collectionsToCleanup = ['activities', 'sms_history'];
    
    console.log("🧹 Firebase: Starting cleanup of data older than 5 days...");
    
    for (const coll of collectionsToCleanup) {
      try {
        // Limit to 450 to stay within the 500-operation batch limit
        const q = query(collection(firestore, coll), where("timestamp", "<", fiveDaysAgo), limit(450));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const batch = writeBatch(firestore);
          snapshot.docs.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
          console.log(`✅ Firebase: Cleaned up ${snapshot.size} documents from ${coll}`);
          
          // Update local state if necessary
          if (coll === 'activities') this.activities = this.activities.filter(a => a.timestamp >= fiveDaysAgo);
          if (coll === 'suggestions') this.suggestions = this.suggestions.filter(s => s.timestamp >= fiveDaysAgo);
          if (coll === 'complaints') this.complaints = this.complaints.filter(c => c.timestamp >= fiveDaysAgo);
          if (coll === 'sms_history') this.smsHistory = this.smsHistory.filter(s => s.timestamp >= fiveDaysAgo);
          
          this.notify();
        }
      } catch (e) {
        console.error(`❌ Firebase: Cleanup error for ${coll}:`, e);
      }
    }
  }
}

export const db = new FirebaseDB();
