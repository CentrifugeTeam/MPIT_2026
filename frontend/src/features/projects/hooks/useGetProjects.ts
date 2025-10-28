import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../api/projectsApi";
import type {
  GetProjectsParams,
  ProjectsListResponse,
} from "../types/projects.types";

export const useGetProjects = (params: GetProjectsParams = {}) => {
  return useQuery<ProjectsListResponse, Error>({
    queryKey: ["projects", params],
    queryFn: () => getProjects(params),
    staleTime: 30000, // Кеш на 30 секунд
  });
};
