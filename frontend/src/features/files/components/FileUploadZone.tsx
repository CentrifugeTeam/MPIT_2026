import { useCallback } from "react";
import { Button } from "@heroui/button";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // в байтах
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = [".json", ".txt", ".xml", ".xsd"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function FileUploadZone({
  onFilesSelected,
  accept = ACCEPTED_EXTENSIONS.join(","),
  maxSize = MAX_FILE_SIZE,
  disabled = false,
}: FileUploadZoneProps) {
  const validateFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return [];

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        // Проверка расширения
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
          errors.push(
            `Файл ${
              file.name
            } имеет недопустимое расширение. Разрешены: ${ACCEPTED_EXTENSIONS.join(
              ", "
            )}`
          );
          return;
        }

        // Проверка размера
        if (file.size > maxSize) {
          errors.push(
            `Файл ${file.name} превышает максимальный размер ${
              maxSize / (1024 * 1024)
            }MB`
          );
          return;
        }

        validFiles.push(file);
      });

      if (errors.length > 0) {
        // TODO: показать ошибки через toast
        console.error("Validation errors:", errors);
      }

      return validFiles;
    },
    [maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [disabled, validateFiles, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }

      // Сбрасываем input чтобы можно было загрузить те же файлы повторно
      e.target.value = "";
    },
    [disabled, validateFiles, onFilesSelected]
  );

  const openFileDialog = useCallback(() => {
    if (disabled) return;
    document.getElementById("file-input")?.click();
  }, [disabled]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        border-2 border-dashed border-default-300 rounded-2xl p-12
        flex flex-col items-center justify-center gap-4
        transition-colors
        ${
          !disabled
            ? "hover:border-primary-400 hover:bg-primary-50/30 cursor-pointer"
            : "opacity-50 cursor-not-allowed"
        }
      `}
      onClick={openFileDialog}
    >
      {/* Иконка */}
      <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
        <svg
          className="w-8 h-8 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      {/* Текст */}
      <div className="text-center">
        <p className="text-lg font-medium text-foreground mb-1">
          Загрузите ваши файлы
        </p>
        <p className="text-sm text-default-500">
          1 файл JSON + (XSD или XML), до 50MB каждый
        </p>
      </div>

      {/* Кнопка */}
      <Button
        color="primary"
        variant="solid"
        size="lg"
        disabled={disabled}
        onPress={openFileDialog}
      >
        Выбрать файл
      </Button>

      {/* Скрытый input */}
      <input
        id="file-input"
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
