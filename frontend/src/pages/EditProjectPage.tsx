import { useState, useCallback, useEffect } from "react";
import { Input, Textarea, Button } from "@heroui/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetProjectById,
  useUpdateProject,
  useCreateProjectWithFiles,
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
import { getFileTypeByExtension } from "@/features/files/utils/fileUtils";
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
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");

  // Мутации
  const updateProjectMutation = useUpdateProject();
  const uploadFileMutation = useUploadFile();
  const deleteFileMutation = useDeleteFile(projectId || "");
  const createProjectWithFilesMutation = useCreateProjectWithFiles();

  // Исходные данные для отслеживания изменений
  const [initialName, setInitialName] = useState("");
  const [initialDescription, setInitialDescription] = useState("");

  // Загружаем данные проекта в форму
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description);
      setInitialName(project.name);
      setInitialDescription(project.description);
    }
  }, [project]);

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
      setFiles((prev) => {
        // Объединяем серверные файлы с локальными (новыми)
        const localFiles = prev.filter((f) => !f.serverFileId);
        return [...serverFiles, ...localFiles];
      });
    }
  }, [projectFiles]);

  // Валидация
  const hasChanges =
    projectName !== initialName || projectDescription !== initialDescription;
  const canSave = projectName.trim().length > 0 && hasChanges;
  const canGenerate =
    projectName.trim().length > 0 &&
    files.filter((f) => f.status === "success").length >= 3;

  // Обработчик выбора файлов
  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles: LocalFile[] = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

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

  // Сохранение изменений
  const handleSave = useCallback(async () => {
    if (!canSave || !projectId) return;

    try {
      // Отправляем только измененные поля
      const updateData: { name?: string; description?: string } = {};

      if (projectName !== initialName) {
        updateData.name = projectName;
      }

      if (projectDescription !== initialDescription) {
        updateData.description = projectDescription;
      }

      await updateProjectMutation.mutateAsync({
        projectId,
        data: updateData,
      });

      addToast({
        type: "success",
        title: "Проект обновлен",
        message: "Изменения успешно сохранены",
      });

      // Обновляем исходные значения
      setInitialName(projectName);
      setInitialDescription(projectDescription);

      navigate("/dashboard/all");
    } catch (error) {
      console.error("Error updating project:", error);
    }
  }, [
    canSave,
    projectId,
    projectName,
    projectDescription,
    initialName,
    initialDescription,
    updateProjectMutation,
    addToast,
    navigate,
  ]);

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
            onPress={() => navigate("/dashboard/all")}
          >
            Отмена
          </Button>
          <Button
            variant="bordered"
            color="default"
            size="lg"
            isDisabled={!canSave}
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
          onValueChange={setProjectName}
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
          onValueChange={setProjectDescription}
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
          <FileList
            files={files}
            onRemove={handleRemoveFile}
            onAddMore={handleAddMore}
          />
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
