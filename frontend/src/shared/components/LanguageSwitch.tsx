import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "../../store/languageStore";

export default function LanguageSwitch() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    const newLanguage = language === "ru" ? "en" : "ru";
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Button variant="flat" color="primary" onPress={toggleLanguage} size="sm">
      {language === "ru" ? "🇬🇧 EN" : "🇷🇺 RU"}
    </Button>
  );
}
