import { CircularProgress } from "@heroui/react";

export default function GenerationProgress() {
  return (
    <div className="border-2 border-dashed border-default-300 rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
      {/* Спиннер */}
      <CircularProgress
        size="lg"
        color="primary"
        aria-label="Генерация файла"
        classNames={{
          svg: "w-20 h-20",
        }}
      />

      {/* Текст */}
      <div className="text-center">
        <p className="text-xl font-semibold text-foreground mb-2">
          Идёт генерация файла...
        </p>
        <p className="text-sm text-default-500">
          Формируем готовый код для скачивания,
          <br />
          пожалуйста подождите
        </p>
      </div>
    </div>
  );
}
