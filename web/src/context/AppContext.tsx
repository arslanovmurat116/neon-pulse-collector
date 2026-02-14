// Контексты для управления состоянием приложения

import React, { createContext, useContext, ReactNode } from "react";

interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext должен быть использован внутри AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode] = React.useState(true); // Всегда темный режим для neon стиля

  const toggleDarkMode = () => {
    // Neon стиль работает только в темном режиме
    console.log("Темный режим всегда включен");
  };

  return (
    <AppContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </AppContext.Provider>
  );
};
