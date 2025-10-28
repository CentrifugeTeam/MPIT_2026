import { useQuery } from "@tanstack/react-query";
import { getProjectMappings } from "../api/projectsApi";

/**
 * Хук для получения маппингов проекта
 */
export const useGetProjectMappings = (projectId: string | null, projectStatus?: string) => {
  return useQuery({
    queryKey: ["projectMappings", projectId],
    queryFn: () => getProjectMappings(projectId!),
    enabled: !!projectId && projectStatus !== "DRAFT",
  });
};
