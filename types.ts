
export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum AssistanceStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED'
}

export type FundType = 'General' | 'Special' | 'Emergency' | 'Other';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthYear: number;
  bloodGroup: string;
  location: 'Bangladesh' | 'Abroad';
  country?: string;
  address: {
    district: string;
    upazila: string;
    union: string;
    ward: string;
    village: string;
  };
  profession: string;
  studentInfo?: {
    institution: string;
    className: string;
  };
  interests: string[];
  isStudent: boolean;
  studentIdCopy?: string;
  isVolunteerInterested: boolean;
  monthlyCommitment?: string;
  specialSkills?: string[];
  motivation?: string;
  policyConsent: boolean;
  status: UserStatus;
  profilePic?: string;
  totalDonation: number;
  yearlyDonation: number;
  transactionCount: number;
  registeredAt: number;
  lastActive?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'Bkash' | 'Nagad' | 'Rocket' | 'Bank';
  fundType: FundType;
  transactionId: string;
  date: string;
  status: TransactionStatus;
  timestamp: number;
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface ContactConfig {
  whatsapp: string;
  facebook: string;
  email: string;
  phone: string;
}

export interface AssistanceRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  category: 'Medical' | 'Education' | 'Food' | 'Emergency' | 'Other';
  amount?: number;
  reason: string;
  status: AssistanceStatus;
  timestamp: number;
  adminNote?: string;
}

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  proofImage?: string;
  date: string;
  timestamp: number;
}

export interface AppStats {
  totalCollection: number;
  totalExpense: number;
  totalUsers: number;
  pendingRequests: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}
