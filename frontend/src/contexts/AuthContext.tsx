import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  tryRefreshToken,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  type UserDto,
  type LoginRequest,
} from "../services/api";

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // On page reload the in-memory token is gone; restore the session
      // via the refresh token cookie before calling /me
      if (!getAccessToken()) {
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
          setUser(null);
          return;
        }
      }
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await loginUser(credentials);
      if (response.success && response.user && response.accessToken) {
        // Store access token in memory
        setAccessToken(response.accessToken);
        setUser(response.user);
        // Return success - let component handle navigation
        return;
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      setUser(null);
      clearAccessToken();
      // Extract error message from various error formats
      const errorMessage =
        error?.message ||
        error?.response?.message ||
        "Invalid email or password";
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      checkAuth,
    }),
    [user, isLoading, login, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
