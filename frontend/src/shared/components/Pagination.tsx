interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages + 2) {
      // Показываем все страницы, если их мало
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Логика с многоточием
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
      
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
      
      // Всегда показываем первую страницу
      pages.push(1);
      
      if (shouldShowLeftDots) {
        pages.push("...");
      }
      
      // Показываем страницы вокруг текущей
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (shouldShowRightDots) {
        pages.push("...");
      }
      
      // Всегда показываем последнюю страницу
      if (totalPages !== 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-2 bg-[#F4F4F5] rounded-[20px] px-3 py-2">
      {/* Кнопка "Назад" */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Номера страниц */}
      {pageNumbers.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`dots-${index}`}
              className="w-10 h-10 flex items-center justify-center text-gray-500"
            >
              •••
            </span>
          );
        }

        const isActive = page === currentPage;
        
        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`
              w-10 h-10 flex items-center justify-center rounded-xl font-medium transition-colors
              ${
                isActive
                  ? "bg-[#006FEE] text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Кнопка "Вперед" */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

