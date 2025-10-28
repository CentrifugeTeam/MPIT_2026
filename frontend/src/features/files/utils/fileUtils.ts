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

/**
 * Интерфейс для представления файла в сравнении
 */
export interface FileForComparison {
  name: string;
  type: FileType;
  serverFileId?: string; // ID файла на сервере (если есть)
}

/**
 * Сравнивает два набора файлов и определяет, есть ли изменения
 * Учитывает не только добавление/удаление, но и замену файлов с похожими названиями
 */
export const compareFileSets = (
  originalFiles: FileForComparison[],
  currentFiles: FileForComparison[]
): boolean => {
  // Если количество файлов изменилось - точно есть изменения
  if (originalFiles.length !== currentFiles.length) {
    return true;
  }

  // Группируем файлы по типам для сравнения
  const groupByType = (files: FileForComparison[]) => {
    const grouped: Record<FileType, FileForComparison[]> = {
      JSON_SCHEMA: [],
      XSD_SCHEMA: [],
      TEST_DATA: [],
      VM_TEMPLATE: []
    };
    
    files.forEach(file => {
      grouped[file.type].push(file);
    });
    
    return grouped;
  };

  const originalGrouped = groupByType(originalFiles);
  const currentGrouped = groupByType(currentFiles);

  // Сравниваем каждый тип файлов
  for (const fileType of Object.keys(originalGrouped) as FileType[]) {
    const originalTypeFiles = originalGrouped[fileType];
    const currentTypeFiles = currentGrouped[fileType];

    // Если количество файлов типа изменилось
    if (originalTypeFiles.length !== currentTypeFiles.length) {
      return true;
    }

    // Для каждого типа сравниваем файлы
    if (fileType === "JSON_SCHEMA" || fileType === "XSD_SCHEMA") {
      // Для JSON и XSD файлов должно быть ровно по одному
      if (originalTypeFiles.length > 0 && currentTypeFiles.length > 0) {
        const originalFile = originalTypeFiles[0];
        const currentFile = currentTypeFiles[0];
        
        // Если файл заменился (разные serverFileId или разные названия)
        if (originalFile.serverFileId !== currentFile.serverFileId || 
            originalFile.name !== currentFile.name) {
          return true;
        }
      }
    } else {
      // Для TEST_DATA файлов сравниваем по названиям
      const originalNames = originalTypeFiles.map(f => f.name).sort();
      const currentNames = currentTypeFiles.map(f => f.name).sort();
      
      if (JSON.stringify(originalNames) !== JSON.stringify(currentNames)) {
        return true;
      }
    }
  }

  return false;
};
