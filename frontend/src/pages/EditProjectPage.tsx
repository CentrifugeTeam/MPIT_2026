import { useState, useCallback, useEffect } from "react";
import { Input, Textarea, Button } from "@heroui/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetProjectById,
  useCreateProjectWithFiles,
  useUpdateProject,
} from "@/features/projects/hooks";
import {
  useUploadFile,
  useGetProjectFiles,
  useDeleteFile,
} from "@/features/files/hooks";
import {
  FileUploadZone,
  FileList,
  GenerationProgress,
} from "@/features/files/components";
import {
  getFileTypeByExtension,
  validateFilesForGeneration,
  getFileExtension,
  compareFileSets,
  type FileForComparison,
} from "@/features/files/utils/fileUtils";
import type { LocalFile } from "@/features/files/types/files.types";
import { useToastStore } from "@/shared/hooks/useToast";

type GenerationState = "idle" | "generating" | "success";

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  // Загрузка данных проекта
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
  } = useGetProjectById(projectId || null);
  const { data: projectFiles } = useGetProjectFiles(projectId || null);

  // Состояние формы
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [originalFiles, setOriginalFiles] = useState<FileForComparison[]>([]);
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [hasFileChanges, setHasFileChanges] = useState(false);
  const [hasMetadataChanges, setHasMetadataChanges] = useState(false);

  // Мутации
  const uploadFileMutation = useUploadFile();
  const deleteFileMutation = useDeleteFile(projectId || "");
  const createProjectWithFilesMutation = useCreateProjectWithFiles();
  const updateProjectMutation = useUpdateProject();

  // Загружаем данные проекта в форму
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description);
    }
  }, [project]);

  // Обработчики изменений названия и описания
  const handleNameChange = useCallback((value: string) => {
    setProjectName(value);
    setHasMetadataChanges(true);
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setProjectDescription(value);
    setHasMetadataChanges(true);
  }, []);

  // Преобразуем файлы с сервера в LocalFile для отображения
  useEffect(() => {
    if (projectFiles?.files) {
      // Фильтруем файлы: исключаем VM_TEMPLATE
      const serverFiles: LocalFile[] = projectFiles.files
        .filter((file) => file.file_type !== "VM_TEMPLATE")
        .map((file) => ({
          id: file.id,
          file: new File([], file.file_name, { type: file.mime_type }),
          progress: 100,
          status: "success",
          serverFileId: file.id,
        }));

      // Сохраняем оригинальные файлы для сравнения
      const originalFilesForComparison: FileForComparison[] = serverFiles.map(file => ({
        name: file.file.name,
        type: getFileTypeByExtension(file.file.name),
        serverFileId: file.serverFileId,
      }));
      setOriginalFiles(originalFilesForComparison);

      setFiles((prev) => {
        // Объединяем серверные файлы с локальными (новыми)
        const localFiles = prev.filter((f) => !f.serverFileId);
        return [...serverFiles, ...localFiles];
      });
    }
  }, [projectFiles]);

  // Валидация файлов
  const successFiles = files.filter((f) => f.status === "success");
  const fileValidation = validateFilesForGeneration(
    successFiles.map((f) => f.file.name)
  );

  // Автоматическая проверка изменений файлов
  useEffect(() => {
    if (originalFiles.length > 0) {
      const currentFiles: FileForComparison[] = successFiles.map(file => ({
        name: file.file.name,
        type: getFileTypeByExtension(file.file.name),
        serverFileId: file.serverFileId,
      }));

      const hasChanges = compareFileSets(originalFiles, currentFiles);
      setHasFileChanges(hasChanges);
    }
  }, [files, originalFiles, successFiles]);

  // Валидация формы
  // Для черновиков кнопка генерации активна если есть валидные файлы, для остальных - только при изменениях
  const canGenerate = projectName.trim().length > 0 && fileValidation.isValid &&
    (project?.status === "DRAFT" || hasFileChanges);

  // Обработчик выбора файлов
  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      // Проверяем конфликты с уже загруженными файлами
      const currentFileNames = files.map((f) => f.file.name);
      const newFileNames = selectedFiles.map((f) => f.name);
      const allFileNames = [...currentFileNames, ...newFileNames];

      // Проверяем, есть ли и XSD, и XML одновременно
      const extensions = allFileNames.map(getFileExtension);
      const hasXsd = extensions.some((ext) => ext === "xsd");
      const hasXml = extensions.some((ext) => ext === "xml");

      if (hasXsd && hasXml) {
        addToast({
          type: "error",
          title: "Ошибка загрузки",
          message:
            "Можно загрузить либо XSD, либо XML файл, но не оба одновременно",
        });
        return;
      }

      const newFiles: LocalFile[] = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "pending",
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files, addToast]
  );

  // Автоматическая загрузка новых файлов
  useEffect(() => {
    if (!projectId) return;

    const pendingFiles = files.filter((f) => f.status === "pending");

    pendingFiles.forEach(async (localFile) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === localFile.id
            ? { ...f, status: "uploading" as const, progress: 50 }
            : f
        )
      );

      try {
        const uploadedFile = await uploadFileMutation.mutateAsync({
          file: localFile.file,
          project_id: projectId,
          file_type: getFileTypeByExtension(localFile.file.name),
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === localFile.id
              ? {
                  ...f,
                  status: "success" as const,
                  progress: 100,
                  serverFileId: uploadedFile.id,
                }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === localFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: err instanceof Error ? err.message : "Ошибка загрузки",
                }
              : f
          )
        );
      }
    });
  }, [files, projectId, uploadFileMutation]);

  // Удаление файла
  const handleRemoveFile = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId);

      if (file?.serverFileId) {
        // Удаляем с сервера
        try {
          await deleteFileMutation.mutateAsync(file.serverFileId);
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }

      // Удаляем из UI
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    [files, deleteFileMutation]
  );

  // Открыть диалог выбора файлов
  const handleAddMore = useCallback(() => {
    document.getElementById("file-input-add-more")?.click();
  }, []);

  // Сохранение изменений названия и описания
  const handleSave = useCallback(async () => {
    if (!projectId || !hasMetadataChanges) return;

    try {
      console.log("🔧 Updating project:", {
        projectId,
        name: projectName,
        description: projectDescription,
      });

      await updateProjectMutation.mutateAsync({
        projectId: projectId,
        data: {
          name: projectName,
          description: projectDescription,
        },
      });

      setHasMetadataChanges(false);
      addToast({
        type: "success",
        title: "Проект обновлен",
        message: "Название и описание проекта успешно сохранены",
      });
    } catch (error) {
      console.error("Error updating project:", error);
    }
  }, [projectId, hasMetadataChanges, projectName, projectDescription, updateProjectMutation, addToast]);

  // Генерация
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !projectId) return;

    try {
      setGenerationState("generating");

      const successFiles = files.filter((f) => f.status === "success");

      // Формируем file_types через запятую
      const fileTypes = successFiles
        .map((f) => getFileTypeByExtension(f.file.name))
        .join(",");

      // Создаем новую версию проекта с генерацией
      // Примечание: для редактирования может понадобиться другой эндпоинт
      const result = await createProjectWithFilesMutation.mutateAsync({
        name: projectName,
        description: projectDescription,
        files: successFiles.map((f) => f.file),
        file_types: fileTypes,
        generate: true,
      });

      // Переходим на страницу просмотра проекта
      if (result.generation?.success && result.generation.template_file_id) {
        const templateFile = result.project.files.find(
          (f) => f.id === result.generation?.template_file_id
        );

        // Переходим на страницу просмотра с данными о файле
        navigate(`/dashboard/projects/${result.project.id}`, {
          state: {
            templateFileId: result.generation.template_file_id,
            generatedFileName:
              templateFile?.file_name || "generated_template.vm",
          },
        });
      } else {
        throw new Error("Шаблон не был сгенерирован");
      }
    } catch (error) {
      console.error("Error generating:", error);
      setGenerationState("idle");
    }
  }, [
    canGenerate,
    projectId,
    projectName,
    projectDescription,
    files,
    createProjectWithFilesMutation,
    navigate,
  ]);

  if (projectLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-default-500">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-danger-500">Проект не найден</p>
          <Button
            color="primary"
            variant="solid"
            className="mt-4"
            onPress={() => navigate("/dashboard/all")}
          >
            Вернуться к проектам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 border border-default-100 rounded-3xl self-stretch bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl leading-8 font-semibold">
          Редактирование проекта
        </h1>
        <div className="flex gap-3">
          <Button
            variant="bordered"
            color="default"
            size="lg"
            onPress={() => navigate(`/dashboard/projects/${projectId}`)}
          >
            Отмена
          </Button>
          <Button
            variant="bordered"
            color="primary"
            size="lg"
            isDisabled={!hasMetadataChanges || updateProjectMutation.isPending}
            onPress={handleSave}
            isLoading={updateProjectMutation.isPending}
          >
            Сохранить
          </Button>
          <Button
            color="primary"
            variant="solid"
            size="lg"
            isDisabled={!canGenerate || generationState !== "idle"}
            onPress={handleGenerate}
            isLoading={generationState === "generating"}
          >
            Сгенерировать
          </Button>
        </div>
      </div>

      {/* Форма */}
      <div className="space-y-6">
        {/* Название проекта */}
        <Input
          label="Введите название проекта"
          placeholder="Введите название проекта"
          value={projectName}
          onValueChange={handleNameChange}
          maxLength={50}
          description={`Макс 50 символов`}
          classNames={{
            input: "text-base",
            inputWrapper: "h-14",
          }}
        />

        {/* Описание проекта */}
        <Textarea
          label="Введите описание проекта"
          placeholder="Введите описание проекта"
          value={projectDescription}
          onValueChange={handleDescriptionChange}
          maxLength={250}
          description={`Максимум 250 символов`}
          minRows={4}
          classNames={{
            input: "text-base",
          }}
        />

        {/* Загрузка файлов / Список файлов / Состояние генерации */}
        {generationState === "generating" ? (
          <GenerationProgress />
        ) : files.length === 0 ? (
          <FileUploadZone onFilesSelected={handleFilesSelected} />
        ) : (
          <>
            <FileList
              files={files}
              onRemove={handleRemoveFile}
              onAddMore={handleAddMore}
              isAddMoreDisabled={fileValidation.isValid}
            />

            {/* Ошибки валидации файлов */}
            {!fileValidation.isValid && successFiles.length > 0 && (
              <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
                <p className="text-sm font-medium text-danger-700 mb-2">
                  Требования к файлам:
                </p>
                <ul className="text-sm text-danger-600 space-y-1">
                  {fileValidation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Скрытый input для "Добавить ещё" */}
        <input
          id="file-input-add-more"
          type="file"
          multiple
          accept=".json,.txt,.xml,.xsd"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesSelected(Array.from(e.target.files));
            }
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
