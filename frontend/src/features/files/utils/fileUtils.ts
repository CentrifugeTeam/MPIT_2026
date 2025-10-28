import type { FileType } from "../types/files.types";

/**
 * Определяет тип файла по его расширению
 */
export const getFileTypeByExtension = (fileName: string): FileType => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "json":
      return "JSON_SCHEMA";
    case "xsd":
      return "XSD_SCHEMA";
    case "xml":
      return "XSD_SCHEMA"; // XML тоже считается XSD схемой
    case "txt":
      return "TEST_DATA";
    default:
      return "TEST_DATA"; // По умолчанию считаем тестовыми данными
  }
};

/**
 * Форматирует размер файла в читаемый вид
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Проверяет допустимость расширения файла
 */
export const isValidFileExtension = (fileName: string): boolean => {
  const validExtensions = [".json", ".txt", ".xml", ".xsd"];
  const extension = "." + fileName.split(".").pop()?.toLowerCase();
  return validExtensions.includes(extension);
};
