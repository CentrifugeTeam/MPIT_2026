import { useState, useEffect } from "react";

/**
 * Хук для автоматического расчета количества элементов на странице
 * в зависимости от высоты экрана (без скролла)
 */
export function useCalculateItemsPerPage() {
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const calculateItems = () => {
      // Высота окна
      const windowHeight = window.innerHeight;

      // Фиксированные элементы страницы:
      // - padding страницы (p-6): 24px * 2 = 48px
      // - заголовок с кнопкой: ~64px
      // - отступ после заголовка (mb-4): 16px
      // - пагинация: ~48px
      // - отступ перед пагинацией (mt-6): 24px
      const FIXED_HEIGHT = 48 + 64 + 16 + 48 + 24; // 200px

      // Высота одной карточки проекта:
      // - padding (p-4): 16px * 2 = 32px
      // - контент: ~56px
      // - итого: ~88px
      const CARD_HEIGHT = 88;

      // Отступ между карточками (gap-3)
      const GAP = 12;

      // Доступная высота для карточек
      const availableHeight = windowHeight - FIXED_HEIGHT;

      // Рассчитываем количество карточек
      // Учитываем, что последняя карточка не имеет gap после себя
      const calculatedItems = Math.floor(
        (availableHeight + GAP) / (CARD_HEIGHT + GAP)
      );

      // Вычитаем 1 для запаса и гарантии отсутствия скролла
      // Минимум 4 элемента, максимум 19 (для очень больших экранов)
      const items = Math.max(4, Math.min(calculatedItems - 1, 19));

      setItemsPerPage(items);
    };

    // Рассчитываем при монтировании
    calculateItems();

    // Пересчитываем при изменении размера окна
    window.addEventListener("resize", calculateItems);

    return () => {
      window.removeEventListener("resize", calculateItems);
    };
  }, []);

  return itemsPerPage;
}
