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

    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interests/i)).toBeInTheDocument();
    expect(screen.getByText(/close friends/i)).toBeInTheDocument();
    expect(screen.getByText(/romance/i)).toBeInTheDocument();
    expect(screen.getByText(/community/i)).toBeInTheDocument();
    expect(screen.getByText(/hobbies/i)).toBeInTheDocument();
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

    const nameInput = screen.getByLabelText(/^name$/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(nameInput, "Jane");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    expect(nameInput).toHaveValue("Jane");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("handles checkbox selection for looking for options", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const closeFriendsCheckbox = screen.getByRole("checkbox", {
      name: /close friends/i,
    });
    const romanceCheckbox = screen.getByRole("checkbox", {
      name: /romance/i,
    });

    await user.click(closeFriendsCheckbox);
    await user.click(romanceCheckbox);

    expect(closeFriendsCheckbox).toBeChecked();
    expect(romanceCheckbox).toBeChecked();

    await user.click(closeFriendsCheckbox);
    expect(closeFriendsCheckbox).not.toBeChecked();
  });

  it("shows error if no looking for options selected", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^name$/i), "Jane");
    await user.type(screen.getByLabelText(/pronouns/i), "she/her");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/^password$/i), "password123");

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please select at least one option/i)
      ).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("clears errors when user starts typing", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      errors: ["Email already exists"],
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^name$/i), "Jane");
    await user.type(screen.getByLabelText(/pronouns/i), "she/her");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(
      screen.getByRole("checkbox", { name: /close friends/i })
    );
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^email$/i), "x");

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

    await user.type(screen.getByLabelText(/^name$/i), "Jane Doe");
    await user.type(screen.getByLabelText(/pronouns/i), "she/her");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/interests/i),
      "hiking and reading"
    );
    await user.click(
      screen.getByRole("checkbox", { name: /close friends/i })
    );
    await user.click(screen.getByRole("checkbox", { name: /community/i }));

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Jane Doe",
        pronouns: "she/her",
        birthday: "1990-01-01",
        email: "test@example.com",
        phone: "555-1234",
        password: "password123",
        interests: "hiking and reading",
        lookingFor: ["closeFriends", "community"],
      });
    });
  });

  it("displays error messages on registration failure", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      errors: ["Email already exists", "Password is too weak"],
    });

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/^name$/i), "Jane");
    await user.type(screen.getByLabelText(/pronouns/i), "she/her");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(
      screen.getByRole("checkbox", { name: /close friends/i })
    );
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

    await user.type(screen.getByLabelText(/^name$/i), "Jane");
    await user.type(screen.getByLabelText(/pronouns/i), "she/her");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(
      screen.getByRole("checkbox", { name: /close friends/i })
    );
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

    await user.type(screen.getByLabelText(/^name$/i), "Jane");
    await user.type(screen.getByLabelText(/pronouns/i), "she/her");
    await user.type(screen.getByLabelText(/birthday/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(
      screen.getByRole("checkbox", { name: /close friends/i })
    );

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Registering...");
      expect(screen.getByLabelText(/^email$/i)).toBeDisabled();
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
