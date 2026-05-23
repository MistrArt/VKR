export const ACCESS_TOKEN_KEY = 'uraltour_access_token';
export const REFRESH_TOKEN_KEY = 'uraltour_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setAuthTokens(accessToken?: string, refreshToken?: string): void {
  setAccessToken(accessToken ?? null);
  setRefreshToken(refreshToken ?? null);
}

export function clearAuthTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}
