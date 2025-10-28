import apiClient from "@/shared/api/axios";
import type {
  GenerateRequest,
  GenerateResponse,
} from "../types/generator.types";

const GENERATOR_BASE_URL = "/generator";

/**
 * Выполнить полную генерацию VM шаблона
 */
export const completeGeneration = async (
  data: GenerateRequest
): Promise<GenerateResponse> => {
  const response = await apiClient.post<GenerateResponse>(
    `${GENERATOR_BASE_URL}/api/complete/generate`,
    data
  );
  return response.data;
};
