import { useTranslation } from "react-i18next";
import { useLanguageStore } from "../../store/languageStore";

export const useLanguage = () => {
  const { i18n, t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const changeLanguage = (newLanguage: "en" | "ru") => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return {
    language,
    changeLanguage,
    t,
    i18n,
  };
};
