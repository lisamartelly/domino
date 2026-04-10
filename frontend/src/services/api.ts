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
  roles: string[];
  hasCompletedIntake: boolean;
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
  roles: ["Admin"],
  hasCompletedIntake: true,
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
): Promise<LoginResponse> => {
  if (useMockApi()) {
    return {
      success: true,
      user: {
        ...mockUser,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        hasCompletedIntake: false,
      },
      accessToken: "mock-access-token",
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

// ── Activity Ideas ──

export interface ActivityIdeaDto {
  id: number;
  name: string;
  description: string;
}

export const getActivityIdeas = async (): Promise<ActivityIdeaDto[]> => {
  const response = await fetchWithAuth("/api/activity-ideas");
  if (!response.ok) throw new Error("Failed to fetch activity ideas");
  return response.json();
};

export const createActivityIdea = async (
  data: Omit<ActivityIdeaDto, "id">
): Promise<ActivityIdeaDto> => {
  const response = await fetchWithAuth("/api/activity-ideas", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create activity idea");
  return response.json();
};

export const updateActivityIdea = async (
  id: number,
  data: Omit<ActivityIdeaDto, "id">
): Promise<ActivityIdeaDto> => {
  const response = await fetchWithAuth(`/api/activity-ideas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update activity idea");
  return response.json();
};

export const deleteActivityIdea = async (id: number): Promise<void> => {
  const response = await fetchWithAuth(`/api/activity-ideas/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete activity idea");
};

// ── Members ──

export interface MemberMatchStats {
  totalMatches: number;
  accepted: number;
  denied: number;
  pending: number;
}

export interface MemberDto {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  matchStats: MemberMatchStats;
}

export interface PastMatchDto {
  matchPublicId: string;
  otherUserName: string;
  accepted: boolean | null;
  createdAt: string;
}

export interface MemberDetailDto extends MemberDto {
  pastMatches: PastMatchDto[];
}

export const getMembers = async (): Promise<MemberDto[]> => {
  const response = await fetchWithAuth("/api/members");
  if (!response.ok) throw new Error("Failed to fetch members");
  return response.json();
};

export const getMemberDetail = async (
  id: number
): Promise<MemberDetailDto> => {
  const response = await fetchWithAuth(`/api/members/${id}`);
  if (!response.ok) throw new Error("Failed to fetch member");
  return response.json();
};

// ── Matches ──

export interface MatchSummaryDto {
  publicId: string;
  otherUserName: string;
  status: "pending" | "accepted" | "denied" | "expired";
  createdAt: string;
}

export const getMyMatches = async (): Promise<MatchSummaryDto[]> => {
  const response = await fetchWithAuth("/api/matches");
  if (!response.ok) throw new Error("Failed to fetch matches");
  return response.json();
};

export interface CreateMatchRequest {
  userId1: number;
  userId2: number;
  narrative: string;
  activityIdeaIds: number[];
}

export interface MatchUserInfo {
  userId: number;
  firstName: string;
  lastInitial: string;
  age: number;
  accepted: boolean | null;
}

export interface MatchActivityIdea {
  id: number;
  name: string;
  description: string;
}

export interface MatchDetailDto {
  publicId: string;
  narrative: string;
  users: MatchUserInfo[];
  isExpired: boolean;
  bothAccepted: boolean;
  activityIdeas: MatchActivityIdea[];
  createdAt: string;
  currentUserAccepted: boolean | null;
}

export const createMatch = async (
  data: CreateMatchRequest
): Promise<{ publicId: string }> => {
  const response = await fetchWithAuth("/api/matches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to create match");
  }
  return response.json();
};

export const getMatch = async (publicId: string): Promise<MatchDetailDto> => {
  const response = await fetchWithAuth(`/api/matches/${publicId}`);
  if (!response.ok) throw new Error("Failed to fetch match");
  return response.json();
};

export const respondToMatch = async (
  publicId: string,
  accepted: boolean
): Promise<{ accepted: boolean; bothAccepted: boolean }> => {
  const response = await fetchWithAuth(`/api/matches/${publicId}/respond`, {
    method: "POST",
    body: JSON.stringify({ accepted }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to respond to match");
  }
  return response.json();
};

// ── Surveys ──

export interface QuestionOptionDto {
  id: number;
  value: string;
  displayValue: string;
  sortOrder: number;
}

export interface QuestionDto {
  questionVersionId: number;
  stableKey: string;
  questionGroup: string | null;
  prompt: string;
  questionType: "Text" | "Number" | "Boolean" | "SingleChoice" | "MultipleChoice";
  required: boolean;
  options: QuestionOptionDto[];
}

export interface SurveyDto {
  id: number;
  name: string;
  slug: string;
  description: string;
  versionId: number;
  questions: QuestionDto[];
}

export interface SubmitAnswerRequest {
  questionVersionId: number;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  selectedOptionIds?: number[];
}

export const getSurveyBySlug = async (slug: string): Promise<SurveyDto> => {
  const response = await fetchWithAuth(`/api/surveys/${slug}`);
  if (!response.ok) throw new Error("Failed to fetch survey");
  return response.json();
};

export interface SurveyAnswerDto {
  prompt: string;
  questionGroup: string | null;
  questionType: string;
  answer: string | null;
}

export interface SurveyResponseDto {
  surveyName: string;
  completedAt: string;
  answers: SurveyAnswerDto[];
}

export const getUserSurveyResponse = async (
  slug: string,
  userId: number
): Promise<SurveyResponseDto> => {
  const response = await fetchWithAuth(
    `/api/surveys/${slug}/responses/${userId}`
  );
  if (!response.ok) throw new Error("Failed to fetch survey response");
  return response.json();
};

export const submitSurveyResponse = async (
  slug: string,
  answers: SubmitAnswerRequest[]
): Promise<{ success: boolean }> => {
  const response = await fetchWithAuth(`/api/surveys/${slug}/responses`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to submit survey");
  }
  return response.json();
};
