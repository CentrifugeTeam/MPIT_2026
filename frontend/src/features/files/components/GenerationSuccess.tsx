import { Button } from "@heroui/button";

interface GenerationSuccessProps {
  onPreview: () => void;
  onDownload: () => void;
}

export default function GenerationSuccess({
  onPreview,
  onDownload,
}: GenerationSuccessProps) {
  return (
    <div className="border-2 border-dashed border-default-300 rounded-2xl p-12 flex flex-col items-center justify-center gap-6">
      {/* Иконка успеха */}
      <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center">
        <svg
          className="w-10 h-10 text-success-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Текст */}
      <div className="text-center">
        <p className="text-xl font-semibold text-foreground mb-2">
          Файл успешно сгенерирован
        </p>
        <p className="text-sm text-default-500">
          Скачайте файл или нажмите кнопку предпросмотра кода
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        <Button
          variant="bordered"
          color="default"
          size="lg"
          onPress={onPreview}
        >
          Предпросмотр кода
        </Button>
        <Button color="primary" variant="solid" size="lg" onPress={onDownload}>
          Скачать файл
        </Button>
      </div>
    </div>
  );
}
