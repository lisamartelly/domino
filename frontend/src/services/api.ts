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

export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: RegisterResponse = await response.json();
    throw errorData;
  }

  return response.json();
};
