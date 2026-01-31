
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
  getDoc
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

/**
 * Robust sanitize function to prevent "Circular Structure to JSON" errors.
 * It deeply clones the object while removing functions, DOM elements, and circular refs.
 */
const sanitize = (data: any, seen = new WeakSet()) => {
  if (data === null || typeof data !== 'object') return data;
  
  // Handle circular references
  if (seen.has(data)) return undefined;
  seen.add(data);

  // If it's a date, convert to timestamp
  if (data instanceof Date) return data.getTime();

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item, seen)).filter(i => i !== undefined);
  }

  // Handle Objects
  const clean: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];

    // Basic filters for non-serializable data
    if (value === undefined || typeof value === 'function' || value instanceof Element || value instanceof Event) {
      return;
    }

    // Protection for internal Firestore symbols or circular keys
    if (key.startsWith('_') || key === 'firestore' || key === 'db') {
      return;
    }

    // Recursive sanitization for nested objects (excluding base64 strings which are long)
    if (typeof value === 'object' && value !== null && !key.toLowerCase().includes('pic') && !key.toLowerCase().includes('image')) {
      const sanitizedVal = sanitize(value, seen);
      if (sanitizedVal !== undefined) clean[key] = sanitizedVal;
    } else {
      clean[key] = value;
    }
  });
  
  return clean;
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

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    try {
      onSnapshot(collection(firestore, "users"), (snapshot) => {
        this.users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        this.updateLocalStats();
        this.notify();
      }, (err) => console.error("Users Sync Error:", err));

      const txQuery = query(collection(firestore, "transactions"), orderBy("timestamp", "desc"));
      onSnapshot(txQuery, (snapshot) => {
        this.transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        this.updateLocalStats();
        this.notify();
      }, (err) => console.error("TX Sync Error:", err));

      const expQuery = query(collection(firestore, "expenses"), orderBy("timestamp", "desc"));
      onSnapshot(expQuery, (snapshot) => {
        this.expenses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        this.notify();
      }, (err) => console.error("Expense Sync Error:", err));

      onSnapshot(doc(firestore, "metadata", "stats"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          this.stats = {
            ...this.stats,
            totalCollection: data.totalCollection || 0,
            totalExpense: data.totalExpense || 0
          };
          this.notify();
        }
      });
    } catch (e) {
      console.error("Critical Sync Error:", e);
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
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getUsers(): User[] { return this.users; }
  getUser(id: string): User | undefined { return this.users.find(u => u.id === id); }

  async registerUser(userData: any) {
    const q = query(collection(firestore, "users"), where("phone", "==", userData.phone));
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
      registeredAt: Date.now()
    });
    const docRef = await addDoc(collection(firestore, "users"), newUser);
    return docRef.id;
  }

  async updateUser(id: string, updates: any) {
    await updateDoc(doc(firestore, "users", id), sanitize(updates));
  }

  async deleteUser(id: string) {
    await deleteDoc(doc(firestore, "users", id));
  }

  getTransactions(): Transaction[] { return this.transactions; }

  async submitTransaction(tx: any) {
    await addDoc(collection(firestore, "transactions"), sanitize({
      ...tx,
      status: TransactionStatus.PENDING,
      timestamp: Date.now()
    }));
  }

  async addManualTransaction(txData: any) {
    await runTransaction(firestore, async (transaction) => {
      const userRef = doc(firestore, "users", txData.userId);
      const statsRef = doc(firestore, "metadata", "stats");
      const txColl = collection(firestore, "transactions");
      const newTxRef = doc(txColl);
      transaction.set(newTxRef, sanitize({
        ...txData,
        status: TransactionStatus.APPROVED,
        timestamp: Date.now()
      }));
      transaction.update(userRef, {
        totalDonation: increment(txData.amount),
        yearlyDonation: increment(txData.amount),
        transactionCount: increment(1)
      });
      transaction.set(statsRef, {
        totalCollection: increment(txData.amount)
      }, { merge: true });
    });
  }

  async approveTransaction(txId: string) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx || tx.status === TransactionStatus.APPROVED) return;
    try {
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
        transaction.set(statsRef, {
          totalCollection: increment(tx.amount)
        }, { merge: true });
      });
    } catch (e) {
      console.error("Approval failed:", e);
    }
  }

  async rejectTransaction(txId: string) {
    await updateDoc(doc(firestore, "transactions", txId), { status: TransactionStatus.REJECTED });
  }

  async addDetailedExpense(amount: number, reason: string, proofImage?: string) {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    
    await runTransaction(firestore, async (transaction) => {
      const statsRef = doc(firestore, "metadata", "stats");
      const expRef = doc(collection(firestore, "expenses"));
      const expenseData: any = { amount, reason, date, timestamp };
      if (proofImage) expenseData.proofImage = proofImage;
      transaction.set(expRef, sanitize(expenseData));
      transaction.set(statsRef, { totalExpense: increment(amount) }, { merge: true });
    });

    const approvedUsers = this.users.filter(u => u.status === UserStatus.APPROVED);
    if (approvedUsers.length > 0) {
      const batch = writeBatch(firestore);
      const notificationMsg = `সংগঠন থেকে ৳${amount} খরচ করা হয়েছে। কারণ: ${reason}`;
      approvedUsers.forEach(user => {
        const notifRef = doc(collection(firestore, "notifications"));
        batch.set(notifRef, sanitize({
          userId: user.id,
          message: notificationMsg,
          timestamp: Date.now(),
          isRead: false
        }));
      });
      await batch.commit();
    }
  }

  async deleteExpense(id: string, amount: number) {
    try {
      await runTransaction(firestore, async (transaction) => {
        const statsRef = doc(firestore, "metadata", "stats");
        const expRef = doc(firestore, "expenses", id);
        transaction.delete(expRef);
        transaction.set(statsRef, { 
          totalExpense: increment(-amount) 
        }, { merge: true });
      });
    } catch (e) {
      console.error("Delete Expense Transaction Failed:", e);
      throw e;
    }
  }

  getExpenses(): Expense[] { return this.expenses; }

  async sendNotification(userId: string, message: string) {
    await addDoc(collection(firestore, "notifications"), sanitize({
      userId,
      message,
      timestamp: Date.now(),
      isRead: false
    }));
  }

  subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId)
    );
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      notifs.sort((a, b) => b.timestamp - a.timestamp);
      callback(notifs);
    });
  }

  async markNotificationAsRead(notifId: string) {
    await updateDoc(doc(firestore, "notifications", notifId), { isRead: true });
  }

  getStats(): AppStats { return this.stats; }
}

export const db = new FirebaseDB();
