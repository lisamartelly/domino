import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerUser, type RegisterRequest } from "../src/services/api";

describe("api service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("registerUser", () => {
    const mockRequest: RegisterRequest = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      birthday: "1990-01-01",
    };

    it("sends POST request with correct data", async () => {
      const mockResponse = {
        success: true,
        message: "User registered successfully",
        errors: [],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await registerUser(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockRequest),
      });
    });

    it("returns response data on success", async () => {
      const mockResponse = {
        success: true,
        message: "User registered successfully",
        errors: [],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await registerUser(mockRequest);

      expect(result).toEqual(mockResponse);
    });

    it("throws error response when request fails", async () => {
      const mockErrorResponse = {
        success: false,
        message: "Registration failed",
        errors: ["Email already exists"],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(registerUser(mockRequest)).rejects.toEqual(
        mockErrorResponse
      );
    });

    it("handles network errors", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      await expect(registerUser(mockRequest)).rejects.toThrow("Network error");
    });

    it("handles invalid JSON response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(registerUser(mockRequest)).rejects.toThrow("Invalid JSON");
    });

    it("sends request with all required fields", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, errors: [] }),
      });

      await registerUser(mockRequest);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toEqual({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        birthday: "1990-01-01",
      });
    });

    it("uses correct content type header", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, errors: [] }),
      });

      await registerUser(mockRequest);

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
    });
  });
});
