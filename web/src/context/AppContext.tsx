import React, { createContext, useContext, ReactNode } from "react";

interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode] = React.useState(true);

  const toggleDarkMode = () => {
    console.log("Dark mode is always enabled");
  };

  return <AppContext.Provider value={{ isDarkMode, toggleDarkMode }}>{children}</AppContext.Provider>;
};
