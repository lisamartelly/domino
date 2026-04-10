import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthPage } from "../src/components/AuthPage";

vi.mock("../src/components/Login", () => ({
  default: () => <div data-testid="login-component">Login Component</div>,
}));

vi.mock("../src/components/RegisterForm", () => ({
  RegisterForm: () => (
    <div data-testid="register-form-component">Register Form Component</div>
  ),
}));

function renderAuthPage(initialEntries = ["/login"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthPage />
    </MemoryRouter>
  );
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    const events = ["switchToLogin", "switchToRegister"];
    events.forEach((eventType) => {
      const event = new CustomEvent(eventType);
      window.dispatchEvent(event);
    });
  });

  it("renders login component by default", () => {
    renderAuthPage();

    expect(screen.getByTestId("login-component")).toBeInTheDocument();
    expect(
      screen.queryByTestId("register-form-component")
    ).not.toBeInTheDocument();
  });

  it("renders register form when view=register query param is set", () => {
    renderAuthPage(["/login?view=register"]);

    expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
    expect(screen.queryByTestId("login-component")).not.toBeInTheDocument();
  });

  it("shows sign up button when on login view", () => {
    renderAuthPage();

    expect(
      screen.getByRole("button", { name: /don't have an account\? sign up/i })
    ).toBeInTheDocument();
  });

  it("switches to register view when button is clicked", async () => {
    const user = userEvent.setup();
    renderAuthPage();

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
    renderAuthPage();

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
    renderAuthPage();

    // Switch to register
    const switchToRegisterButton = screen.getByRole("button", {
      name: /don't have an account\? sign up/i,
    });
    await user.click(switchToRegisterButton);

    await waitFor(() => {
      expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
    });

    // Switch back to login
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
    renderAuthPage();

    // Switch to register first
    const switchButton = screen.getByRole("button", {
      name: /don't have an account\? sign up/i,
    });
    await userEvent.click(switchButton);

    await waitFor(() => {
      expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
    });

    // Dispatch switchToLogin event
    window.dispatchEvent(new CustomEvent("switchToLogin"));

    await waitFor(() => {
      expect(screen.getByTestId("login-component")).toBeInTheDocument();
      expect(
        screen.queryByTestId("register-form-component")
      ).not.toBeInTheDocument();
    });
  });

  it("switches to register view when switchToRegister event is dispatched", async () => {
    renderAuthPage();

    expect(screen.getByTestId("login-component")).toBeInTheDocument();

    // Dispatch switchToRegister event
    window.dispatchEvent(new CustomEvent("switchToRegister"));

    await waitFor(() => {
      expect(screen.getByTestId("register-form-component")).toBeInTheDocument();
      expect(screen.queryByTestId("login-component")).not.toBeInTheDocument();
    });
  });

  it("cleans up event listeners on unmount", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderAuthPage();

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
});
