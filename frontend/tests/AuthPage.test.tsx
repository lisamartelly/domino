import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../src/components/Login", () => ({
  default: ({ showRegisterLink }: { showRegisterLink?: boolean }) => (
    <div data-testid="login-component">
      Login Component {showRegisterLink !== false && <span data-testid="register-link">Sign up</span>}
    </div>
  ),
}));

vi.mock("../src/components/RegisterForm", () => ({
  RegisterForm: () => (
    <div data-testid="register-form-component">Register Form Component</div>
  ),
}));

function renderAuthPage(initialEntries = ["/login"]) {
  // Dynamic import so the env override is picked up
  return import("../src/components/AuthPage").then(({ AuthPage }) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthPage />
      </MemoryRouter>
    )
  );
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Default: registration enabled
    vi.stubEnv("VITE_REGISTRATION_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    const events = ["switchToLogin", "switchToRegister"];
    events.forEach((eventType) => {
      const event = new CustomEvent(eventType);
      window.dispatchEvent(event);
    });
  });

  it("renders login component by default", async () => {
    await renderAuthPage();

    expect(screen.getByTestId("login-component")).toBeInTheDocument();
    expect(
      screen.queryByTestId("register-form-component")
    ).not.toBeInTheDocument();
  });

  it("renders register form when view=register query param is set", async () => {
    await renderAuthPage(["/login?view=register"]);

    expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
    expect(screen.queryByTestId("login-component")).not.toBeInTheDocument();
  });

  it("shows sign up button when on login view", async () => {
    await renderAuthPage();

    expect(
      screen.getByRole("button", { name: /don't have an account\? sign up/i })
    ).toBeInTheDocument();
  });

  it("switches to register view when button is clicked", async () => {
    const user = userEvent.setup();
    await renderAuthPage();

    const switchButton = screen.getByRole("button", {
      name: /don't have an account\? sign up/i,
    });
    await user.click(switchButton);

    await waitFor(() => {
      expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
      expect(screen.queryByTestId("login-component")).not.toBeInTheDocument();
    });
  });

  it("shows sign in button when on register view", async () => {
    const user = userEvent.setup();
    await renderAuthPage();

    const switchButton = screen.getByRole("button", {
      name: /don't have an account\? sign up/i,
    });
    await user.click(switchButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /already have an account\? sign in/i,
        })
      ).toBeInTheDocument();
    });
  });

  it("switches back to login view when button is clicked from register view", async () => {
    const user = userEvent.setup();
    await renderAuthPage();

    const switchToRegisterButton = screen.getByRole("button", {
      name: /don't have an account\? sign up/i,
    });
    await user.click(switchToRegisterButton);

    await waitFor(() => {
      expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
    });

    const switchToLoginButton = screen.getByRole("button", {
      name: /already have an account\? sign in/i,
    });
    await user.click(switchToLoginButton);

    await waitFor(() => {
      expect(screen.getByTestId("login-component")).toBeInTheDocument();
      expect(
        screen.queryByTestId("register-form-component")
      ).not.toBeInTheDocument();
    });
  });

  it("switches to login view when switchToLogin event is dispatched", async () => {
    await renderAuthPage(["/login?view=register"]);

    expect(screen.getByTestId("register-form-component")).toBeInTheDocument();

    window.dispatchEvent(new CustomEvent("switchToLogin"));

    await waitFor(() => {
      expect(screen.getByTestId("login-component")).toBeInTheDocument();
      expect(
        screen.queryByTestId("register-form-component")
      ).not.toBeInTheDocument();
    });
  });

  it("switches to register view when switchToRegister event is dispatched", async () => {
    await renderAuthPage();

    expect(screen.getByTestId("login-component")).toBeInTheDocument();

    window.dispatchEvent(new CustomEvent("switchToRegister"));

    await waitFor(() => {
      expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
      expect(screen.queryByTestId("login-component")).not.toBeInTheDocument();
    });
  });

  it("cleans up event listeners on unmount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = await renderAuthPage();

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "switchToLogin",
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "switchToRegister",
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "switchToLogin",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "switchToRegister",
      expect.any(Function)
    );
  });

  describe("when registration is disabled", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_REGISTRATION_ENABLED", "false");
    });

    it("always shows login and hides the toggle button", async () => {
      await renderAuthPage();

      expect(screen.getByTestId("login-component")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /don't have an account/i })
      ).not.toBeInTheDocument();
    });

    it("ignores view=register query param", async () => {
      await renderAuthPage(["/login?view=register"]);

      expect(screen.getByTestId("login-component")).toBeInTheDocument();
      expect(
        screen.queryByTestId("register-form-component")
      ).not.toBeInTheDocument();
    });

    it("ignores switchToRegister event", async () => {
      await renderAuthPage();

      window.dispatchEvent(new CustomEvent("switchToRegister"));

      // Give it a tick to process
      await new Promise((r) => setTimeout(r, 50));

      expect(screen.getByTestId("login-component")).toBeInTheDocument();
      expect(
        screen.queryByTestId("register-form-component")
      ).not.toBeInTheDocument();
    });
  });
});
