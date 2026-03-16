
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  home: { bn: 'হোম', en: 'Home' },
  donate: { bn: 'দান করুন', en: 'Donate' },
  profile: { bn: 'প্রোফাইল', en: 'Profile' },
  
  // Dashboard
  welcome: { bn: 'স্বাগতম', en: 'Welcome' },
  total_donation: { bn: 'মোট দান', en: 'Total Donation' },
  transaction_count: { bn: 'লেনদেন সংখ্যা', en: 'Transactions' },
  recent_activity: { bn: 'সাম্প্রতিক কার্যক্রম', en: 'Recent Activity' },
  
  // Actions
  donate_now: { bn: 'দান', en: 'Donate' },
  apply: { bn: 'আবেদন', en: 'Apply' },
  top_donors: { bn: 'সেরা দাতা', en: 'Top Donors' },
  permanent_members: { bn: 'স্থায়ী সদস্য', en: 'Permanent Members' },
  history: { bn: 'হিসাব', en: 'History' },
  suggestion: { bn: 'পরামর্শ', en: 'Suggestion' },
  policy: { bn: 'নীতিমালা', en: 'Policy' },
  complaint: { bn: 'অভিযোগ', en: 'Complaint' },
  payment: { bn: 'পেমেন্ট', en: 'Payment' },
  contact: { bn: 'যোগাযোগ', en: 'Contact' },
  expenses: { bn: 'খরচ', en: 'Expenses' },
  vouchers: { bn: 'ভাউচার', en: 'Vouchers' },
  progress: { bn: 'অগ্রগতি', en: 'Progress' },
  
  // Profile
  edit_profile: { bn: 'প্রোফাইল এডিট', en: 'Edit Profile' },
  language: { bn: 'ভাষা', en: 'Language' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  change_language: { bn: 'ভাষা পরিবর্তন করুন', en: 'Change Language' },
  english: { bn: 'English', en: 'English' },
  bangla: { bn: 'বাংলা', en: 'Bangla' },
  
  // Welcome
  slogan: { bn: 'মানবিকতায় আমরা এক', en: 'United in Humanity' },
  transparency: { bn: 'স্বচ্ছতা', en: 'Transparency' },
  service: { bn: 'সেবা', en: 'Service' },
  humanity: { bn: 'মানবতা', en: 'Humanity' },
  get_started: { bn: 'শুরু করুন', en: 'Get Started' },
  non_political: { bn: 'অরাজনৈতিক ও মানবিক সংগঠন', en: 'Non-political & Humanitarian Organization' },
  foundation: { bn: 'ফাউন্ডেশন', en: 'Foundation' },
  
  // Auth
  login: { bn: 'লগইন', en: 'Login' },
  register: { bn: 'নিবন্ধন', en: 'Register' },
  login_title: { bn: 'লগইন করুন', en: 'Login' },
  register_title: { bn: 'নিবন্ধন করুন', en: 'Register' },
  dont_have_account: { bn: 'অ্যাকাউন্ট নেই?', en: "Don't have an account?" },
  already_have_account: { bn: 'অ্যাকাউন্ট আছে?', en: 'Already have an account?' },
  phone: { bn: 'ফোন নম্বর', en: 'Phone Number' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  name: { bn: 'নাম', en: 'Name' },
  email: { bn: 'ইমেইল', en: 'Email' },
  
  // Dashboard Modals & Messages
  hello: { bn: 'হ্যালো', en: 'Hello' },
  verified_member: { bn: 'ভেরিফাইড সদস্য', en: 'Verified Member' },
  current_balance: { bn: 'বর্তমান ব্যালেন্স', en: 'Current Balance' },
  total_members: { bn: 'মোট সদস্য', en: 'Total Members' },
  view_all: { bn: 'সব দেখুন', en: 'View All' },
  status_success: { bn: 'সফল', en: 'Success' },
  status_cancelled: { bn: 'বাতিল', en: 'Cancelled' },
  status_pending: { bn: 'পেন্ডিং', en: 'Pending' },
  no_transactions: { bn: 'কোন লেনদেন পাওয়া যায়নি', en: 'No transactions found' },
  no_notifications: { bn: 'কোন নোটিফিকেশন নেই', en: 'No notifications' },
  admin_message: { bn: 'অ্যাডমিন বার্তা', en: 'Admin Message' },
  send_suggestion: { bn: 'পরামর্শ পাঠান', en: 'Send Suggestion' },
  suggestion_placeholder: { bn: 'আপনার পরামর্শ লিখুন...', en: 'Write your suggestion here...' },
  submit: { bn: 'জমা দিন', en: 'Submit' },
  suggestion_sent: { bn: 'আপনার পরামর্শ এডমিন প্যানেলে পাঠানো হয়েছে। ধন্যবাদ!', en: 'Your suggestion has been sent to the admin panel. Thank you!' },
  error_occurred: { bn: 'সমস্যা হয়েছে।', en: 'An error occurred.' },
  contact_us: { bn: 'যোগাযোগ করুন', en: 'Contact Us' },
  whatsapp_group: { bn: 'WhatsApp Group', en: 'WhatsApp Group' },
  join_our_group: { bn: 'আমাদের গ্রুপে জয়েন করুন', en: 'Join our group' },
  facebook_page: { bn: 'Facebook Page', en: 'Facebook Page' },
  visit_our_page: { bn: 'আমাদের পেজ ভিজিট করুন', en: 'Visit our page' },
  messenger_title: { bn: 'Messenger', en: 'Messenger' },
  connect_on_messenger: { bn: 'আমাদের মেসেঞ্জারে যুক্ত হোন', en: 'Connect with us on Messenger' },
  official_email: { bn: 'Official Email', en: 'Official Email' },
  emergency_contact: { bn: 'জরুরি যোগাযোগ', en: 'Emergency Contact' },
  our_policy: { bn: 'আমাদের নীতিমালা', en: 'Our Policy' },
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  send_complaint: { bn: 'অভিযোগ জানান', en: 'Send Complaint' },
  complaint_placeholder: { bn: 'আপনার অভিযোগ বিস্তারিত লিখুন...', en: 'Write your complaint in detail...' },
  complaint_sent: { bn: 'আপনার অভিযোগ জমা দেওয়া হয়েছে। আমরা দ্রুত ব্যবস্থা নেব।', en: 'Your complaint has been submitted. We will take action soon.' },
  payment_info: { bn: 'পেমেন্ট তথ্য', en: 'Payment Information' },
  alrajhi_bank_info: { bn: 'ALRAJHI BANK INFORMATION', en: 'ALRAJHI BANK INFORMATION' },
  dutch_bangla_bank: { bn: 'ডাচ বাংলা ব্যাংক', en: 'Dutch Bangla Bank' },
  islami_bank: { bn: 'ইসলামী ব্যাংক', en: 'Islami Bank' },
  midland_bank: { bn: 'মিডল্যান্ড ব্যাংক', en: 'Midland Bank' },
  bkash: { bn: 'বিকাশ', en: 'bKash' },
  nagad: { bn: 'নগদ', en: 'Nagad' },
  rocket: { bn: 'রকেট', en: 'Rocket' },
  select_bank: { bn: 'ব্যাংক নির্বাচন করুন', en: 'Select Bank' },
  account_name: { bn: 'ACCOUNT NAME', en: 'ACCOUNT NAME' },
  beneficiary_name: { bn: 'BENEFICIARY NAME', en: 'BENEFICIARY NAME' },
  account_number: { bn: 'ACCOUNT NUMBER', en: 'ACCOUNT NUMBER' },
  branch_name: { bn: 'BRANCH NAME', en: 'BRANCH NAME' },
  swift_code: { bn: 'SWIFT CODE', en: 'SWIFT CODE' },
  routing_number: { bn: 'ROUTING NUMBER', en: 'ROUTING NUMBER' },
  official_mobile_banking: { bn: 'অফিসিয়াল মোবাইল ব্যাংকিং', en: 'Official Mobile Banking' },
  ok: { bn: 'ঠিক আছে', en: 'OK' },
  permanent_members_title: { bn: 'স্থায়ী সদস্য', en: 'Permanent Members' },
  our_proud_members: { bn: 'আমাদের গর্বিত সদস্যবৃন্দ', en: 'Our Proud Members' },
  no_permanent_members: { bn: 'কোন স্থায়ী সদস্য পাওয়া যায়নি', en: 'No permanent members found' },
  policy_1: { bn: "সংগঠনের সকল কার্যক্রমে পূর্ণ স্বচ্ছতা ও সততা বজায় রাখা আপনার প্রধান নৈতিক দায়িত্ব।", en: "Maintaining full transparency and honesty in all organizational activities is your primary moral responsibility." },
  policy_2: { bn: "আপনার ব্যক্তিগত তথ্য সংগঠনের কাজের বাইরে অন্য কোথাও প্রকাশ বা ব্যবহার করা হবে না।", en: "Your personal information will not be disclosed or used anywhere outside the organization's work." },
  policy_3: { bn: "জমাকৃত প্রতিটি অর্থ শুধুমাত্র আর্তমানবতার সেবা, দুর্যোগ মোকাবিলা ও সমাজকল্যাণে ব্যয় হবে।", en: "Every penny collected will be spent only on serving distressed humanity, disaster management, and social welfare." },
  policy_4: { bn: "সংগঠনের পরিচয় ব্যবহার করে কোনো ব্যক্তিগত ফায়দা বা রাজনৈতিক কাজ করা সম্পূর্ণ নিষিদ্ধ।", en: "Using the organization's identity for any personal gain or political work is strictly prohibited." },
  policy_5: { bn: "বিশেষ দুর্যোগে স্বেচ্ছাসেবী হিসেবে সশরীরে কাজ করার মানসিক প্রস্তুতি থাকতে হবে।", en: "You must be mentally prepared to work physically as a volunteer during special disasters." },
  policy_6: { bn: "সদস্যপদ সক্রিয় রাখতে মাসিক ফি বা অনুদান নিয়মিত প্রদান করে তহবিলে সহযোগিতা করতে হবে।", en: "To keep membership active, you must cooperate with the fund by regularly paying monthly fees or donations." },
  policy_7: { bn: "সংগঠনের আদর্শ পরিপন্থী কোনো কাজের প্রমাণ পাওয়া গেলে সদস্যপদ বাতিল হতে পারে।", en: "Membership may be canceled if evidence of any work contrary to the organization's ideals is found." },
  // Auth & Profile
  member_login: { bn: 'সদস্য লগইন', en: 'Member Login' },
  step: { bn: 'ধাপ', en: 'Step' },
  upload_photo: { bn: 'আপনার ছবি দিন', en: 'Upload your photo' },
  select_profession: { bn: 'পেশা নির্বাচন', en: 'Select Profession' },
  birth_year: { bn: 'জন্ম সাল (4 সংখ্যা)', en: 'Birth Year (4 digits)' },
  blood_group: { bn: 'রক্তের গ্রুপ', en: 'Blood Group' },
  next_step: { bn: 'পরবর্তী ধাপ', en: 'Next Step' },
  bangladesh: { bn: 'বাংলাদেশ', en: 'Bangladesh' },
  abroad: { bn: 'প্রবাস', en: 'Abroad' },
  select_district: { bn: 'জেলা নির্বাচন করুন', en: 'Select District' },
  select_upazila: { bn: 'উপজেলা নির্বাচন করুন', en: 'Select Upazila' },
  village_area: { bn: 'গ্রাম / মহল্লা', en: 'Village / Area' },
  terms_conditions: { bn: 'নীতিমালা ও শর্তাবলী', en: 'Terms & Conditions' },
  complete_registration: { bn: 'নিবন্ধন সম্পন্ন করুন', en: 'Complete Registration' },
  select_country: { bn: 'দেশ নির্বাচন করুন', en: 'Select Country' },
  search_district: { bn: 'জেলা খুঁজুন...', en: 'Search district...' },
  search_upazila: { bn: 'উপজেলা খুঁজুন...', en: 'Search upazila...' },
  search_profession: { bn: 'পেশা খুঁজুন...', en: 'Search profession...' },
  member_id: { bn: 'সদস্য আইডি', en: 'Member ID' },
  organizational_id_card: { bn: 'সাংগঠনিক আইডি কার্ড', en: 'Organizational ID Card' },
  joining_date: { bn: 'যোগদানের তারিখ', en: 'Joining Date' },
  expiry_date: { bn: 'মেয়াদ শেষ', en: 'Expiry Date' },
  print: { bn: 'প্রিন্ট করুন', en: 'Print' },
  login_error_no_account: { bn: 'এই নম্বরটি দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি। সঠিক নম্বর দিন অথবা নতুন নিবন্ধন করুন।', en: 'No account found with this number. Enter correct number or register.' },
  login_error_pending: { bn: 'আপনার আবেদনটি এখনো এডমিন অনুমোদনের অপেক্ষায় আছে। অনুমোদিত হলে লগইন করতে পারবেন।', en: 'Your application is pending admin approval. You can login once approved.' },
  login_error_rejected: { bn: 'দুঃখিত, আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন।', en: 'Sorry, your application has been rejected. Contact admin for details.' },
  login_error_general: { bn: 'লগইন করতে সমস্যা হয়েছে। দয়া করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।', en: 'Login failed. Please check your internet connection and try again.' },
  reg_error_photo: { bn: 'একটি প্রোফাইল ছবি আপলোড করুন।', en: 'Please upload a profile photo.' },
  reg_error_fields: { bn: 'রক্তের গ্রুপ ও জন্ম সালসহ সব তথ্য পূরণ করুন।', en: 'Please fill all info including blood group and birth year.' },
  reg_error_birth_year: { bn: 'সঠিক জন্ম সাল প্রদান করুন (যেমন: 1995)।', en: 'Please provide a valid birth year (e.g., 1995).' },
  reg_error_location: { bn: 'জেলা এবং উপজেলা নির্বাচন করুন।', en: 'Please select district and upazila.' },
  reg_error_exists: { bn: 'এই নম্বরটি দিয়ে ইতিমধ্যে আবেদন করা হয়েছে। অনুগ্রহ করে অনুমোদনের অপেক্ষা করুন বা লগইন করুন।', en: 'An application has already been made with this number. Please wait for approval or login.' },
  reg_error_terms: { bn: 'নীতিমালায় সম্মতি দেওয়া বাধ্যতামূলক।', en: 'Agreement to terms is mandatory.' },
  reg_success: { bn: 'আবেদন সফল হয়েছে! এডমিন অনুমোদনের অপেক্ষা করুন।', en: 'Application successful! Please wait for admin approval.' },
  image_process_error: { bn: 'ছবি প্রসেস করতে সমস্যা হয়েছে।', en: 'Error processing image.' },
  enter_number: { bn: 'নম্বর লিখুন...', en: 'Enter number...' },
  select_district_first: { bn: 'আগে জেলা নির্বাচন করুন।', en: 'Select district first.' },
  terms_agreement_text: { bn: 'আমি সংগঠনের সকল নীতিমালা ও শর্তাবলী অত্যন্ত গুরুত্বের সাথে মেনে চলার অঙ্গীকার করছি।', en: 'I pledge to strictly follow all the policies and terms of the organization.' },
  not_determined: { bn: 'নির্ধারিত নয়', en: 'Not determined' },
  general_member: { bn: 'সাধারণ সদস্য', en: 'General Member' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
