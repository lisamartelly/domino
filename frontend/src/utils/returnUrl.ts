/**
 * Validates a return path for post-login redirects (same-origin paths only).
 */
export function parseSafeReturnUrl(param: string | null): string | null {
  if (!param) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(param);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://") || decoded.includes("\\")) return null;
  const pathOnly = decoded.split("?")[0];
  if (pathOnly === "/login") return null;
  return decoded;
}

export function buildReturnUrlParam(pathname: string, search: string): string {
  return encodeURIComponent(pathname + (search || ""));
}

export function resolvePostLoginTarget(
  loginSearch: string,
  hasCompletedIntake: boolean
): string {
  const params = new URLSearchParams(loginSearch);
  const safe = parseSafeReturnUrl(params.get("returnUrl"));
  if (!hasCompletedIntake) {
    if (safe) {
      return `/intake?returnUrl=${encodeURIComponent(safe)}`;
    }
    return "/intake";
  }
  return safe ?? "/dashboard";
}

export function resolveAfterIntakeComplete(intakeSearch: string): string {
  const params = new URLSearchParams(intakeSearch);
  return parseSafeReturnUrl(params.get("returnUrl")) ?? "/dashboard";
}
