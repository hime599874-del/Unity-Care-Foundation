
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  initializeFirestore,
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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { User, Transaction, UserStatus, TransactionStatus, AppStats, Notification, Expense, AssistanceRequest, AssistanceStatus, Suggestion, ContactConfig } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCchYeZEfLW7mtwoixaabaILnscS-Y4-U",
  authDomain: "unity-care-foundation-426f8.firebaseapp.com",
  projectId: "unity-care-foundation-426f8",
  storageBucket: "unity-care-foundation-426f8.appspot.com",
  messagingSenderId: "22086379500",
  appId: "1:22086379500:web:7e150225b82f9d996a42c9",
  measurementId: "G-HWHFFQ3R65"
};

const app = initializeApp(firebaseConfig);
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

/**
 * Strips all internal metadata and non-plain objects to prevent circular reference errors.
 * Ensures that only JSON-serializable plain objects enter the app state.
 */
const toPlainObject = (data: any): any => {
  if (data === null || data === undefined) return data;
  
  // Handle basic primitives
  if (typeof data !== 'object') return data;

  // Handle Firebase Timestamps or standard Dates
  if (typeof data.toDate === 'function') return data.toDate().getTime();
  if (data instanceof Date) return data.getTime();
  
  // Handle Arrays
  if (Array.isArray(data)) return data.map(toPlainObject);
  
  // Handle Plain Objects strictly (POJOs)
  if (Object.prototype.toString.call(data) === '[object Object]') {
    const plain: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Recurse to clean deep objects
        const cleaned = toPlainObject(data[key]);
        if (cleaned !== undefined) plain[key] = cleaned;
      }
    }
    return plain;
  }
  
  // Discard any other complex/circular/Firebase internal objects
  return null;
};

const sanitizeForUpload = (data: any, seen = new WeakSet()): any => {
  if (data === null || data === undefined) return null;
  const type = typeof data;
  if (type === 'string' || type === 'number' || type === 'boolean') return data;
  if (data instanceof Date) return data.getTime();
  if (type === 'object') {
    if (seen.has(data)) return null;
    seen.add(data);
    if (Array.isArray(data)) return data.map(item => sanitizeForUpload(item, seen)).filter(i => i !== null);
    const clean: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = sanitizeForUpload(data[key], seen);
        if (val !== null && val !== undefined) clean[key] = val;
      }
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
  private suggestions: Suggestion[] = [];
  private stats: AppStats = { totalCollection: 0, totalExpense: 0, totalUsers: 0, pendingRequests: 0 };
  private contactConfig: ContactConfig = {
    whatsapp: 'https://chat.whatsapp.com/C39euDOPaskI3KoeNZMW2H?mode=gi_t',
    facebook: 'https://www.facebook.com/share/17peDnCVEV/',
    email: 'unitycarefoundation07@gmail.com',
    phone: '01777599874'
  };
  private listeners: (() => void)[] = [];

  constructor() { this.initRealtimeSync(); }

  private initRealtimeSync() {
    try {
      onSnapshot(collection(firestore, "users"), (snapshot) => {
        this.users = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as User[];
        this.updateLocalStats();
        this.notify();
      });
      onSnapshot(query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(1000)), (snapshot) => {
        this.transactions = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Transaction[];
        this.updateLocalStats();
        this.notify();
      });
      onSnapshot(query(collection(firestore, "assistance_requests"), orderBy("timestamp", "desc")), (snapshot) => {
        this.assistanceRequests = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as AssistanceRequest[];
        this.notify();
      });
      onSnapshot(collection(firestore, "expenses"), (snapshot) => {
        this.expenses = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Expense[];
        this.notify();
      });
      onSnapshot(query(collection(firestore, "suggestions"), orderBy("timestamp", "desc")), (snapshot) => {
        this.suggestions = snapshot.docs.map(d => ({ id: d.id, ...toPlainObject(d.data()) })) as Suggestion[];
        this.notify();
      });
      onSnapshot(doc(firestore, "metadata", "contact"), (snapshot) => {
        if (snapshot.exists()) {
          this.contactConfig = toPlainObject(snapshot.data()) as ContactConfig;
          this.notify();
        }
      });
      onSnapshot(doc(firestore, "metadata", "stats"), (snapshot) => {
        if (snapshot.exists()) {
          const cleanedStats = toPlainObject(snapshot.data());
          this.stats = { 
            ...this.stats, 
            totalCollection: cleanedStats.totalCollection || 0, 
            totalExpense: cleanedStats.totalExpense || 0 
          };
          this.notify();
        }
      });
    } catch (e) { console.error("Firestore sync error:", e); }
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
  getSuggestions(): Suggestion[] { return this.suggestions; }
  getStats(): AppStats { return this.stats; }
  getContactConfig(): ContactConfig { return this.contactConfig; }

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

  /**
   * Register user using phone number as unique ID to prevent double registration from double clicks.
   */
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
    // Use setDoc with a unique ID to handle accidental double clicks
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

  async addManualTransaction(userId: string, userName: string, amount: number, method: string = 'Admin Manual', customDate?: string) {
    const txData = { userId, userName, amount, method, status: TransactionStatus.APPROVED, transactionId: `ADM-${Date.now().toString().slice(-6)}`, date: customDate || new Date().toISOString().split('T')[0], timestamp: customDate ? new Date(customDate).getTime() : Date.now(), fundType: 'General' };
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
    await runTransaction(firestore, async (transaction) => {
      const txSnap = await transaction.get(txDocRef);
      if (!txSnap.exists()) return;
      const txData = txSnap.data();
      if (txData.status === TransactionStatus.APPROVED) return;
      const userRef = doc(firestore, "users", txData.userId);
      const statsRef = doc(firestore, "metadata", "stats");
      transaction.update(txDocRef, { status: TransactionStatus.APPROVED });
      transaction.update(userRef, { totalDonation: increment(txData.amount), transactionCount: increment(1) });
      transaction.set(statsRef, { totalCollection: increment(txData.amount) }, { merge: true });
    });
  }

  async rejectTransaction(txId: string) { await updateDoc(doc(firestore, "transactions", txId), { status: TransactionStatus.REJECTED }); }
  
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

  async updateLastActive(userId: string) { try { await updateDoc(doc(firestore, "users", userId), { lastActive: Date.now() }); } catch (e) {} }
  async deleteUser(id: string) { await deleteDoc(doc(firestore, "users", id)); }
  async updateUser(id: string, updates: any) { await updateDoc(doc(firestore, "users", id), sanitizeForUpload(updates)); }
  async sendNotification(userId: string, message: string) { await addDoc(collection(firestore, "notifications"), sanitizeForUpload({ userId, message, timestamp: Date.now(), isRead: false })); }
  async updateAssistanceStatus(reqId: string, status: AssistanceStatus, adminNote?: string) {
    const updates: any = { status }; if (adminNote) updates.adminNote = adminNote;
    await updateDoc(doc(firestore, "assistance_requests", reqId), updates);
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
  async submitAssistanceRequest(reqData: any) { await addDoc(collection(firestore, "assistance_requests"), sanitizeForUpload({ ...reqData, status: AssistanceStatus.PENDING, timestamp: Date.now() })); }
}

export const db = new FirebaseDB();
