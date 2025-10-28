import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button, Card, CardBody, CardHeader } from "@heroui/react";
import { useRegister } from "@/features/auth/hooks";
import LoginIcon from "@/shared/assets/login.svg";
import LoginGradient from "@/shared/assets/login-gradient.png";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email") as string;
    const passwordValue = formData.get("password") as string;
    const confirmPasswordValue = formData.get("confirmPassword") as string;

    // Check if passwords match
    if (passwordValue !== confirmPasswordValue) {
      setPasswordsMatch(false);
      return;
    }

    setPasswordsMatch(true);

    register.mutate(
      {
        email: emailValue,
        password: passwordValue,
        confirm_password: confirmPasswordValue,
      },
      {
        onSuccess: () => {
          navigate("/login");
        },
      }
    );
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (confirmPassword && value !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (password && value !== password) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-secondary-50 via-background to-primary-50 dark:from-secondary-950 dark:via-background dark:to-primary-950">
      <Card className="relative w-full max-w-md p-8 overflow-hidden rounded-[24px]">
        <img
          src={LoginGradient}
          alt=""
          className="absolute top-0 left-0 w-full h-auto"
        />
        <CardHeader className="relative flex flex-col gap-5 items-center text-center ">
          <div className="h-[54px] w-[54px] flex items-center justify-center rounded-xl shadow-sm bg-background">
            <img src={LoginIcon} alt="Login Icon" className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold whitespace-pre-line">
              {t("auth.login.title")}
            </h1>
            <p className="text-sm font-medium whitespace-pre-line text-default-500">
              {t("auth.login.subtitle")}
            </p>
          </div>
        </CardHeader>
        <CardBody className="relative gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              size="lg"
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onValueChange={setEmail}
              isRequired
              variant="bordered"
              errorMessage={(validation) => {
                if (validation.validationDetails.valueMissing) {
                  return t("auth.login.errors.emailRequired");
                }
                if (validation.validationDetails.typeMismatch) {
                  return t("auth.login.errors.emailInvalid");
                }
              }}
            />

            <Input
              name="password"
              type="password"
              size="lg"
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onValueChange={handlePasswordChange}
              isRequired
              minLength={8}
              variant="bordered"
              errorMessage={(validation) => {
                if (validation.validationDetails.valueMissing) {
                  return t("auth.login.errors.passwordRequired");
                }
                if (validation.validationDetails.tooShort) {
                  return t("auth.login.errors.passwordMin");
                }
              }}
            />

            <Input
              name="confirmPassword"
              type="password"
              size="lg"
              placeholder={t("auth.login.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onValueChange={handleConfirmPasswordChange}
              isRequired
              isInvalid={!passwordsMatch}
              variant="bordered"
              errorMessage={(validation) => {
                if (!passwordsMatch) {
                  return t("auth.login.errors.passwordMismatch");
                }
                if (validation.validationDetails.valueMissing) {
                  return t("auth.login.errors.confirmPasswordRequired");
                }
              }}
            />

            <Button
              className="mt-5"
              type="submit"
              color="primary"
              size="lg"
              fullWidth
              isLoading={register.isPending}
            >
              {t("auth.login.signUp")}
            </Button>
          </form>

          <div className="text-center text-sm mt-4">
            <span className="text-default-500">
              {t("auth.login.hasAccount")}
            </span>
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              {t("auth.login.signIn")}
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
