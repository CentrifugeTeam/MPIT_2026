import { useQuery } from "@tanstack/react-query";
import { getProjectFiles } from "../api/filesApi";
import type { FileListResponse } from "../types/files.types";

export const useGetProjectFiles = (projectId: string | null) => {
  return useQuery<FileListResponse, Error>({
    queryKey: ["project-files", projectId],
    queryFn: () => getProjectFiles(projectId!),
    enabled: !!projectId,
    staleTime: 30000,
  });
};
