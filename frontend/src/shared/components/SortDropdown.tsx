import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import FilterIcon from "@/shared/assets/filter.svg";
import type {
  SortField,
  SortOrder,
} from "@/features/projects/types/projects.types";

interface SortOption {
  field: SortField;
  label: string;
  order: SortOrder;
}

interface SortDropdownProps {
  value: { field: SortField; order: SortOrder };
  onChange: (field: SortField, order: SortOrder) => void;
}

const sortOptions: SortOption[] = [
  { field: "created_at", label: "Дата создания", order: "desc" },
  { field: "total_size", label: "Размер файла", order: "desc" },
  { field: "name", label: "Имя файла", order: "asc" },
  { field: "status", label: "Статус", order: "asc" },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionClick = (option: SortOption) => {
    // Если выбран тот же field, меняем направление
    if (value.field === option.field) {
      onChange(option.field, value.order === "asc" ? "desc" : "asc");
    } else {
      // Иначе устанавливаем новый field с дефолтным направлением
      onChange(option.field, option.order);
    }
  };

  const getOrderIcon = (field: SortField) => {
    if (value.field === field) {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {value.order === "asc" ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          )}
        </svg>
      );
    }
    return null;
  };

  const currentLabel =
    sortOptions.find((opt) => opt.field === value.field)?.label || "Фильтры";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        startContent={<img src={FilterIcon} alt="" className="w-4 h-4" />}
        endContent={
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        }
        variant="flat"
        className="bg-zinc-100 hover:bg-zinc-200 text-foreground"
        onPress={() => setIsOpen(!isOpen)}
      >
        {currentLabel}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-default-200 z-50">
          <div className="p-2">
            {sortOptions.map((option) => (
              <button
                key={option.field}
                onClick={() => handleOptionClick(option)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-default-100 transition-colors ${
                  value.field === option.field ? "bg-default-100" : ""
                }`}
              >
                <span
                  className={`text-base ${
                    value.field === option.field
                      ? "font-semibold text-foreground"
                      : "text-default-600"
                  }`}
                >
                  {option.label}
                </span>
                {value.field === option.field && (
                  <div className="flex items-center gap-2">
                    {getOrderIcon(option.field)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
