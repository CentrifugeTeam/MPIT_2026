import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject } from "../api/projectsApi";
import { useToastStore } from "@/shared/hooks/useToast";

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<void, Error, string>({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      // Обновляем список проектов
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      addToast({
        type: "success",
        title: "Проект удалён",
        message: "Проект успешно удалён",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка удаления проекта",
        message: error.message || "Не удалось удалить проект",
      });
    },
  });
};
