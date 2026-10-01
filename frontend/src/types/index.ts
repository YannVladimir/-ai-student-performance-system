export type Role = "STUDENT" | "LECTURER" | "ADMIN" | "MANAGEMENT";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "NOT_YET_PREDICTED";

export interface LoginResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface RecommendationDto {
  id: number;
  category: string;
  message: string;
  status: "ACTIVE" | "ACKNOWLEDGED";
}

export interface CoursePredictionDto {
  courseId: number;
  courseCode: string;
  courseName: string;
  semester: string;
  riskLevel: RiskLevel;
  confidenceScore: number | null;
  modelUsed: string | null;
  generatedAt: string | null;
  recommendations: RecommendationDto[];
  attendanceRate: number | null;
  caScore: number | null;
  assignmentCompletion: number | null;
  finalScore: number | null;
}

export interface StudentDashboardResponse {
  studentId: number;
  fullName: string;
  registrationNo: string;
  program: string;
  yearOfStudy: number;
  overallRiskLevel: RiskLevel;
  coursePredictions: CoursePredictionDto[];
}

export interface AtRiskStudentDto {
  studentId: number;
  fullName: string;
  registrationNo: string;
  courseCode: string;
  semester: string;
  riskLevel: RiskLevel;
  confidenceScore: number | null;
  attendanceRate: number | null;
  caScore: number | null;
  assignmentCompletion: number | null;
}

export interface CourseSummaryDto {
  courseId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  enrolledStudents: number;
  highRiskCount: number;
}

export interface AdminAnalyticsResponse {
  totalStudents: number;
  totalCourses: number;
  riskDistribution: Record<string, number>;
  byProgram: { program: string; low: number; medium: number; high: number }[];
  byCourse: { courseCode: string; courseName: string; low: number; medium: number; high: number }[];
}

export interface UploadResultDto {
  recordsProcessed: number;
  recordsFailed: number;
  errors: string[];
}

export interface UploadHistoryDto {
  id: number;
  fileName: string;
  semester: string;
  uploadedAt: string;
  uploadedByName: string;
  recordsProcessed: number;
  recordsFailed: number;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface NotificationDto {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEntryDto {
  predictionId: number;
  studentName: string;
  registrationNo: string;
  courseCode: string | null;
  semester: string | null;
  modelUsed: string | null;
  riskLevel: RiskLevel;
  confidenceScore: number | null;
  generatedAt: string;
  recommendationMessages: string[];
}

export interface MlModelMetricsDto {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_accuracy_mean: number;
  cv_accuracy_min: number;
  cv_accuracy_max: number;
}

export interface MlMetricsResponse {
  trained_on_rows: number;
  active_model: string;
  metrics: Record<string, MlModelMetricsDto>;
}

export interface TrendPointDto {
  semester: string;
  low: number;
  medium: number;
  high: number;
}

export interface SystemHealthDto {
  totalUsers: number;
  totalStudents: number;
  uptimeMillis: number;
  mlServiceStatus: string;
}

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: Role;
  password: string;
}

export interface CourseAdminDto {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  program: string | null;
  lecturerId: number | null;
  lecturerName: string | null;
}

export interface CreateCourseRequest {
  courseCode: string;
  courseName: string;
  credits: number;
  program: string | null;
  lecturerUserId: number | null;
}

export interface UpdateCourseRequest {
  courseName: string;
  credits: number;
  program: string | null;
  lecturerUserId: number | null;
}

export interface StudentOverviewDto {
  studentId: number;
  fullName: string;
  registrationNo: string;
  program: string;
  yearOfStudy: number;
  overallRiskLevel: RiskLevel;
  enrolledCourses: number;
}
