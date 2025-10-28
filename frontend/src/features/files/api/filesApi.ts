import apiClient from "@/shared/api/axios";
import type {
  FileInfo,
  FileListResponse,
  UploadFileRequest,
} from "../types/files.types";

const FILES_BASE_URL = "/files";

/**
 * Загрузить файл
 */
export const uploadFile = async (
  data: UploadFileRequest
): Promise<FileInfo> => {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("project_id", data.project_id);
  formData.append("file_type", data.file_type); // Обязательное поле
  if (data.uploaded_by) {
    formData.append("uploaded_by", data.uploaded_by);
  }

  const response = await apiClient.post<FileInfo>(
    `${FILES_BASE_URL}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Получить файлы проекта
 */
export const getProjectFiles = async (
  projectId: string
): Promise<FileListResponse> => {
  const response = await apiClient.get<FileListResponse>(
    `${FILES_BASE_URL}/project/${projectId}`
  );
  return response.data;
};

/**
 * Получить метаданные файла
 */
export const getFileById = async (fileId: string): Promise<FileInfo> => {
  const response = await apiClient.get<FileInfo>(`${FILES_BASE_URL}/${fileId}`);
  return response.data;
};

/**
 * Скачать файл
 */
export const downloadFile = async (
  fileId: string,
  fileName: string
): Promise<void> => {
  const response = await apiClient.get(`${FILES_BASE_URL}/${fileId}/download`, {
    responseType: "blob",
  });

  // Создаем ссылку для скачивания
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Удалить файл
 */
export const deleteFile = async (
  fileId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `${FILES_BASE_URL}/${fileId}`
  );
  return response.data;
};
