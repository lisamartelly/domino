import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Login from "./Login";
import { RegisterForm } from "./RegisterForm";
import { useAppSettings } from "../contexts/AppSettingsContext";

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const { registrationEnabled, registrationLoaded } = useAppSettings();

  const initialView =
    registrationLoaded && registrationEnabled && searchParams.get("view") === "register"
      ? "register"
      : "login";
  const [currentView, setCurrentView] = useState<"login" | "register">(initialView);

  useEffect(() => {
    if (registrationLoaded && registrationEnabled && searchParams.get("view") === "register") {
      setCurrentView("register");
    }
  }, [registrationLoaded, registrationEnabled, searchParams]);

  useEffect(() => {
    const handleSwitchToLogin = () => setCurrentView("login");
    const handleSwitchToRegister = () => {
      if (registrationEnabled) setCurrentView("register");
    };

    window.addEventListener("switchToLogin", handleSwitchToLogin);
    window.addEventListener("switchToRegister", handleSwitchToRegister);

    return () => {
      window.removeEventListener("switchToLogin", handleSwitchToLogin);
      window.removeEventListener("switchToRegister", handleSwitchToRegister);
    };
  }, [registrationEnabled]);

  if (!registrationLoaded) {
    return <Login showRegisterLink={false} />;
  }

  return (
    <>
      {currentView === "login" || !registrationEnabled ? (
        <Login showRegisterLink={registrationEnabled} />
      ) : (
        <RegisterForm />
      )}
      {registrationEnabled && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={() =>
              setCurrentView(currentView === "login" ? "register" : "login")
            }
            className="bg-cream-50 hover:bg-cream-100 text-charcoal-900 font-medium py-2 px-6 rounded-lg border-2 border-charcoal-200 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {currentView === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      )}
    </>
  );
}
