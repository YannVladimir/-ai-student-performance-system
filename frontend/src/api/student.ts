import { apiClient } from "./client";
import type { StudentDashboardResponse } from "../types";

export async function getStudentDashboard(): Promise<StudentDashboardResponse> {
  const { data } = await apiClient.get<StudentDashboardResponse>("/student/dashboard");
  return data;
}

export async function acknowledgeRecommendation(id: number): Promise<void> {
  await apiClient.patch(`/student/recommendations/${id}/acknowledge`);
}
