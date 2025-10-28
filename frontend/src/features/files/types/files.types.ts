// Типы файлов
export type FileType =
  | "JSON_SCHEMA"
  | "XSD_SCHEMA"
  | "TEST_DATA"
  | "VM_TEMPLATE";

// Информация о файле
export interface FileInfo {
  id: string;
  project_id: string;
  file_name: string;
  file_type: FileType;
  file_path?: string;
  file_size: number;
  mime_type: string;
  checksum?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at?: string | null;
  template?: string | null; // Содержимое VM_TEMPLATE файла
}

// Ответ со списком файлов
export interface FileListResponse {
  files: FileInfo[];
  total: number;
  vm_template_size: number;
  vm_template_file?: FileInfo;
}

// Запрос на загрузку файла
export interface UploadFileRequest {
  file: File;
  project_id: string;
  file_type: FileType; // Обязательное поле!
  uploaded_by?: string;
}

// Локальный файл для UI (до загрузки на сервер)
export interface LocalFile {
  id: string; // временный ID для UI
  file: File;
  progress: number; // 0-100
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  serverFileId?: string; // ID после загрузки на сервер
}
