import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProjectWithFiles } from "../api/projectsApi";
import type {
  CreateProjectWithFilesRequest,
  CreateProjectWithFilesResponse,
} from "../types/projects.types";
import { useToastStore } from "@/shared/hooks/useToast";

export const useCreateProjectWithFiles = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<
    CreateProjectWithFilesResponse,
    Error,
    CreateProjectWithFilesRequest
  >({
    mutationFn: createProjectWithFiles,
    onSuccess: () => {
      // Обновляем список проектов
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка создания проекта",
        message: error.message || "Не удалось создать проект с файлами",
      });
    },
  });
};
