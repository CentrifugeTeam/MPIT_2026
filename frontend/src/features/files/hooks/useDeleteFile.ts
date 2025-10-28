import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "../api/filesApi";
import { useToastStore } from "@/shared/hooks/useToast";

export const useDeleteFile = (projectId: string) => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteFile,
    onSuccess: () => {
      // Обновляем список файлов проекта
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      addToast({
        type: "success",
        title: "Файл удален",
        message: "Файл успешно удален",
      });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка удаления",
        message: error.message || "Не удалось удалить файл",
      });
    },
  });
};
