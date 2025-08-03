import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  login,
  setAuthToken,
  isTokenPresent,
  isAuthenticated,
} from "@/api/auth";
import "./AuthenticationMenu.css";

interface AuthenticationMenuProps {
  onLoginSuccess?: () => void;
  onCancel?: () => void;
}

const AuthenticationMenu: React.FC<AuthenticationMenuProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsValidating(true);
      try {
        const authenticated = await isAuthenticated();
        setIsLoggedIn(authenticated);
      } catch (err) {
        console.error("Error validating authentication:", err);
        setIsLoggedIn(false);
      } finally {
        setIsValidating(false);
      }
    };

    // Initial check with local storage for faster UI rendering
    setIsLoggedIn(isTokenPresent());

    // Then validate with the server
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!password.trim()) {
        throw new Error("Por favor, digite uma senha.");
      }

      const result = await login(password);
      setAuthToken(result.token);
      setIsLoggedIn(true);

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.push("/admin"); // Default navigation if no callback is provided
      }
    } catch (err) {
      console.error("Erro ao autenticar:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao autenticar. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/"); // Default navigation if no callback is provided
    }
  };

  // Show loading state while validating the token
  if (isValidating) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="loading-auth">A verificar a autenticação...</div>
        </div>
      </div>
    );
  }
  // If the user is already logged in, show a message and a button to go to the admin menu
  if (isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <h2 className="auth-title">Já estás autenticado!</h2>
         <div className="auth-actions" style={{ display: 'flex', justifyContent: 'center' }}>
            <button
               type="button"
               className="auth-btn admin-btn-primary"
               onClick={() => router.push("/admin")}
            >
               Menu Admin&nbsp;&nbsp; <i className="fas fa-arrow-right"></i>
            </button>
         </div>
        </div>
      </div>
    );
  }
  // Render the authentication form
  return (
    <div className="auth-container">
      <div className="auth-content">
        <h2 className="auth-title">{isLoggedIn ? "Autenticação" : "Entrar"}</h2>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-field">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Escreva a senha"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-actions">
            <button
              type="submit"
              className="auth-btn admin-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Autenticando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="auth-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthenticationMenu;
