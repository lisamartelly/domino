import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ status: "Healthy" }),
        })
      )
    );
  });

  it("renders the heading", () => {
    render(<App />);
    expect(screen.getByText("Vite + React")).toBeInTheDocument();
  });

  it("renders the Vite and React logos", () => {
    render(<App />);
    expect(screen.getByAltText("Vite logo")).toBeInTheDocument();
    expect(screen.getByAltText("React logo")).toBeInTheDocument();
  });

  it("increments count when button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole("button", { name: /count is 0/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /count is 1/i })).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /count is 2/i })).toBeInTheDocument();
  });
});

