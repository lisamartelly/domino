export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthday: string; // ISO date string (YYYY-MM-DD)
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  errors: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: UserDto;
  accessToken?: string;
}

function useMockApi(): boolean {
  return import.meta.env.VITE_USE_MOCK === "true";
}

const mockUser: UserDto = {
  id: "1",
  email: "dev@example.com",
  firstName: "Dev",
  lastName: "User",
};

/** Mock session email (set on login, cleared on logout). */
let mockSessionEmail: string | null = null;

// In-memory token storage (cleared on page refresh, restored via refresh token)
let accessToken: string | null = null;

// Token management functions
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// Promise queue to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

// Base fetch wrapper with automatic token refresh
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if we have a token
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include", // Still include credentials for refresh token cookie
    headers,
  };

  let response = await fetch(url, defaultOptions);

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && !url.includes("/api/auth/refresh")) {
    // Prevent infinite loops - don't retry refresh endpoint
    const refreshed = await refreshTokenIfNeeded();

    if (refreshed) {
      // Update headers with new token and retry
      const retryHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (accessToken) {
        retryHeaders["Authorization"] = `Bearer ${accessToken}`;
      }

      response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: retryHeaders,
      });
    } else {
      // Refresh failed, clear token and throw
      clearAccessToken();
      throw new Error("Authentication failed. Please login again.");
    }
  }

  return response;
}

// Refresh the access token using the refresh token cookie.
// Exported so AuthContext can call it on page load to restore the session.
export async function tryRefreshToken(): Promise<boolean> {
  return refreshTokenIfNeeded();
}

async function refreshTokenIfNeeded(): Promise<boolean> {
  if (useMockApi()) {
    return false;
  }

  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start new refresh attempt
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Store new access token from response
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  if (useMockApi()) {
    return {
      success: true,
      message: "Registered (mock)",
      errors: [],
    };
  }

  const response = await fetchWithAuth("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: RegisterResponse = await response.json();
    throw errorData;
  }

  return response.json();
};

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  if (useMockApi()) {
    mockSessionEmail = data.email;
    return {
      success: true,
      user: { ...mockUser, email: data.email },
      accessToken: "mock-access-token",
    };
  }

  const response = await fetchWithAuth("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: LoginResponse = await response.json();
    const error = new Error(errorData.message || "Login failed");
    (error as any).response = errorData;
    throw error;
  }

  return response.json();
};

export const logoutUser = async (): Promise<void> => {
  if (useMockApi()) {
    mockSessionEmail = null;
    clearAccessToken();
    return;
  }

  await fetchWithAuth("/api/auth/logout", {
    method: "POST",
  });
  // Clear the access token from memory
  clearAccessToken();
};

export const getCurrentUser = async (): Promise<UserDto> => {
  if (useMockApi()) {
    if (!getAccessToken()) {
      throw new Error("Failed to get current user");
    }
    return {
      ...mockUser,
      email: mockSessionEmail ?? mockUser.email,
    };
  }

  const response = await fetchWithAuth("/api/auth/me", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  return response.json();
};
