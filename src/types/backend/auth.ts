export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: number;
}

export interface Claims {
  exp: number;
  iat: number;
}
