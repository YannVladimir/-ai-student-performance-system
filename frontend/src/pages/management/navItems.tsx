import { LayoutDashboard, HeartPulse, TrendingUp, GraduationCap } from "lucide-react";

export const MANAGEMENT_NAV_ITEMS = [
  { to: "/management", label: "Analytics", icon: <LayoutDashboard size={16} /> },
  { to: "/management/students", label: "Students", icon: <GraduationCap size={16} /> },
  { to: "/management/welfare", label: "Student Welfare", icon: <HeartPulse size={16} /> },
  { to: "/management/trends", label: "Performance Trends", icon: <TrendingUp size={16} /> },
];
