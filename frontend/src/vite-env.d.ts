/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When `"true"`, auth API calls use in-memory mocks (no backend). */
  readonly VITE_USE_MOCK?: string;
}
