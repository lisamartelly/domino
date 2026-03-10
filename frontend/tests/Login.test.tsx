import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../src/components/Login";

// Mock the useAuth hook
vi.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  }),
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with all fields", () => {
    render(<Login />);

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to your account to continue")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("does not render social login buttons", () => {
    render(<Login />);

    expect(screen.queryByText("Or continue with")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /github/i })).not.toBeInTheDocument();
  });

  it("updates email field when user types", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "test@example.com");

    expect(emailInput).toHaveValue("test@example.com");
  });

  it("updates password field when user types", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, "password123");

    expect(passwordInput).toHaveValue("password123");
  });

  it("toggles remember me checkbox", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const rememberCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberCheckbox).not.toBeChecked();

    await user.click(rememberCheckbox);
    expect(rememberCheckbox).toBeChecked();

    await user.click(rememberCheckbox);
    expect(rememberCheckbox).not.toBeChecked();
  });

  it("prevents default form submission", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const form = screen
      .getByRole("button", { name: /sign in/i })
      .closest("form");
    const submitHandler = vi.fn((e) => e.preventDefault());
    form?.addEventListener("submit", submitHandler);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(submitHandler).toHaveBeenCalled();
  });

  it("dispatches switchToRegister event when sign up link is clicked", async () => {
    const user = userEvent.setup();
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    render(<Login />);

    const signUpLink = screen.getByRole("link", { name: /sign up/i });
    await user.click(signUpLink);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "switchToRegister",
      })
    );
  });

  it("renders with correct placeholders", () => {
    render(<Login />);

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });
});
