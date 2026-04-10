import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../src/components/RegisterForm";

const mockRegister = vi.fn();

vi.mock("../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all form fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders the header text", () => {
    render(<RegisterForm />);

    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByText("Sign up to get started")).toBeInTheDocument();
  });

  it("updates form fields when user types", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const firstNameInput = screen.getByLabelText(/first name/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(firstNameInput, "John");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
    expect(firstNameInput).toHaveValue("John");
  });

  it("clears errors when user starts typing", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      errors: ["Email already exists"],
    });

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });

    await user.type(emailInput, "x");

    await waitFor(() => {
      expect(
        screen.queryByText("Email already exists")
      ).not.toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);

    render(<RegisterForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        birthday: "1990-01-01",
      });
    });
  });

  it("calls register on successful submission (auto-login)", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);

    render(<RegisterForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
  });

  it("displays error messages on registration failure", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      errors: ["Email already exists", "Password is too weak"],
    });

    render(<RegisterForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
      expect(screen.getByText("Password is too weak")).toBeInTheDocument();
    });
  });

  it("displays generic error message for unexpected errors", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(new Error("Network error"));

    render(<RegisterForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("disables form fields and button while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockRegister.mockReturnValueOnce(promise);

    render(<RegisterForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com"
    );
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Registering...");
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });

    resolvePromise!(undefined);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("dispatches switchToLogin event when sign in link is clicked", async () => {
    const user = userEvent.setup();
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    render(<RegisterForm />);

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    await user.click(signInLink);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "switchToLogin",
      })
    );
  });
});
