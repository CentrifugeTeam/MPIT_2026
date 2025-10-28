import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FileIcon from "@/shared/assets/file-icon.svg";
import DownloadIcon from "@/shared/assets/download.svg";
import DeleteIcon from "@/shared/assets/delete.svg";
import type { Project } from "../types/projects.types";
import { useGetProjectFiles } from "@/features/files/hooks";
import { useDeleteProject } from "../hooks";
import { downloadFile } from "@/features/files/api/filesApi";
import { useToastStore } from "@/shared/hooks/useToast";

interface ProjectCardProps {
  project: Project;
}

const getStatusText = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "Черновик";
    case "IN_PROGRESS":
      return "В работе";
    case "COMPLETED":
      return "Готово";
    case "ARCHIVED":
      return "Архив";
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "text-success-600";
    case "IN_PROGRESS":
      return "text-primary-600";
    case "DRAFT":
      return "text-warning-600";
    case "ARCHIVED":
      return "text-default-500";
    default:
      return "text-default-600";
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Ограничиваем максимум TB
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(k, unitIndex);

  // Форматируем: целые числа без дробной части, дробные - с одним знаком
  return size % 1 === 0
    ? `${size} ${units[unitIndex]}`
    : `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Хук для удаления проекта
  const deleteProjectMutation = useDeleteProject();

  // Загружаем файлы проекта только когда статус COMPLETED
  const { data: projectFiles } = useGetProjectFiles(
    project.status === "COMPLETED" ? project.id : null
  );

  const handleCardClick = () => {
    navigate(`/dashboard/projects/${project.id}`);
  };

  const handleDownload = async () => {
    if (project.status !== "COMPLETED") {
      return;
    }

    if (isDownloading) {
      return;
    }

    // Ищем VM_TEMPLATE файл
    const vmTemplateFile = projectFiles?.files?.find(
      (f) => f.file_type === "VM_TEMPLATE"
    );

    if (!vmTemplateFile) {
      addToast({
        type: "error",
        title: "Ошибка скачивания",
        message: "VM Template файл не найден в проекте",
      });
      return;
    }

    try {
      setIsDownloading(true);
      await downloadFile(vmTemplateFile.id, vmTemplateFile.file_name);
    } catch (error) {
      console.error("Error downloading file:", error);
      addToast({
        type: "error",
        title: "Ошибка скачивания",
        message: "Не удалось скачать файл",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex items-center gap-4 p-4 bg-foreground-100 rounded-2xl border border-default-100 hover:border-default-200 transition-colors relative cursor-pointer"
    >
      {/* Иконка файла */}
      <div className="shrink-0 w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
        <img src={FileIcon} alt="" className="w-7 h-7" />
      </div>

      {/* Информация о проекте */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-foreground truncate">
          {project.name.length > 35
            ? `${project.name.substring(0, 35)}...`
            : project.name}
        </h3>
        <p className="text-sm text-default-500 truncate">
          {project.description && project.description.length > 30
            ? `${project.description.substring(0, 30)}...`
            : project.description}
        </p>
      </div>

      {/* Статус - по центру */}
      <div className="flex items-center gap-2 shrink-0 absolute left-1/2 transform -translate-x-1/2">
        <svg
          className={`w-5 h-5 ${getStatusColor(project.status)}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span
          className={`text-sm font-medium ${getStatusColor(project.status)}`}
        >
          {getStatusText(project.status)}
        </span>
      </div>

      {/* Размер VM файла */}
      <div className="text-sm text-default-500 shrink-0 w-20 text-right">
        {formatFileSize(project.total_size)}
      </div>

      {/* Кнопка скачивания */}
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          isIconOnly
          variant="solid"
          className="shrink-0 bg-white w-12 h-12 min-w-12 hover:bg-gray-100"
          isDisabled={project.status !== "COMPLETED" || isDownloading}
          onPress={handleDownload}
        >
          <img
            src={DownloadIcon}
            alt="Скачать"
            className={`w-6 h-6 ${
              project.status !== "COMPLETED" ? "opacity-40" : ""
            }`}
          />
        </Button>
      </div>

      {/* Кнопка меню */}
      <div onClick={(e) => e.stopPropagation()}>
        <Dropdown isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownTrigger>
            <Button isIconOnly variant="light" className="shrink-0" size="sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            onAction={(key) => {
              if (key === "delete") {
                deleteProjectMutation.mutate(project.id, {
                  onSuccess: () => {
                    setIsMenuOpen(false);
                  },
                });
              }
            }}
          >
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              startContent={
                <img src={DeleteIcon} alt="Удалить" className="w-5 h-5" />
              }
            >
              Удалить
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}
