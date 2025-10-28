import { useState } from "react";
import PlusIcon from "@/shared/assets/add-project.svg";
import AllProjectsIcon from "@/shared/assets/all-projects.svg";
import DraftsIcon from "@/shared/assets/file.svg";
import DeletedIcon from "@/shared/assets/delete.svg";
import SearchIcon from "@/shared/assets/search.svg";
import CloudIcon from "@/shared/assets/cloud-text.svg";
import BellIcon from "@/shared/assets/bell.svg";
import SettingsIcon from "@/shared/assets/settings.svg";
import HelpIcon from "@/shared/assets/support.svg";
import { Button } from "@heroui/button";
import { Divider, Input } from "@heroui/react";
import { useUserStore } from "@/store/userStore";
import { NavLink, Outlet } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-primary-100 via-default-50 to-secondary-100 dark:from-primary-950 dark:via-background dark:to-secondary-950">
      {/* Header */}
      <header className="flex items-center px-6 pt-5">
        {/* Лого и текст слева */}
        <div className="flex items-center ml-3">
          <img src={CloudIcon} alt="" className="w-full h-full" />
        </div>

        {/* Поиск по центру */}
        <div className="flex-1 ml-8">
          <Input
            placeholder="Поиск проектов по названию..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            isClearable
            onClear={() => setSearchQuery("")}
            startContent={<img src={SearchIcon} alt="" className="w-5 h-5" />}
            classNames={{
              input: "text-sm",
              inputWrapper:
                "h-12 !bg-white hover:!bg-white focus-within:!bg-white active:!bg-white data-[hover=true]:!bg-white rounded-[13.8px]",
            }}
          />
        </div>

        {/* Колокольчик и имя пользователя справа */}
        <div className="flex items-center gap-2 ml-2">
          <Button
            isIconOnly
            color="default"
            variant="flat"
            className="w-[46px] h-[46px] min-w-[46px] rounded-[13.8px] bg-white hover:bg-gray-200"
          >
            <img src={BellIcon} alt="" className="w-5 h-5" />
          </Button>

          <Button
            isIconOnly
            color="primary"
            className="w-[46px] h-[46px] min-w-[46px] rounded-[13.8px] hover:opacity-90"
          >
            {user?.email?.slice(0, 2).toUpperCase() || "??"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 p-6 gap-6">
        <div className="w-[287px] flex flex-col p-6 border border-default-100 rounded-3xl self-stretch gap-5 bg-white">
          <NavLink to="/dashboard/create">
            <Button
              color="primary"
              startContent={<img src={PlusIcon} alt="" className="w-4 h-4" />}
              className="gap-2 w-full"
              size="lg"
            >
              Создать проект
            </Button>
          </NavLink>
          <div className="flex flex-col gap-2">
            <NavLink to="/dashboard/all">
              {({ isActive }) => (
                <Button
                  startContent={
                    <img
                      src={AllProjectsIcon}
                      alt=""
                      className="w-4 h-4"
                      style={{
                        filter: isActive
                          ? "brightness(0) saturate(100%) invert(58%) sepia(93%) saturate(1352%) hue-rotate(189deg) brightness(98%) contrast(88%)"
                          : "brightness(0) saturate(100%) invert(42%) sepia(6%) saturate(573%) hue-rotate(182deg) brightness(96%) contrast(88%)",
                      }}
                    />
                  }
                  variant={isActive ? "flat" : "light"}
                  color={isActive ? "primary" : "default"}
                  className="pl-3 gap-2 justify-start w-full"
                >
                  Все проекты
                </Button>
              )}
            </NavLink>
            <NavLink to="/dashboard/drafts">
              {({ isActive }) => (
                <Button
                  startContent={
                    <img
                      src={DraftsIcon}
                      alt=""
                      className="w-4 h-4"
                      style={{
                        filter: isActive
                          ? "brightness(0) saturate(100%) invert(58%) sepia(93%) saturate(1352%) hue-rotate(189deg) brightness(98%) contrast(88%)"
                          : "brightness(0) saturate(100%) invert(42%) sepia(6%) saturate(573%) hue-rotate(182deg) brightness(96%) contrast(88%)",
                      }}
                    />
                  }
                  variant={isActive ? "flat" : "light"}
                  color={isActive ? "primary" : "default"}
                  className="pl-3 gap-2 justify-start w-full"
                >
                  Черновики
                </Button>
              )}
            </NavLink>
            <NavLink to="/dashboard/deleted">
              {({ isActive }) => (
                <Button
                  startContent={
                    <img
                      src={DeletedIcon}
                      alt=""
                      className="w-4 h-4"
                      style={{
                        filter: isActive
                          ? "brightness(0) saturate(100%) invert(58%) sepia(93%) saturate(1352%) hue-rotate(189deg) brightness(98%) contrast(88%)"
                          : "brightness(0) saturate(100%) invert(42%) sepia(6%) saturate(573%) hue-rotate(182deg) brightness(96%) contrast(88%)",
                      }}
                    />
                  }
                  variant={isActive ? "flat" : "light"}
                  color={isActive ? "primary" : "default"}
                  className="pl-3 gap-2 justify-start w-full"
                >
                  Удаленные
                </Button>
              )}
            </NavLink>
          </div>
          <Divider />
          <Button
            startContent={<img src={SettingsIcon} alt="" className="w-4 h-4" />}
            className="pl-3 gap-2 justify-start"
            variant="light"
          >
            Настройки
          </Button>
          <Divider />
          <Button
            startContent={<img src={HelpIcon} alt="" className="w-4 h-4" />}
            className="pl-3 gap-2 justify-start"
            variant="light"
          >
            Помощь
          </Button>
        </div>
        <Outlet context={{ searchQuery }} />
      </div>
    </div>
  );
}
