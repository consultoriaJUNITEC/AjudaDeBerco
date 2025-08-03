"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCar } from "@/api/carts";
import { isAuthenticated as checkAuthentication, getAuthToken } from "@/api/auth";
import "./NovoCarrinho.css";

const NovoCarrinho: React.FC = () => {
  // State to store the password entered by the user
  const [password, setPassword] = useState("");
  
  // State to track the cart type (entrada or saída)
  const [cartType, setCartType] = useState("Entrada");
  
  // Estado para mensagem de erro
  const [errorMessage, setErrorMessage] = useState("");
  
  // Estado para indicar carregamento
  const [isLoading, setIsLoading] = useState(false);

  // Estado para indicar se o usuário está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      const isLoggedIn = await checkAuthentication();
      if (isLoggedIn) {
        // If the user is logged in, get the token and set it as the password
        const token = getAuthToken()!;
        setPassword(token);
        setIsAuthenticated(true);
      } else {
        // If the user is not logged in, clear the password
        setIsAuthenticated(false);
        setPassword("");
      }
    };
    checkAuth();
  }, []);

  // Function to handle form submission
  const handleSubmit = async () => {   
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const type = cartType === "Entrada" ? "Entrada" : "Saída";
      // Criar o carrinho com a senha fornecida
      const car = await createCar(password, type);
      // Se o carrinho foi criado com sucesso
      if (car && car.id) {
        // Navegue para a página do carrinho com o ID e tipo como parâmetros
        router.push(`/meu-carrinho?id=${car.id}&type=${car.type || "Entrada"}`);
      } else {
        throw new Error("Não foi possível criar o carrinho.");
      }
    } catch (error) {
      console.error("Erro ao criar carrinho:", error);
      setErrorMessage(
        (error instanceof Error && error.message.includes("401"))
          ? "Senha inválida. Tente novamente."
          : "Ocorreu um erro ao criar o carrinho. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main container with background and layout
    <div className="container">
      {/* Main content section centered on the screen */}
      <div className="content">
        {/* Page title */}
        <h1 className="title">NOVO CARRINHO</h1>

        {/* Card-like container with input and options */}
        <div className="card">
          <div className="form-group">
            {/* Password input field */}
            {isAuthenticated ? (
              <p className="info-message">
                Já está autenticado.
              </p>
            ) : (
              <input
                type="password"
                placeholder="Insere a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            )}

            <div className="cart-type-selector">
              <div className={`cart-type-slider ${cartType === "Saída" ? "right" : ""}`}></div>
              <div
                className={`cart-type-option ${cartType === "Entrada" ? "active" : ""}`}
                onClick={() => setCartType("Entrada")}
              >
                Entrada
              </div>
              <div
                className={`cart-type-option ${cartType === "Saída" ? "active" : ""}`}
                onClick={() => setCartType("Saída")}
              >
                Saída
              </div>
            </div>

            {/* Submit button to create the cart */}
            <button className="button primary-button" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Carregando..." : "Criar Carrinho"}
            </button>

            {/* Error message display */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
        </div>

        {/* Back button */}
        <button className="button blur-button back-button" onClick={() => router.push("/")}>
          Voltar
        </button>

      </div>
    </div>
  );
};

export default NovoCarrinho;
