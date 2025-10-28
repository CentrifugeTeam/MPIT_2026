import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/projectsApi";
import type { CreateProjectRequest, Project } from "../types/projects.types";
import { useToastStore } from "@/shared/hooks/useToast";

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<Project, Error, CreateProjectRequest>({
    mutationFn: createProject,
    onSuccess: () => {
      // Обновляем список проектов
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка создания проекта",
        message: error.message || "Не удалось создать проект",
      });
    },
  });
};
