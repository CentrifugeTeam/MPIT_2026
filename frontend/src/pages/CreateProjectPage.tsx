import { useState, useCallback, useEffect } from "react";
import { Input, Textarea, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import {
  useCreateProject,
  useCreateProjectWithFiles,
} from "@/features/projects/hooks";
import { useUploadFile } from "@/features/files/hooks";
import {
  getFileTypeByExtension,
  validateFilesForGeneration,
  getFileExtension,
} from "@/features/files/utils/fileUtils";
import {
  FileUploadZone,
  FileList,
  GenerationProgress,
} from "@/features/files/components";
import type { LocalFile } from "@/features/files/types/files.types";
import { useToastStore } from "@/shared/hooks/useToast";

type GenerationState = "idle" | "generating" | "success";

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  // Состояние формы
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");

  // Мутации
  const createProjectMutation = useCreateProject();
  const uploadFileMutation = useUploadFile();
  const createProjectWithFilesMutation = useCreateProjectWithFiles();

  // Валидация файлов
  const successFiles = files.filter((f) => f.status === "success");
  const fileValidation = validateFilesForGeneration(
    successFiles.map((f) => f.file.name)
  );

  // Валидация формы
  const canSaveDraft = projectName.trim().length > 0;
  const canGenerate = projectName.trim().length > 0 && fileValidation.isValid;

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

  // Автоматическая загрузка файлов после выбора
  useEffect(() => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    pendingFiles.forEach(async (localFile) => {
      // Обновляем статус на uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === localFile.id
            ? { ...f, status: "uploading" as const, progress: 50 }
            : f
        )
      );

      // Для загрузки файлов нужен project_id, но мы еще не создали проект
      // Поэтому просто помечаем как успех локально
      // Файлы будут загружены при создании/генерации проекта
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === localFile.id
              ? { ...f, status: "success" as const, progress: 100 }
              : f
          )
        );
      }, 500);
    });
  }, [files]);

  // Удаление файла
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Открыть диалог выбора файлов
  const handleAddMore = useCallback(() => {
    document.getElementById("file-input-add-more")?.click();
  }, []);

  // Сохранение в черновики
  const handleSaveDraft = useCallback(async () => {
    if (!canSaveDraft) return;

    try {
      const project = await createProjectMutation.mutateAsync({
        name: projectName,
        description: projectDescription,
        status: "DRAFT",
      });

      // Загружаем файлы если есть
      const successFiles = files.filter((f) => f.status === "success");
      if (successFiles.length > 0 && project.id) {
        await Promise.all(
          successFiles.map((localFile) =>
            uploadFileMutation.mutateAsync({
              file: localFile.file,
              project_id: project.id,
              file_type: getFileTypeByExtension(localFile.file.name),
            })
          )
        );
      }

      addToast({
        type: "success",
        title: "Проект сохранен",
        message: "Проект успешно сохранен в черновики",
      });

      navigate("/dashboard/drafts");
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, [
    canSaveDraft,
    projectName,
    projectDescription,
    files,
    createProjectMutation,
    uploadFileMutation,
    addToast,
    navigate,
  ]);

  // Генерация
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    try {
      setGenerationState("generating");

      const successFiles = files.filter((f) => f.status === "success");

      // Формируем file_types через запятую
      const fileTypes = successFiles
        .map((f) => getFileTypeByExtension(f.file.name))
        .join(",");

      // Создаем проект с файлами и генерацией за один запрос
      const result = await createProjectWithFilesMutation.mutateAsync({
        name: projectName,
        description: projectDescription,
        files: successFiles.map((f) => f.file),
        file_types: fileTypes,
        generate: true, // Запускаем генерацию
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
    projectName,
    projectDescription,
    files,
    createProjectWithFilesMutation,
    navigate,
  ]);

  return (
    <div className="flex-1 flex flex-col p-6 border border-default-100 rounded-3xl self-stretch bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl leading-8 font-semibold">Создание проекта</h1>
        <div className="flex gap-3">
          <Button
            variant="bordered"
            color="default"
            size="lg"
            isDisabled={!canSaveDraft}
            onPress={handleSaveDraft}
            isLoading={createProjectMutation.isPending}
          >
            В черновики
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
