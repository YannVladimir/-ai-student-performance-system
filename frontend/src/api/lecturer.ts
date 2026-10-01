import { apiClient } from "./client";
import type {
  AtRiskStudentDto,
  CourseSummaryDto,
  TrendPointDto,
  UploadHistoryDto,
  UploadResultDto,
} from "../types";

export async function getMyCourses(): Promise<CourseSummaryDto[]> {
  const { data } = await apiClient.get<CourseSummaryDto[]>("/lecturer/courses");
  return data;
}

export async function getAtRiskStudents(
  courseId: number,
  semester: string,
  minLevel?: string
): Promise<AtRiskStudentDto[]> {
  const { data } = await apiClient.get<AtRiskStudentDto[]>(
    `/lecturer/courses/${courseId}/at-risk`,
    { params: { semester, minLevel } }
  );
  return data;
}

export async function uploadAcademicData(
  file: File,
  courseId: number,
  semester: string
): Promise<UploadResultDto> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<UploadResultDto>("/lecturer/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params: { courseId, semester },
  });
  return data;
}

export async function generatePredictions(courseId: number, semester: string) {
  const { data } = await apiClient.post(`/lecturer/courses/${courseId}/predict`, null, {
    params: { semester },
  });
  return data;
}

export async function getCourseTrends(courseId: number): Promise<TrendPointDto[]> {
  const { data } = await apiClient.get<TrendPointDto[]>(`/lecturer/courses/${courseId}/trends`);
  return data;
}

export async function getUploadHistory(courseId: number): Promise<UploadHistoryDto[]> {
  const { data } = await apiClient.get<UploadHistoryDto[]>(`/lecturer/courses/${courseId}/uploads`);
  return data;
}
