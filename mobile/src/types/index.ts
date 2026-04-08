export interface Company {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  location?: string;
  internships_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'company' | 'admin';
  profile_image?: string;
  university?: string;
  major?: string;
  bio?: string;
  phone?: string;
  skills?: string | string[];
  interests?: string | string[];
  location?: string;
  resume_url?: string;
  points?: number;
  login_streak?: number;
  is_verified?: boolean;
}

export interface Internship {
  id: number;
  title: string;
  company: string;
  company_id?: number;
  location: string;
  type: string;           // Remote, On-site, Hybrid, Full-time, Part-time
  duration?: string;
  deadline?: string;
  description?: string;
  requirements?: string;
  application_url?: string;
  logo_url?: string;
  company_logo?: string;
  is_active?: boolean;
  is_paid?: boolean;
  stipend?: string;
  skills_required?: string[];
  created_at?: string;
}

export interface Application {
  id: number;
  internship_id: number;
  student_id: number;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  applied_at: string;
  internship?: Internship;
}

export interface CVSection {
  id: number;
  section_type: 'education' | 'experience' | 'skills' | 'projects' | 'certifications';
  title: string;
  subtitle?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  order_index: number;
}

export interface CV {
  id: number;
  headline?: string;
  summary?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  sections: CVSection[];
}

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Browse: undefined;
  Companies: undefined;
  Saved: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  InternshipDetail: { id: number };
  CVBuilder: undefined;
  Applications: { filter?: string } | undefined;
  Points: undefined;
  EditProfile: undefined;
  HelpCenter: undefined;
  ContactSupport: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

// Composite nav type for screens that live inside the tab navigator
// but also need to push onto the root stack (e.g. InternshipDetail).
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabScreenNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
