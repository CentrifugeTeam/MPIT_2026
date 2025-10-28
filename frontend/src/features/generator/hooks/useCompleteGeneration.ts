import { useMutation } from "@tanstack/react-query";
import { completeGeneration } from "../api/generatorApi";
import type {
  GenerateRequest,
  GenerateResponse,
} from "../types/generator.types";
import { useToastStore } from "@/shared/hooks/useToast";

export const useCompleteGeneration = () => {
  const addToast = useToastStore((state) => state.addToast);

  return useMutation<GenerateResponse, Error, GenerateRequest>({
    mutationFn: completeGeneration,
    onError: (error) => {
      addToast({
        type: "error",
        title: "Ошибка генерации",
        message: error.message || "Не удалось сгенерировать шаблон",
      });
    },
  });
};
