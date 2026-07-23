export interface UserDto {
  id: number;
  email: string;
  name: string;
  pronouns: string | null;
  roles: string[];
  hasCompletedIntake: boolean;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  user?: UserDto;
}

export interface RegisterErrorResponse {
  success: boolean;
  message?: string;
  errors: string[];
}
