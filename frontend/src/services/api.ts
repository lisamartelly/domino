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
}

// Promise queue to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

// Base fetch wrapper with automatic token refresh
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include", // Always include credentials for cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  let response = await fetch(url, defaultOptions);

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && !url.includes("/api/auth/refresh")) {
    // Prevent infinite loops - don't retry refresh endpoint
    const refreshed = await refreshTokenIfNeeded();

    if (refreshed) {
      // Retry original request after successful refresh
      response = await fetch(url, defaultOptions);
    } else {
      // Refresh failed, user needs to login again
      throw new Error("Authentication failed. Please login again.");
    }
  }

  return response;
}

// Refresh token function with promise queue
async function refreshTokenIfNeeded(): Promise<boolean> {
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
  await fetchWithAuth("/api/auth/logout", {
    method: "POST",
  });
};

export const getCurrentUser = async (): Promise<UserDto> => {
  const response = await fetchWithAuth("/api/auth/me", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  return response.json();
};
