// Статусы проекта
export type ProjectStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";

// Проект
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  total_size: number; // размер VM_TEMPLATE файла в байтах
}

// Типы сортировки
export type SortField = "created_at" | "total_size" | "name" | "status";
export type SortOrder = "asc" | "desc";

// Параметры для получения проектов
export interface GetProjectsParams {
  status?: ProjectStatus;
  skip?: number;
  limit?: number;
  search?: string; // Поиск по названию проекта
  sort_by?: SortField;
  sort_order?: SortOrder;
}

// Ответ со списком проектов
export interface ProjectsListResponse {
  projects: Project[];
  total: number;
}

// Запрос на создание проекта
export interface CreateProjectRequest {
  name: string;
  description: string;
  status?: ProjectStatus;
}

// Запрос на обновление проекта
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

// Запрос на создание проекта с файлами и генерацией
export interface CreateProjectWithFilesRequest {
  name: string;
  description?: string;
  files: File[];
  file_types: string; // Типы через запятую: "JSON_SCHEMA,XSD_SCHEMA,TEST_DATA"
  generate?: boolean; // Запустить генерацию (по умолчанию false)
}

// Ответ от создания проекта с файлами
export interface CreateProjectWithFilesResponse {
  success: boolean;
  project: Project & {
    mappings: any[];
    history: any[];
    files: Array<{
      id: string;
      file_name: string;
      file_type: string;
      file_size: number;
      mime_type: string;
      created_at: string;
    }>;
  };
  uploaded_files: Array<{
    id: string;
    project_id: string;
    file_name: string;
    file_type: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    checksum: string;
    uploaded_by: string;
    created_at: string;
  }>;
  generation?: {
    success: boolean;
    template_file_id: string; // ID файла шаблона для скачивания
    mappings_count: number;
    validation: {
      is_valid: boolean;
      errors: any[];
      warnings: any[];
    };
  };
}
