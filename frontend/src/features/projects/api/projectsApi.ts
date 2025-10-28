import apiClient from "@/shared/api/axios";
import type {
  GetProjectsParams,
  ProjectsListResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateProjectWithFilesRequest,
  CreateProjectWithFilesResponse,
} from "../types/projects.types";

const PROJECTS_BASE_URL = "/projects";

/**
 * Получить список проектов с фильтрацией и сортировкой
 */
export const getProjects = async (
  params: GetProjectsParams = {}
): Promise<ProjectsListResponse> => {
  const response = await apiClient.get<ProjectsListResponse>(
    `${PROJECTS_BASE_URL}/`,
    {
      params: {
        status: params.status,
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    }
  );
  return response.data;
};

/**
 * Получить проект по ID
 */
export const getProjectById = async (projectId: string): Promise<Project> => {
  const response = await apiClient.get<Project>(
    `${PROJECTS_BASE_URL}/${projectId}`
  );
  return response.data;
};

/**
 * Создать новый проект
 */
export const createProject = async (
  data: CreateProjectRequest
): Promise<Project> => {
  const response = await apiClient.post<Project>(`${PROJECTS_BASE_URL}/`, data);
  return response.data;
};

/**
 * Обновить проект
 */
export const updateProject = async (
  projectId: string,
  data: UpdateProjectRequest
): Promise<Project> => {
  const response = await apiClient.put<Project>(
    `${PROJECTS_BASE_URL}/${projectId}`,
    data
  );
  return response.data;
};

/**
 * Удалить проект
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  await apiClient.delete(`${PROJECTS_BASE_URL}/${projectId}`);
};

/**
 * Создать проект с файлами и опционально сгенерировать VM шаблон
 */
export const createProjectWithFiles = async (
  data: CreateProjectWithFilesRequest
): Promise<CreateProjectWithFilesResponse> => {
  const formData = new FormData();

  formData.append("name", data.name);
  if (data.description) {
    formData.append("description", data.description);
  }

  // Добавляем все файлы
  data.files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("file_types", data.file_types);

  if (data.generate !== undefined) {
    formData.append("generate", String(data.generate));
  }

  const response = await apiClient.post<CreateProjectWithFilesResponse>(
    `${PROJECTS_BASE_URL}/full`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
