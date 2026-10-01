import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return <Outlet />;
}

export function homeFor(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "LECTURER":
      return "/lecturer";
    case "ADMIN":
      return "/admin";
    case "MANAGEMENT":
      return "/management";
  }
}
