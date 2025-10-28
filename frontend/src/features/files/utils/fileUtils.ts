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

/**
 * Получает расширение файла
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() || "";
};

/**
 * Валидация набора файлов для генерации
 * Правило: 1 JSON + (XSD ИЛИ XML), но не оба
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateFilesForGeneration = (
  fileNames: string[]
): FileValidationResult => {
  const errors: string[] = [];

  // Подсчет типов файлов
  const extensions = fileNames.map(getFileExtension);
  const jsonCount = extensions.filter((ext) => ext === "json").length;
  const xsdCount = extensions.filter((ext) => ext === "xsd").length;
  const xmlCount = extensions.filter((ext) => ext === "xml").length;

  // Проверка JSON
  if (jsonCount === 0) {
    errors.push("Требуется один JSON файл");
  } else if (jsonCount > 1) {
    errors.push("Можно загрузить только один JSON файл");
  }

  // Проверка XSD/XML
  const hasXsd = xsdCount > 0;
  const hasXml = xmlCount > 0;

  if (!hasXsd && !hasXml) {
    errors.push("Требуется либо XSD, либо XML файл");
  } else if (hasXsd && hasXml) {
    errors.push("Можно загрузить либо XSD, либо XML, но не оба одновременно");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
