import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute, homeFor } from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import CourseAtRiskPage from "./pages/lecturer/CourseAtRiskPage";
import UploadPage from "./pages/lecturer/UploadPage";
import LecturerTrendsPage from "./pages/lecturer/PerformanceTrendsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AuditTrailPage from "./pages/admin/AuditTrailPage";
import UsersPage from "./pages/admin/UsersPage";
import CoursesPage from "./pages/admin/CoursesPage";
import ManagementDashboard from "./pages/management/ManagementDashboard";
import StudentWelfarePage from "./pages/management/StudentWelfarePage";
import ManagementTrendsPage from "./pages/management/PerformanceTrendsPage";
import StudentsPage from "./pages/management/StudentsPage";
import StudentDetailPage from "./pages/management/StudentDetailPage";

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={homeFor(user.role)} replace /> : <LoginPage />}
      />

      <Route element={<ProtectedRoute allow={["STUDENT"]} />}>
        <Route path="/student" element={<StudentDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allow={["LECTURER", "ADMIN"]} />}>
        <Route path="/lecturer" element={<LecturerDashboard />} />
        <Route path="/lecturer/courses/:courseId" element={<CourseAtRiskPage />} />
        <Route path="/lecturer/courses/:courseId/trends" element={<LecturerTrendsPage />} />
        <Route path="/lecturer/upload" element={<UploadPage />} />
      </Route>

      <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/courses" element={<CoursesPage />} />
        <Route path="/admin/audit" element={<AuditTrailPage />} />
      </Route>

      <Route element={<ProtectedRoute allow={["MANAGEMENT", "ADMIN"]} />}>
        <Route path="/management" element={<ManagementDashboard />} />
        <Route path="/management/students" element={<StudentsPage />} />
        <Route path="/management/students/:studentId" element={<StudentDetailPage />} />
        <Route path="/management/welfare" element={<StudentWelfarePage />} />
        <Route path="/management/trends" element={<ManagementTrendsPage />} />
      </Route>

      <Route
        path="/"
        element={<Navigate to={user ? homeFor(user.role) : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
