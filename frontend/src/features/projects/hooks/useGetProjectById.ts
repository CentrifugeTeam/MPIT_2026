import { useQuery } from "@tanstack/react-query";
import { getProjectById } from "../api/projectsApi";
import type { Project } from "../types/projects.types";

export const useGetProjectById = (projectId: string | null) => {
  return useQuery<Project, Error>({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId!),
    enabled: !!projectId,
    staleTime: 30000,
  });
};
