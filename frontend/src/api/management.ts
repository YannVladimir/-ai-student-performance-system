import { apiClient } from "./client";
import type {
  AdminAnalyticsResponse,
  AtRiskStudentDto,
  RiskLevel,
  StudentDashboardResponse,
  StudentOverviewDto,
  TrendPointDto,
} from "../types";

export async function getManagementAnalytics(): Promise<AdminAnalyticsResponse> {
  const { data } = await apiClient.get<AdminAnalyticsResponse>("/management/analytics");
  return data;
}

export async function getStudentWelfare(
  semester?: string,
  minLevel?: RiskLevel
): Promise<AtRiskStudentDto[]> {
  const { data } = await apiClient.get<AtRiskStudentDto[]>("/management/welfare", {
    params: { semester, minLevel },
  });
  return data;
}

export async function getPerformanceTrends(): Promise<TrendPointDto[]> {
  const { data } = await apiClient.get<TrendPointDto[]>("/management/trends");
  return data;
}

export async function getStudentOverview(): Promise<StudentOverviewDto[]> {
  const { data } = await apiClient.get<StudentOverviewDto[]>("/management/students");
  return data;
}

export async function getStudentDetail(studentId: number): Promise<StudentDashboardResponse> {
  const { data } = await apiClient.get<StudentDashboardResponse>(`/management/students/${studentId}`);
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

export function downloadManagementExcel() {
  return downloadReport("/management/reports/excel", "analytics-report.xlsx");
}

export function downloadManagementPdf() {
  return downloadReport("/management/reports/pdf", "analytics-report.pdf");
}
