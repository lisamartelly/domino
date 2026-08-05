import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  getRegistrationStatus,
  setRegistrationStatus as apiSetRegistrationStatus,
} from "../services/api";

interface AppSettingsContextType {
  registrationEnabled: boolean;
  registrationLoaded: boolean;
  setRegistrationEnabled: (enabled: boolean) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined
);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [registrationEnabled, setRegEnabled] = useState(true);
  const [registrationLoaded, setRegistrationLoaded] = useState(false);

  useEffect(() => {
    getRegistrationStatus()
      .then((data) => setRegEnabled(data.registrationEnabled))
      .catch(() => {})
      .finally(() => setRegistrationLoaded(true));
  }, []);

  const setRegistrationEnabled = useCallback(async (enabled: boolean) => {
    const result = await apiSetRegistrationStatus(enabled);
    setRegEnabled(result.registrationEnabled);
  }, []);

  const value = useMemo<AppSettingsContextType>(
    () => ({ registrationEnabled, registrationLoaded, setRegistrationEnabled }),
    [registrationEnabled, registrationLoaded, setRegistrationEnabled]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}
