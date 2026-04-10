import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";

// Mock the API to simulate unauthenticated state
vi.mock("../src/services/api", () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error("Not authenticated")),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock("../src/components/LandingPage", () => ({
  LandingPage: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock("../src/components/AuthPage", () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>,
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the LandingPage for unauthenticated users", async () => {
    render(<App />);

    // Wait for loading to complete and landing page to appear
    await waitFor(() => {
      expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    });
  });
});
