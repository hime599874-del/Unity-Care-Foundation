
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
  PROCESSING = 'PROCESSING',
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
  designation?: string;
  isPermanentMember?: boolean;
  totalDonation: number;
  yearlyDonation: number;
  transactionCount: number;
  registeredAt: number;
  lastActive?: number;
  expiryDate?: string;
  isIdCardEnabled?: boolean;
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

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface ContactConfig {
  whatsapp: string;
  facebook: string;
  messenger: string;
  email: string;
  phone: string;
  policyUrl?: string;
}

export interface TimelineEvent {
  status: AssistanceStatus;
  timestamp: number;
  note?: string;
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
  timeline?: TimelineEvent[];
}

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  proofImage?: string;
  date: string;
  timestamp: number;
}

export interface ProjectProgress {
  id: string;
  name: string;
  targetAmount: number;
  collectedAmount: number; // Can be auto-calculated or manual
  progressType: 'Auto' | 'Manual';
  manualPercentage?: number;
  status: 'Ongoing' | 'Completed' | 'Pending';
  deadline: string;
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

export enum ActivityType {
  LOGIN = 'LOGIN',
  PAGE_VIEW = 'PAGE_VIEW',
  ACTION = 'ACTION'
}

export interface MemberActivity {
  id: string;
  userId: string;
  userName: string;
  type: ActivityType;
  description: string;
  path?: string;
  timestamp: number;
}
