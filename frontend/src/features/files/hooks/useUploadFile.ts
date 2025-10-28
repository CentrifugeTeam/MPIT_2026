import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "../api/filesApi";
import type { UploadFileRequest, FileInfo } from "../types/files.types";
import { useToastStore } from "@/shared/hooks/useToast";

export const useUploadFile = () => {
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<FileInfo, Error, UploadFileRequest>({
    mutationFn: uploadFile,
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка загрузки файла",
        message: error.message || "Не удалось загрузить файл",
      });
    },
  });
};
