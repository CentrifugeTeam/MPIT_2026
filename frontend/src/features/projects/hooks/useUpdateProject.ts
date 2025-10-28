import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject } from "../api/projectsApi";
import type { UpdateProjectRequest, Project } from "../types/projects.types";
import { useToastStore } from "@/shared/hooks/useToast";

interface UpdateProjectParams {
  projectId: string;
  data: UpdateProjectRequest;
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<Project, Error, UpdateProjectParams>({
    mutationFn: ({ projectId, data }) => updateProject(projectId, data),
    onSuccess: (_, variables) => {
      // Обновляем список проектов и конкретный проект
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка обновления проекта",
        message: error.message || "Не удалось обновить проект",
      });
    },
  });
};
