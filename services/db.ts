
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
  limit
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { User, Transaction, UserStatus, TransactionStatus, AppStats, Notification, Expense } from '../types';

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
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
  if (data instanceof Date) return data.getTime();
  if (Array.isArray(data)) return data.map(item => sanitize(item));
  if (typeof data === 'object') {
    if (data instanceof Element || data instanceof Event || data instanceof Node) return null;
    const clean: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (key.startsWith('_') || typeof value === 'function' || key === 'firestore') continue;
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
  private expenses: Expense[] = [];
  private stats: AppStats = {
    totalCollection: 0,
    totalExpense: 0,
    totalUsers: 0,
    pendingRequests: 0
  };
  private listeners: (() => void)[] = [];
  private submissionLock = new Set<string>();

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    try {
      onSnapshot(collection(firestore, "users"), (snapshot) => {
        this.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        this.updateLocalStats();
        this.notify();
      });

      const txQuery = query(collection(firestore, "transactions"), orderBy("timestamp", "desc"), limit(100));
      onSnapshot(txQuery, (snapshot) => {
        this.transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        this.updateLocalStats();
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
    } catch (e) {
      console.error("Sync Error:", e);
    }
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
  getUser(id: string): User | undefined { return this.users.find(u => u.id === id); }

  async updateLastActive(userId: string) {
    try {
      await updateDoc(doc(firestore, "users", userId), { lastActive: Date.now() });
    } catch (e) {
      console.error("Error updating activity");
    }
  }

  async registerUser(userData: any) {
    const lockKey = `reg-${userData.phone}`;
    if (this.submissionLock.has(lockKey)) throw new Error("প্রসেসিং হচ্ছে, দয়া করে অপেক্ষা করুন...");
    this.submissionLock.add(lockKey);

    try {
      const q = query(collection(firestore, "users"), where("phone", "==", userData.phone), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error("এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।");
      }

      const newUser = sanitize({
        ...userData,
        status: UserStatus.PENDING,
        totalDonation: 0,
        yearlyDonation: 0,
        transactionCount: 0,
        registeredAt: Date.now(),
        lastActive: Date.now()
      });
      const docRef = await addDoc(collection(firestore, "users"), newUser);
      return docRef.id;
    } finally {
      setTimeout(() => this.submissionLock.delete(lockKey), 2000);
    }
  }

  async submitTransaction(tx: any) {
    const lockKey = `tx-${tx.transactionId}`;
    if (this.submissionLock.has(lockKey)) return;
    this.submissionLock.add(lockKey);

    try {
      await addDoc(collection(firestore, "transactions"), sanitize({
        ...tx,
        status: TransactionStatus.PENDING,
        timestamp: Date.now()
      }));
    } finally {
      setTimeout(() => this.submissionLock.delete(lockKey), 5000);
    }
  }

  async addManualTransaction(txData: any) {
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", txData.userId);
      const statsRef = doc(firestore, "metadata", "stats");
      const txColl = collection(firestore, "transactions");
      const newTxRef = doc(txColl);
      transaction.set(newTxRef, sanitize({ ...txData, status: TransactionStatus.APPROVED, timestamp: Date.now() }));
      transaction.update(userRef, {
        totalDonation: increment(txData.amount),
        yearlyDonation: increment(txData.amount),
        transactionCount: increment(1)
      });
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
      transaction.update(userRef, {
        totalDonation: increment(tx.amount),
        yearlyDonation: increment(tx.amount),
        transactionCount: increment(1)
      });
      transaction.set(statsRef, { totalCollection: increment(tx.amount) }, { merge: true });
    });
  }

  async rejectTransaction(txId: string) {
    await updateDoc(doc(firestore, "transactions", txId), { status: TransactionStatus.REJECTED });
  }

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

  getTransactions(): Transaction[] { return this.transactions; }
  getExpenses(): Expense[] { return this.expenses; }
  getStats(): AppStats { return this.stats; }
  
  async deleteUser(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;

    try {
      const txQuery = query(collection(firestore, "transactions"), where("userId", "==", id));
      const txSnap = await getDocs(txQuery);
      const notifQuery = query(collection(firestore, "notifications"), where("userId", "==", id));
      const notifSnap = await getDocs(notifQuery);
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, "users", id);
      const statsRef = doc(firestore, "metadata", "stats");
      batch.delete(userRef);
      if (user.totalDonation > 0) {
        batch.set(statsRef, { totalCollection: increment(-user.totalDonation) }, { merge: true });
      }
      txSnap.forEach(tDoc => batch.delete(tDoc.ref));
      notifSnap.forEach(nDoc => batch.delete(nDoc.ref));
      await batch.commit();
    } catch (err) {
      console.error("Delete User Error:", err);
      throw err;
    }
  }

  async updateUser(id: string, updates: any) { await updateDoc(doc(firestore, "users", id), sanitize(updates)); }
  async sendNotification(userId: string, message: string) {
    await addDoc(collection(firestore, "notifications"), sanitize({ userId, message, timestamp: Date.now(), isRead: false }));
  }
  subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    const q = query(collection(firestore, "notifications"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      callback(notifs.sort((a, b) => b.timestamp - a.timestamp));
    });
  }
  async markNotificationAsRead(notifId: string) { await updateDoc(doc(firestore, "notifications", notifId), { isRead: true }); }
}

export const db = new FirebaseDB();