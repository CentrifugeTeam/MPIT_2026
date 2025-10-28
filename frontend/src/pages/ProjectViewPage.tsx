import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useGetProjectById, useDeleteProject } from "@/features/projects/hooks";
import { useGetProjectFiles } from "@/features/files/hooks";
import { GenerationSuccess } from "@/features/files/components";
import { downloadFile } from "@/features/files/api/filesApi";
import { useToastStore } from "@/shared/hooks/useToast";
import DeleteIcon from "@/shared/assets/delete.svg";

export default function ProjectViewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToastStore((state) => state.addToast);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Хук для удаления проекта
  const deleteProjectMutation = useDeleteProject();

  // Загрузка данных проекта
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
  } = useGetProjectById(projectId || null);

  // Загрузка файлов проекта
  const { data: projectFiles } = useGetProjectFiles(projectId || null);

  // Определяем templateFileId, имя файла и template содержимое
  const { templateFileId, generatedFileName, templateContent } = useMemo(() => {
    // Сначала проверяем state (если пришли с генерации)
    const stateFileId = location.state?.templateFileId as string | undefined;
    const stateFileName = location.state?.generatedFileName as
      | string
      | undefined;
    // Если state пустой, ищем VM_TEMPLATE файл среди файлов проекта
    if (projectFiles?.files) {
      const vmTemplateFile = projectFiles.files.find(
        (f) => f.file_type === "VM_TEMPLATE"
      );

      if (vmTemplateFile) {
        return {
          templateFileId: vmTemplateFile.id,
          generatedFileName: vmTemplateFile.file_name,
          templateContent: vmTemplateFile.template,
        };
      }
    }

    // Если файл не найден в списке, но есть в state (крайний случай)
    if (stateFileId) {
      return {
        templateFileId: stateFileId,
        generatedFileName: stateFileName || "generated_template.vm",
        templateContent: undefined,
      };
    }

    return {
      templateFileId: undefined,
      generatedFileName: "generated_template.vm",
      templateContent: undefined,
    };
  }, [location.state, projectFiles]);

  // Предпросмотр кода
  const handlePreview = useCallback(() => {
    if (templateContent) {
      setIsPreviewOpen(true);
    } else {
      addToast({
        type: "error",
        title: "Ошибка предпросмотра",
        message: "Содержимое шаблона недоступно",
      });
    }
  }, [templateContent, addToast]);

  // Скачать файл
  const handleDownload = useCallback(async () => {
    if (!templateFileId) return;

    try {
      await downloadFile(templateFileId, generatedFileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      addToast({
        type: "error",
        title: "Ошибка скачивания",
        message: "Не удалось скачать файл",
      });
    }
  }, [templateFileId, generatedFileName, addToast]);

  // Скопировать код
  const handleCopy = useCallback(async () => {
    if (!templateContent) return;

    try {
      await navigator.clipboard.writeText(templateContent);
      setIsCopied(true);
      addToast({
        type: "success",
        title: "Скопировано",
        message: "Код скопирован в буфер обмена",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Error copying code:", error);
      addToast({
        type: "error",
        title: "Ошибка копирования",
        message: "Не удалось скопировать код",
      });
    }
  }, [templateContent, addToast]);

  // Удалить проект
  const handleDeleteProject = useCallback(() => {
    if (!projectId) return;

    deleteProjectMutation.mutate(projectId, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        navigate("/dashboard/all");
      },
    });
  }, [projectId, deleteProjectMutation, navigate]);

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
        <h1 className="text-2xl leading-8 font-semibold">{project.name}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="light"
            color="default"
            onPress={() => navigate(`/dashboard/projects/${projectId}/edit`)}
          >
            Редактировать проект
          </Button>
          <Button
            isIconOnly
            variant="bordered"
            color="danger"
            onPress={() => setIsDeleteModalOpen(true)}
            className="w-10 h-10 min-w-10"
          >
            <img src={DeleteIcon} alt="Удалить проект" className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Описание проекта */}
      {project.description && (
        <div className="mb-6">
          <p className="text-base text-foreground whitespace-pre-wrap">
            {project.description}
          </p>
        </div>
      )}

      {/* Компонент успешной генерации */}
      {templateFileId ? (
        <GenerationSuccess
          onPreview={handlePreview}
          onDownload={handleDownload}
        />
      ) : (
        <div className="border-2 border-dashed border-default-300 rounded-2xl p-12 flex flex-col items-center justify-center">
          <p className="text-default-500">
            Генерация не была выполнена для этого проекта
          </p>
        </div>
      )}

      {/* Модальное окно предпросмотра кода */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          closeButton: "text-2xl w-10 h-10 right-4 top-4",
        }}
      >
        <ModalContent className="rounded-3xl">
          <ModalHeader className="flex flex-col gap-1">
            Предпросмотр: {generatedFileName}
          </ModalHeader>
          <ModalBody>
            <pre className="bg-default-100 p-4 rounded-3xl overflow-auto text-sm">
              <code>{templateContent}</code>
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant={isCopied ? "solid" : "bordered"}
              onPress={handleCopy}
            >
              {isCopied ? "Скопировано!" : "Скопировать"}
            </Button>
            <Button color="primary" onPress={handleDownload}>
              Скачать файл
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="sm"
        classNames={{
          closeButton: "text-2xl w-10 h-10 right-4 top-4",
        }}
      >
        <ModalContent className="rounded-3xl">
          <ModalHeader className="flex flex-col gap-1">
            Удалить проект?
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Вы уверены, что хотите удалить проект "{project.name}"? Это
              действие нельзя будет отменить.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setIsDeleteModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteProject}
              isLoading={deleteProjectMutation.isPending}
            >
              Удалить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
