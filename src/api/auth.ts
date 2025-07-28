import { AUTH_ENDPOINTS, STORAGE_KEYS } from '../constants';

/**
 * Authenticate user with password and get JWT token
 * @param password The password for authentication
 * @returns Promise with the authentication result containing the JWT token
 */
export const login = async (password: string): Promise<{ token: string }> => {
  const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    if (response.status === 401) { 
      // Unauthorized (401)
      throw new Error("Senha incorreta. Por favor, tente novamente.");
    } else {
      throw new Error(`Erro na autenticação: ${response.status}`);
    }
  }

  const data = await response.json();
  return {token: data.token};
};

/**
 * Store the JWT token in local storage
 * @param token JWT token string
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Retrieve the JWT token from local storage
 * @returns The JWT token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Validate token with the backend
 * @returns Promise<boolean> True if token is valid, false otherwise
 */
const validateToken = async (token: string): Promise<boolean> => {
  if (!token) {
    return false;
  }

  try {
    // Using the endpoint /login to validate the token with a GET request
    const response = await fetch(AUTH_ENDPOINTS.VERIFY, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.logged_in === true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

/**
 * Check if the user is authenticated by validating the token with the backend
 * @returns Promise<boolean> True if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  return await validateToken(token);
};

/**
 * @returns boolean True if token exists in local storage
 */
export const isTokenPresent = (): boolean => {
  return !!getAuthToken();
};
