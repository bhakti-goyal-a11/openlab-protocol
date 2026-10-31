export interface Persona {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'LAB_MANAGER' | 'ADMIN';
  department: string;
  trustScore: number;
  academicNeedWeight: number;
  badges: string[];
  avatarUrl: string;
  tagline: string;
}

export const PRESET_PERSONAS: Persona[] = [
  {
    id: "user_aarav",
    email: "aarav@univ.edu",
    fullName: "Aarav Verma",
    role: "STUDENT",
    department: "Mechatronics & Robotics",
    trustScore: 96.5,
    academicNeedWeight: 1.5,
    badges: ["BADGE_SAFETY_101", "BADGE_CNC_1", "BADGE_3D_PRINT_1"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    tagline: "Student • Certified Maker • Trust 96.5"
  },
  {
    id: "user_priya",
    email: "priya@univ.edu",
    fullName: "Priya Nair",
    role: "STUDENT",
    department: "Department of Physics",
    trustScore: 75.0,
    academicNeedWeight: 1.0,
    badges: ["BADGE_SAFETY_101"],
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    tagline: "Student • Uncertified Novice • Trust 75.0"
  },
  {
    id: "user_sharma",
    email: "sharma@univ.edu",
    fullName: "Prof. Rajesh Sharma",
    role: "LAB_MANAGER",
    department: "Mechanical & Fabrication Bay",
    trustScore: 100.0,
    academicNeedWeight: 1.0,
    badges: ["BADGE_SAFETY_101", "BADGE_CNC_1", "BADGE_3D_PRINT_1"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    tagline: "Lab Custodian • Mechanical Bay"
  },
  {
    id: "user_vandana",
    email: "vandana@univ.edu",
    fullName: "Dean Vandana Rao",
    role: "ADMIN",
    department: "Engineering Administration & Ethics",
    trustScore: 100.0,
    academicNeedWeight: 1.0,
    badges: ["BADGE_SAFETY_101", "BADGE_CNC_1", "BADGE_3D_PRINT_1"],
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    tagline: "Admin • Ethics & Arbitration"
  }
];

export const DEFAULT_PERSONA = PRESET_PERSONAS[0];

