import { useState, useMemo, useEffect, useRef } from "react";
import { Spinner } from "@heroui/react";
import { useOutletContext } from "react-router-dom";
import Pagination from "@/shared/components/Pagination";
import SortDropdown from "@/shared/components/SortDropdown";
import { useGetProjects } from "@/features/projects/hooks";
import ProjectCard from "@/features/projects/components/ProjectCard";
import { useCalculateItemsPerPage } from "@/shared/hooks/useCalculateItemsPerPage";
import type {
  SortField,
  SortOrder,
} from "@/features/projects/types/projects.types";

export default function DraftsPage() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const itemsPerPage = useCalculateItemsPerPage();

  const { data, isLoading, isError, error } = useGetProjects({
    status: "DRAFT",
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
    search: searchQuery || undefined,
    sort_by: sortField,
    sort_order: sortOrder,
  });

  const totalPages = useMemo(() => {
    if (!data?.total) return 1;
    return Math.ceil(data.total / itemsPerPage);
  }, [data?.total, itemsPerPage]);

  // Сохраняем количество страниц для отображения во время загрузки
  const savedTotalPages = useRef(totalPages);

  useEffect(() => {
    if (!isLoading && data?.total !== undefined) {
      savedTotalPages.current = totalPages;
    }
  }, [isLoading, data?.total, totalPages]);

  // Во время загрузки показываем сохраненное значение, иначе актуальное
  const displayTotalPages = isLoading ? savedTotalPages.current : totalPages;

  // Корректируем текущую страницу только при изменении itemsPerPage (размера окна)
  useEffect(() => {
    const newTotalPages = data?.total
      ? Math.ceil(data.total / itemsPerPage)
      : 1;
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]); // Срабатывает только при изменении размера окна

  // Сбрасываем на первую страницу при изменении поиска или сортировки
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder]);

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex-1 flex flex-col p-6 border border-default-100 rounded-3xl self-stretch bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl leading-8 font-semibold">
          Черновики
          {data?.total !== undefined && (
            <span className="text-default-500 font-normal ml-2">
              ({data.total})
            </span>
          )}
        </h1>
        <SortDropdown
          value={{ field: sortField, order: sortOrder }}
          onChange={handleSortChange}
        />
      </div>

      {/* Контент страницы */}
      <div className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-danger-500 mb-2">Ошибка загрузки черновиков</p>
              <p className="text-default-500 text-sm">
                {error?.message || "Попробуйте перезагрузить страницу"}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && data?.projects && (
          <>
            {data.projects.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-default-500">Черновиков пока нет</p>
              </div>
            ) : (
              <>
                {/* Заголовки столбцов */}
                <div className="flex items-center px-4 mb-7 relative">
                  {/* Заголовок "Название проекта" - слева */}
                  <div className="text-left">
                    <span className="text-sm font-medium text-default-500">
                      Имя проекта
                    </span>
                  </div>

                  {/* Заголовок "Статус" - по центру */}
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <span className="text-sm font-medium text-default-500">
                      Статус
                    </span>
                  </div>

                  {/* Заголовок "Размер" - справа с отступом */}
                  <div className="ml-auto mr-24 text-right">
                    <span className="text-sm font-medium text-default-500">
                      Размер
                    </span>
                  </div>
                </div>

                {/* Список карточек */}
                <div className="flex flex-col gap-3">
                  {data.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Пагинация */}
      {!isError && displayTotalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={displayTotalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
