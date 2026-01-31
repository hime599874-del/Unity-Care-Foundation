
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
  getDocs,
  deleteDoc,
  runTransaction,
  increment,
  writeBatch,
  getDoc,
  limit,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { User, Transaction, UserStatus, TransactionStatus, AppStats, Notification, Expense, AssistanceRequest, AssistanceStatus } from '../types';

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
});

const sanitize = (data: any): any => {
  if (data === null || data === undefined) return null;
  const type = typeof data;
  if (type === 'string' || type === 'number' || type === 'boolean') return data;
  if (data instanceof Date) return data.getTime();
  if (Array.isArray(data)) return data.map(item => sanitize(item));
  
  if (type === 'object') {
    if (Object.prototype.toString.call(data) !== '[object Object]' || data['$$typeof']) return null;
    const clean: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (typeof value === 'function' || key.startsWith('_')) continue;
        clean[key] = sanitize(value);
      }
    }
    return clean;
  }
  return null;
};

class FirebaseDB {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private assistanceRequests: AssistanceRequest[] = [];
  private expenses: Expense[] = [];
  private stats: AppStats = { totalCollection: 0, totalExpense: 0, totalUsers: 0, pendingRequests: 0 };
  private listeners: (() => void)[] = [];

  constructor() { this.initRealtimeSync(); }

  private initRealtimeSync() {
    try {
      onSnapshot(collection(firestore, "users"), (snapshot) => {
        this.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        this.updateLocalStats();
        this.notify();
      });
      onSnapshot(query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(100)), (snapshot) => {
        this.transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        this.updateLocalStats();
        this.notify();
      });
      onSnapshot(query(collection(firestore, "assistance_requests"), orderBy("timestamp", "desc")), (snapshot) => {
        this.assistanceRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AssistanceRequest[];
        this.notify();
      });
      onSnapshot(collection(firestore, "expenses"), (snapshot) => {
        this.expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        this.notify();
      });
      onSnapshot(doc(firestore, "metadata", "stats"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          this.stats = { ...this.stats, totalCollection: data.totalCollection || 0, totalExpense: data.totalExpense || 0 };
          this.notify();
        }
      });
    } catch (e) {}
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
  getStats(): AppStats { return this.stats; }

  async registerUser(userData: any) {
    const cleanData = sanitize({ ...userData, status: UserStatus.PENDING, totalDonation: 0, registeredAt: Date.now(), lastActive: Date.now() });
    await addDoc(collection(firestore, "users"), cleanData);
  }

  async submitAssistanceRequest(reqData: any) {
    const cleanReq = sanitize({ ...reqData, status: AssistanceStatus.PENDING, timestamp: Date.now() });
    await addDoc(collection(firestore, "assistance_requests"), cleanReq);
  }

  async updateAssistanceStatus(reqId: string, status: AssistanceStatus, adminNote?: string) {
    await updateDoc(doc(firestore, "assistance_requests", reqId), sanitize({ status, adminNote }));
  }

  async deleteAssistanceRequest(reqId: string) {
    await deleteDoc(doc(firestore, "assistance_requests", reqId));
  }

  async recalculateStats() {
    const txs = await getDocs(collection(firestore, "transactions"));
    const exps = await getDocs(collection(firestore, "expenses"));
    let collectionTotal = 0;
    let expenseTotal = 0;
    txs.forEach(d => { if (d.data().status === TransactionStatus.APPROVED) collectionTotal += (d.data().amount || 0); });
    exps.forEach(d => { expenseTotal += (d.data().amount || 0); });
    await setDoc(doc(firestore, "metadata", "stats"), { totalCollection: collectionTotal, totalExpense: expenseTotal });
  }

  async clearFinanceRecords() {
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, "metadata", "stats"), { totalCollection: 0, totalExpense: 0 });
    const txSnap = await getDocs(collection(firestore, "transactions"));
    txSnap.forEach(d => batch.delete(d.ref));
    const expSnap = await getDocs(collection(firestore, "expenses"));
    expSnap.forEach(d => batch.delete(d.ref));
    const userSnap = await getDocs(collection(firestore, "users"));
    userSnap.forEach(uDoc => { batch.update(uDoc.ref, { totalDonation: 0, yearlyDonation: 0, transactionCount: 0 }); });
    await batch.commit();
  }

  async submitTransaction(txData: any) {
    const cleanTx = sanitize({ ...txData, status: TransactionStatus.PENDING, timestamp: Date.now() });
    await addDoc(collection(firestore, "transactions"), cleanTx);
  }

  async addManualTransaction(txData: any) {
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", txData.userId);
      const statsRef = doc(firestore, "metadata", "stats");
      const newTxRef = doc(collection(firestore, "transactions"));
      transaction.set(newTxRef, sanitize({ ...txData, status: TransactionStatus.APPROVED, timestamp: Date.now() }));
      transaction.update(userRef, { totalDonation: increment(txData.amount), transactionCount: increment(1) });
      transaction.set(statsRef, { totalCollection: increment(txData.amount) }, { merge: true });
    });
  }

  async approveTransaction(txId: string) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx || tx.status === TransactionStatus.APPROVED) return;
    await runTransaction(firestore, async (transaction) => {
      const txRef = doc(firestore, "transactions", txId);
      const userRef = doc(firestore, "users", tx.userId);
      const statsRef = doc(firestore, "metadata", "stats");
      transaction.update(txRef, { status: TransactionStatus.APPROVED });
      transaction.update(userRef, { totalDonation: increment(tx.amount), transactionCount: increment(1) });
      transaction.set(statsRef, { totalCollection: increment(tx.amount) }, { merge: true });
    });
  }

  async rejectTransaction(txId: string) { await updateDoc(doc(firestore, "transactions", txId), { status: TransactionStatus.REJECTED }); }
  
  async addDetailedExpense(amount: number, reason: string, proofImage?: string) {
    await runTransaction(firestore, async (transaction) => {
      const statsRef = doc(firestore, "metadata", "stats");
      const expRef = doc(collection(firestore, "expenses"));
      transaction.set(expRef, sanitize({ amount, reason, date: new Date().toISOString().split('T')[0], timestamp: Date.now(), proofImage }));
      transaction.set(statsRef, { totalExpense: increment(amount) }, { merge: true });
    });
  }

  async deleteExpense(id: string, amount: number) {
    await runTransaction(firestore, async (transaction) => {
      const statsRef = doc(firestore, "metadata", "stats");
      const expRef = doc(firestore, "expenses", id);
      transaction.delete(expRef);
      transaction.set(statsRef, { totalExpense: increment(-amount) }, { merge: true });
    });
  }

  async updateLastActive(userId: string) { try { await updateDoc(doc(firestore, "users", userId), { lastActive: Date.now() }); } catch (e) {} }
  async deleteUser(id: string) { await deleteDoc(doc(firestore, "users", id)); }
  async updateUser(id: string, updates: any) { await updateDoc(doc(firestore, "users", id), sanitize(updates)); }
  async sendNotification(userId: string, message: string) { await addDoc(collection(firestore, "notifications"), sanitize({ userId, message, timestamp: Date.now(), isRead: false })); }
  subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    const q = query(collection(firestore, "notifications"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      callback(notifs.sort((a, b) => b.timestamp - a.timestamp));
    });
  }
  async markNotificationAsRead(notifId: string) { await updateDoc(doc(firestore, "notifications", notifId), { isRead: true }); }
  getUser(id: string): User | undefined { return this.users.find(u => u.id === id); }
}

export const db = new FirebaseDB();
