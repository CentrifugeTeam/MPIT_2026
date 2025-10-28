import { Button } from "@heroui/button";
import { CircularProgress } from "@heroui/react";
import type { LocalFile } from "../types/files.types";

interface FileListProps {
  files: LocalFile[];
  onRemove: (fileId: string) => void;
  onAddMore: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileIcon = () => {
  return (
    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
      <svg
        className="w-7 h-7 text-primary-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

const getStatusText = (file: LocalFile) => {
  switch (file.status) {
    case "uploading":
      return `${file.progress}%`;
    case "success":
      return "100% • Успешно загружено";
    case "error":
      return `Ошибка: ${file.error || "Неизвестная ошибка"}`;
    case "pending":
      return "Ожидание...";
  }
};

const getStatusColor = (status: LocalFile["status"]) => {
  switch (status) {
    case "success":
      return "text-success-500";
    case "error":
      return "text-danger-500";
    case "uploading":
      return "text-primary-500";
    case "pending":
      return "text-default-400";
  }
};

export default function FileList({
  files,
  onRemove,
  onAddMore,
}: FileListProps) {
  return (
    <div className="space-y-4">
      {/* Заголовок и кнопка добавить */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Загруженные файлы
        </h3>
        <Button color="primary" variant="solid" onPress={onAddMore}>
          Добавить ещё
        </Button>
      </div>

      {/* Список файлов */}
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-4 p-4 bg-foreground-100 rounded-2xl border border-default-100"
          >
            {/* Иконка файла */}
            {getFileIcon()}

            {/* Информация о файле */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-foreground truncate">
                {file.file.name}
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-default-500">
                  {formatFileSize(file.file.size)}
                </span>
                <span className="text-default-300">•</span>
                <span className={getStatusColor(file.status)}>
                  {getStatusText(file)}
                </span>
              </div>
            </div>

            {/* Прогресс загрузки */}
            {file.status === "uploading" && (
              <CircularProgress
                aria-label="Загрузка"
                value={file.progress}
                color="primary"
                size="sm"
                showValueLabel={false}
              />
            )}

            {/* Иконка успеха */}
            {file.status === "success" && (
              <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-success-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* Кнопка удаления */}
            <Button
              isIconOnly
              variant="light"
              color="danger"
              onPress={() => onRemove(file.id)}
              disabled={file.status === "uploading"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
