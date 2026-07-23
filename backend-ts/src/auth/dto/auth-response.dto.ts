export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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
