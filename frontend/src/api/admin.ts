import { apiClient } from "./client";
import type {
  AdminAnalyticsResponse,
  AppUser,
  AuditEntryDto,
  CourseAdminDto,
  CreateCourseRequest,
  CreateUserRequest,
  MlMetricsResponse,
  Role,
  SystemHealthDto,
  UpdateCourseRequest,
} from "../types";

export async function getAdminAnalytics(): Promise<AdminAnalyticsResponse> {
  const { data } = await apiClient.get<AdminAnalyticsResponse>("/admin/analytics");
  return data;
}

export async function getUsers(role?: Role): Promise<AppUser[]> {
  const { data } = await apiClient.get<AppUser[]>("/admin/users", { params: { role } });
  return data;
}

export async function createUser(request: CreateUserRequest): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>("/admin/users", request);
  return data;
}

export async function setUserStatus(id: number, status: "ACTIVE" | "SUSPENDED"): Promise<AppUser> {
  const { data } = await apiClient.patch<AppUser>(`/admin/users/${id}/status`, null, {
    params: { status },
  });
  return data;
}

export async function getSystemHealth(): Promise<SystemHealthDto> {
  const { data } = await apiClient.get<SystemHealthDto>("/admin/system/health");
  return data;
}

export async function getCourses(): Promise<CourseAdminDto[]> {
  const { data } = await apiClient.get<CourseAdminDto[]>("/admin/courses");
  return data;
}

export async function createCourse(request: CreateCourseRequest): Promise<CourseAdminDto> {
  const { data } = await apiClient.post<CourseAdminDto>("/admin/courses", request);
  return data;
}

export async function updateCourse(id: number, request: UpdateCourseRequest): Promise<CourseAdminDto> {
  const { data } = await apiClient.patch<CourseAdminDto>(`/admin/courses/${id}`, request);
  return data;
}

export async function getMlMetrics(): Promise<MlMetricsResponse> {
  const { data } = await apiClient.get<MlMetricsResponse>("/admin/ml/metrics");
  return data;
}

export async function triggerRetrain(): Promise<void> {
  await apiClient.post("/admin/ml/retrain");
}

export async function getAuditTrail(studentId?: number, courseId?: number): Promise<AuditEntryDto[]> {
  const { data } = await apiClient.get<AuditEntryDto[]>("/admin/audit", {
    params: { studentId, courseId },
  });
  return data;
}

async function downloadReport(path: string, filename: string) {
  const response = await apiClient.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function downloadAnalyticsExcel() {
  return downloadReport("/admin/reports/excel", "analytics-report.xlsx");
}

export function downloadAnalyticsPdf() {
  return downloadReport("/admin/reports/pdf", "analytics-report.pdf");
}
