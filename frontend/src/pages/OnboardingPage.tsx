import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import LoginGradient from "@/shared/assets/login-gradient.png";
import { isLocalMode } from "@/shared/config/env";

const ONBOARDING_STEPS = [
  {
    title: "Знакомьтесь – мёрджер",
    description: "Простой инструмент для создания\nи объединения VM шаблонов",
    image: "/onboarding-1.png",
  },
  {
    title: "Создавайте проекты",
    description:
      "Нажмите кнопку «Создать проект»,\nзадайте название и описание",
    image: "/onboarding-2.png",
  },
  {
    title: "Загрузите файлы",
    description:
      "Нажмите кнопку «Создать проект»,\nзадайте название и описание",
    image: "/onboarding-3.png",
  },
  {
    title: "Генерация шаблонов",
    description:
      "Система автоматически обработает ваши файлы\nи создаст готовый VM шаблон",
    image: "/onboarding-4.png",
  },
  {
    title: "Готово к работе!",
    description:
      "Теперь вы можете создавать проекты,\nгенерировать шаблоны и управлять файлами",
    image: "/onboarding-5.png",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleClose = () => {
    // Сохраняем флаг, что онбординг просмотрен
    localStorage.setItem("onboarding_completed", "true");
    // Перенаправляем в зависимости от режима работы
    if (isLocalMode) {
      // В локальном режиме сразу на дашборд
      navigate("/dashboard");
    } else {
      // В облачном режиме на страницу логина
      navigate("/login");
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-primary-50 via-background to-secondary-50 dark:from-primary-950 dark:via-background dark:to-secondary-950">
      <div
        className="relative bg-white rounded-3xl overflow-hidden p-8 flex flex-col border border-default-100"
        style={{ width: "525px", height: "605px" }}
      >
        {/* Градиент внутри карточки */}
        <img
          src={LoginGradient}
          alt=""
          className="absolute top-0 left-0 w-full h-auto"
        />

        {/* Крестик закрытия */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-default-100 transition-colors text-default-500 hover:text-foreground z-10"
          aria-label="Закрыть"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Контент */}
        <div className="relative flex flex-col flex-1">
          {/* Картинка - 50% высоты */}
          <div className="flex items-center justify-center h-1/2 pt-[20px]">
            <img
              src={currentStepData.image}
              alt={currentStepData.title}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </div>

          {/* Текстовый блок - 50% высоты */}
          <div className="flex flex-col items-center text-center justify-between h-1/2 pt-6 pb-[20px]">
            {/* Индикаторы прогресса */}
            <div className="flex gap-2 mb-4">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary-500"
                      : "w-1.5 bg-default-300"
                  }`}
                />
              ))}
            </div>

            {/* Заголовок */}
            <h1 className="text-2xl font-semibold text-foreground -mb-4">
              {currentStepData.title}
            </h1>

            {/* Описание */}
            <p className="text-m text-default-500 whitespace-pre-line mb-6">
              {currentStepData.description}
            </p>

            {/* Кнопки навигации */}
            <div className="flex gap-3 w-full">
              <Button
                variant="bordered"
                color="default"
                size="md"
                className="flex-1"
                onPress={handlePrev}
                isDisabled={currentStep === 0}
                startContent={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                }
              >
                Назад
              </Button>
              <Button
                color="primary"
                variant="solid"
                size="md"
                className="flex-1"
                onPress={handleNext}
                endContent={
                  currentStep < ONBOARDING_STEPS.length - 1 ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  ) : null
                }
              >
                {currentStep < ONBOARDING_STEPS.length - 1 ? "Далее" : "Начать"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
