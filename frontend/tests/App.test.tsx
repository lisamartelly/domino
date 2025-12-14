import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../src/App";

vi.mock("../src/components/AuthPage", () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>,
}));

describe("App", () => {
  it("renders the AuthPage component", () => {
    render(<App />);
    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
  });
});
