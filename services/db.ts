
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { 
  initializeFirestore,
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
  increment,
  limit,
  setDoc,
  getDocs,
  getDoc,
  getDocFromServer
} from "firebase/firestore";
import { User, Transaction, UserStatus, TransactionStatus, AppStats, Notification, Expense, AssistanceRequest, AssistanceStatus, Suggestion, Complaint, ContactConfig, ProjectProgress, MemberActivity, ActivityType, RecipientInfo, FundType, SmsRecord } from '../types';

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, (firebaseConfig as any).firestoreDatabaseId);

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
    maintenanceMode: false,
    disableRegistration: false
  };
  private listeners: (() => void)[] = [];
  private isReady: boolean = false;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

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
    
    this.initRealtimeSync(); 
  }

  getIsOnline(): boolean { return this.isOnline; }

  private initRealtimeSync() {
    try {
      let usersInitialized = false;
      let statsInitialized = false;
      let transactionsInitialized = false;
      let expensesInitialized = false;

      const checkReady = () => {
        if (usersInitialized && statsInitialized && transactionsInitialized && expensesInitialized && !this.isReady) {
          this.isReady = true;
          this.resolveReady();
        }
      };

      onSnapshot(collection(firestore, "users"), (snapshot) => {
        this.users = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as User[];
        this.updateLocalStats();
        this.notify();
        if (!usersInitialized) {
          usersInitialized = true;
          checkReady();
        }
      }, (error) => {
        safeError("Firestore: Users sync error:", error);
        if (!usersInitialized) {
          usersInitialized = true;
          checkReady();
        }
      });

      // Limit initial transactions to 500 for performance, can be adjusted if needed
      onSnapshot(query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(500)), (snapshot) => {
        this.transactions = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Transaction[];
        this.updateLocalStats();
        this.notify();
        if (!transactionsInitialized) {
          transactionsInitialized = true;
          checkReady();
        }
      }, (error) => {
        safeError("Firestore: Transactions sync error:", error);
        if (!transactionsInitialized) {
          transactionsInitialized = true;
          checkReady();
        }
      });

      onSnapshot(query(collection(firestore, "assistance_requests"), orderBy("timestamp", "desc")), (snapshot) => {
        this.assistanceRequests = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as AssistanceRequest[];
        this.notify();
      }, (error) => safeError("Firestore: Assistance sync error:", error));

      onSnapshot(collection(firestore, "expenses"), (snapshot) => {
        this.expenses = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Expense[];
        this.notify();
        if (!expensesInitialized) {
          expensesInitialized = true;
          checkReady();
        }
      }, (error) => {
        safeError("Firestore: Expenses sync error:", error);
        if (!expensesInitialized) {
          expensesInitialized = true;
          checkReady();
        }
      });

      onSnapshot(collection(firestore, "projects"), (snapshot) => {
        this.projects = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as ProjectProgress[];
        this.notify();
      }, (error) => safeError("Firestore: Projects sync error:", error));

      onSnapshot(query(collection(firestore, "suggestions"), orderBy("timestamp", "desc")), (snapshot) => {
        this.suggestions = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Suggestion[];
        this.notify();
      }, (error) => safeError("Firestore: Suggestions sync error:", error));

      onSnapshot(query(collection(firestore, "complaints"), orderBy("timestamp", "desc")), (snapshot) => {
        this.complaints = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Complaint[];
        this.notify();
      }, (error) => safeError("Firestore: Complaints sync error:", error));

      onSnapshot(query(collection(firestore, "activities"), orderBy("timestamp", "desc")), (snapshot) => {
        this.activities = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as MemberActivity[];
        this.notify();
      }, (error) => safeError("Firestore: Activities sync error:", error));

      onSnapshot(query(collection(firestore, "recipients"), orderBy("timestamp", "desc")), (snapshot) => {
        this.recipients = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as RecipientInfo[];
        this.notify();
      }, (error) => safeError("Firestore: Recipients sync error:", error));

      onSnapshot(query(collection(firestore, "sms_history"), orderBy("timestamp", "desc"), limit(50)), (snapshot) => {
        this.smsHistory = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as SmsRecord[];
        this.notify();
      }, (error) => safeError("Firestore: SMS History sync error:", error));

      onSnapshot(doc(firestore, "metadata", "contact"), (snapshot) => {
        if (snapshot.exists()) {
          const data = toPlainObject(snapshot.data());
          if (data) {
            this.contactConfig = data as ContactConfig;
            this.notify();
          }
        }
      });

      onSnapshot(doc(firestore, "metadata", "stats"), (snapshot) => {
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
        if (!statsInitialized) {
          statsInitialized = true;
          checkReady();
        }
      }, (error) => {
        safeError("Firestore: Stats sync error:", error);
        if (!statsInitialized) {
          statsInitialized = true;
          checkReady();
        }
      });
    } catch (e) { safeError("Firestore: Initialization catch block:", e); }
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
    await setDoc(doc(firestore, "users", `u_${phoneId}`), cleanData);
  }

  async submitTransaction(txData: any) {
    const cleanTx = sanitizeForUpload({ ...txData, status: TransactionStatus.PENDING, timestamp: Date.now() });
    await addDoc(collection(firestore, "transactions"), cleanTx);
  }

  async submitSuggestion(userId: string, userName: string, message: string) {
    const cleanData = sanitizeForUpload({ userId, userName, message, timestamp: Date.now() });
    await addDoc(collection(firestore, "suggestions"), cleanData);
  }

  async submitComplaint(userId: string, userName: string, message: string) {
    const cleanData = sanitizeForUpload({ userId, userName, message, timestamp: Date.now() });
    await addDoc(collection(firestore, "complaints"), cleanData);
  }

  async addManualTransaction(userId: string, userName: string, amount: number, method: string = 'Manual', customDate?: string, fundType: FundType = 'General') {
    const txData = { userId, userName, amount, method, status: TransactionStatus.APPROVED, transactionId: `ADM-${Date.now().toString().slice(-6)}`, date: customDate || new Date().toISOString().split('T')[0], timestamp: customDate ? new Date(customDate).getTime() : Date.now(), fundType };
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", userId);
      const statsRef = doc(firestore, "metadata", "stats");
      const txRef = doc(collection(firestore, "transactions"));
      transaction.set(txRef, txData);
      transaction.update(userRef, { totalDonation: increment(amount), transactionCount: increment(1) });
      transaction.set(statsRef, { totalCollection: increment(amount) }, { merge: true });
    });
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
        
        amount = txData.amount;
        
        const statsRef = doc(firestore, "metadata", "stats");
        transaction.update(txDocRef, { status: TransactionStatus.APPROVED });
        transaction.set(statsRef, { totalCollection: increment(txData.amount) }, { merge: true });

        if (txData.userId) {
          const userRef = doc(firestore, "users", txData.userId);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            userPhone = userSnap.data().phone;
            userName = userSnap.data().name || 'Member';
            transaction.update(userRef, { 
              totalDonation: increment(txData.amount), 
              transactionCount: increment(1) 
            });
          }
        }
      });

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
  }

  async sendGenericSms(phone: string, message: string) {
    const encodedMessage = encodeURIComponent(message);
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 11) formattedPhone = '880' + formattedPhone.slice(1);
    
    const url = `https://panel2.smsbangladesh.com/api?user=jahid599874@gmail.com&password=${encodeURIComponent('Jahidul599874@')}&to=${formattedPhone}&text=${encodedMessage}`;
    
    // Use proxy to read real-time response from API
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(proxyUrl);
      const text = await response.text();
      console.log('SMS API Real-time Response:', text);
      
      // Check for success indicators from SMS Bangladesh API (1701 is success)
      if (text.toLowerCase().includes('success') || text.includes('1701') || text.includes('sent')) {
        await updateDoc(doc(firestore, "metadata", "stats"), { totalSmsSent: increment(1) });
        return { success: true, response: text };
      } else {
        throw new Error(text || 'API Error');
      }
    } catch (error) {
      console.error('Error sending SMS via proxy:', error);
      // Fallback to no-cors if proxy fails, but we won't get the response text
      try {
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        await updateDoc(doc(firestore, "metadata", "stats"), { totalSmsSent: increment(1) });
        return { success: true, response: 'Sent (Opaque)' };
      } catch (e) {
        throw new Error('এসএমএস পাঠানো সম্ভব হয়নি।');
      }
    }
  }

  async logSmsHistory(record: Omit<SmsRecord, 'id'>) {
    await addDoc(collection(firestore, "sms_history"), sanitizeForUpload(record));
  }

  async updateSmsRecord(id: string, data: Partial<SmsRecord>): Promise<void> {
    const docRef = doc(firestore, 'sms_history', id);
    await updateDoc(docRef, data);
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
    return message;
  }

  async rejectTransaction(txId: string) { await updateDoc(doc(firestore, "transactions", txId), { status: TransactionStatus.REJECTED }); }
  
  async deleteTransaction(txId: string) {
    console.log("Attempting to delete transaction:", txId);
    const txDocRef = doc(firestore, "transactions", txId);
    try {
      await runTransaction(firestore, async (transaction) => {
        const txSnap = await transaction.get(txDocRef);
        if (!txSnap.exists()) {
          console.error("Transaction document does not exist:", txId);
          return;
        }
        const txData = txSnap.data();
        console.log("Transaction data found:", txData);
        
        if (txData.status === TransactionStatus.APPROVED) {
          console.log("Transaction was approved, reverting funds...");
          const userRef = doc(firestore, "users", txData.userId);
          const userSnap = await transaction.get(userRef);
          const statsRef = doc(firestore, "metadata", "stats");
          
          if (userSnap.exists()) {
            console.log("Updating user balance for user:", txData.userId);
            transaction.update(userRef, { 
              totalDonation: increment(-txData.amount), 
              transactionCount: increment(-1) 
            });
          } else {
            console.warn("User document not found for transaction reversal:", txData.userId);
          }
          
          console.log("Updating global stats...");
          transaction.set(statsRef, { 
            totalCollection: increment(-txData.amount) 
          }, { merge: true });
        }
        
        console.log("Deleting transaction document...");
        transaction.delete(txDocRef);
      });
      console.log("Transaction deletion successful");
    } catch (error) {
      console.error("Error in deleteTransaction transaction:", error);
      throw error;
    }
  }

  async addDetailedExpense(amount: number, reason: string, proofImage?: string) {
    await runTransaction(firestore, async (transaction) => {
      const statsRef = doc(firestore, "metadata", "stats");
      const statsSnap = await transaction.get(statsRef);
      const statsData = statsSnap.data() || { totalCollection: 0, totalExpense: 0 };
      const currentBalance = (statsData.totalCollection || 0) - (statsData.totalExpense || 0);
      if (amount > currentBalance) throw new Error("Insufficient Funds: তহবিলে পর্যাপ্ত টাকা নেই!");
      const expRef = doc(collection(firestore, "expenses"));
      transaction.set(expRef, sanitizeForUpload({ amount, reason, date: new Date().toISOString().split('T')[0], timestamp: Date.now(), proofImage }));
      transaction.set(statsRef, { totalExpense: increment(amount) }, { merge: true });
    });
  }

  async deleteExpense(id: string, amount: number) {
    await runTransaction(firestore, async (transaction) => {
      const expRef = doc(firestore, "expenses", id);
      const statsRef = doc(firestore, "metadata", "stats");
      transaction.delete(expRef);
      transaction.set(statsRef, { totalExpense: increment(-amount) }, { merge: true });
    });
  }

  async addProject(projectData: any) {
    const cleanData = sanitizeForUpload({ ...projectData, timestamp: Date.now() });
    await addDoc(collection(firestore, "projects"), cleanData);
  }

  async updateProject(id: string, projectData: any) {
    const cleanData = sanitizeForUpload(projectData);
    await updateDoc(doc(firestore, "projects", id), cleanData);
  }

  async deleteProject(id: string) {
    await deleteDoc(doc(firestore, "projects", id));
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
      await addDoc(collection(firestore, "activities"), activity);
    } catch (e) {
      safeError("Firestore: Activity logging error:", e);
    }
  }

  async updateLastActive(userId: string) { try { await updateDoc(doc(firestore, "users", userId), { lastActive: Date.now() }); } catch (e) {} }
  async deleteUser(id: string) { await deleteDoc(doc(firestore, "users", id)); }
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
    await updateDoc(doc(firestore, "users", id), sanitizeForUpload(updates)); 
  }
  async sendNotification(userId: string, message: string) { await addDoc(collection(firestore, "notifications"), sanitizeForUpload({ userId, message, timestamp: Date.now(), isRead: false })); }
  async updateAssistanceStatus(reqId: string, status: AssistanceStatus, adminNote?: string) {
    const reqRef = doc(firestore, "assistance_requests", reqId);
    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(reqRef);
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const timeline = data.timeline || [];
      const newEvent = { status, timestamp: Date.now(), note: adminNote };
      
      transaction.update(reqRef, { 
        status, 
        adminNote: adminNote || data.adminNote || '',
        timeline: [...timeline, newEvent]
      });

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
  }

  subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    const q = query(collection(firestore, "notifications"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Notification[];
      callback(notifs.sort((a, b) => b.timestamp - a.timestamp));
    });
  }
  async markNotificationAsRead(notifId: string) { await updateDoc(doc(firestore, "notifications", notifId), { isRead: true }); }
  getUser(id: string): User | undefined { return this.users.find(u => u.id === id); }
  
  async getUserByPhone(phone: string): Promise<User | undefined> {
    const normalize = (p: string) => p.replace(/\D/g, '').slice(-10);
    const searchDigits = normalize(phone);
    
    if (!searchDigits) return undefined;

    // 1. Check local cache first (fastest)
    const cached = this.users.find(u => normalize(u.phone) === searchDigits);
    if (cached) return cached;
    
    // 2. Try fetching by multiple possible Document IDs directly
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const idsToTry = [
        `u_${phoneDigits}`,         // u_8801777599874
        `u_${searchDigits}`,        // u_1777599874
        `u_880${searchDigits}`,     // u_8801777599874 (redundant but safe)
        `u_0${searchDigits}`        // u_01777599874
      ];

      for (const id of idsToTry) {
        const userDoc = await getDoc(doc(firestore, "users", id));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...toPlainObject(userDoc.data()) } as User;
          // Add to local cache to prevent future misses
          if (!this.users.find(u => u.id === userData.id)) {
            this.users.push(userData);
          }
          return userData;
        }
      }
    } catch (e) {
      safeError("Firestore: getUserByPhone ID fetch error:", e);
    }
    
    // 3. Fallback to Query with multiple common formats
    try {
      const formatsToTry = [
        phone,                          // Original input (+88017...)
        `+880${searchDigits}`,           // Standard (+88017...)
        `0${searchDigits}`,             // Local (017...)
        searchDigits,                   // Last 10 (17...)
        phone.replace(/\D/g, ''),       // Digits only (88017...)
        `880${searchDigits}`            // Digits without plus (88017...)
      ];

      const uniqueFormats = Array.from(new Set(formatsToTry));

      for (const format of uniqueFormats) {
        const q = query(collection(firestore, "users"), where("phone", "==", format));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          const userData = { id: d.id, ...toPlainObject(d.data()) } as User;
          if (!this.users.find(u => u.id === userData.id)) {
            this.users.push(userData);
          }
          return userData;
        }
      }
    } catch (e) {
      safeError("Firestore: getUserByPhone query error:", e);
    }
    
    return undefined;
  }

  async submitAssistanceRequest(reqData: any) { 
    const timestamp = Date.now();
    const initialEvent = { status: AssistanceStatus.PENDING, timestamp, note: 'আবেদন জমা দেওয়া হয়েছে' };
    await addDoc(collection(firestore, "assistance_requests"), sanitizeForUpload({ 
      ...reqData, 
      status: AssistanceStatus.PENDING, 
      timestamp,
      timeline: [initialEvent]
    })); 
  }

  async addRecipient(data: any) {
    const cleanData = sanitizeForUpload({ ...data, timestamp: Date.now() });
    await addDoc(collection(firestore, "recipients"), cleanData);
  }

  async updateRecipient(id: string, data: any) {
    const cleanData = sanitizeForUpload(data);
    await updateDoc(doc(firestore, "recipients", id), cleanData);
  }

  async deleteRecipient(id: string) {
    await deleteDoc(doc(firestore, "recipients", id));
  }

  async adminSignIn() {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
}

export const db = new FirebaseDB();
