import { useState, useEffect } from "react";
import Login from "./Login";
import { RegisterForm } from "./RegisterForm";

export function AuthPage() {
  const [currentView, setCurrentView] = useState<"login" | "register">("login");

  useEffect(() => {
    const handleSwitchToLogin = () => setCurrentView("login");
    const handleSwitchToRegister = () => setCurrentView("register");

    window.addEventListener("switchToLogin", handleSwitchToLogin);
    window.addEventListener("switchToRegister", handleSwitchToRegister);

    return () => {
      window.removeEventListener("switchToLogin", handleSwitchToLogin);
      window.removeEventListener("switchToRegister", handleSwitchToRegister);
    };
  }, []);

  return (
    <>
      {currentView === "login" ? <Login /> : <RegisterForm />}
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
    </>
  );
}
