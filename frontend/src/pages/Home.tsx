import React, { useState } from "react"
import { useNavigate } from "react-router-dom";
import { getCart } from "../api/carts";
import "./Home.css"

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // State to store the code entered by the user
  const [code, setCode] = useState("")

  const handleEnter = async () => {
    setErrorMessage("");
    setIsLoading(true);
    setCode(code.trim());

    // Validate the code
    if (code.length !== 6) {
      setErrorMessage("O código deve ter 6 caracteres.");
      setIsLoading(false);
      return;
    }

    // Fetch the cart using the code
    try {
      const car = await getCart(code);
      if (car && car.id) {
        console.log("Carrinho encontrado:", car);
        // Navigate to the MyCart page with the cart ID and type
        navigate("/meu-carrinho", { 
          state: { 
            cartId: car.id, 
            cartType: car.type || "Entrada",
            cartProducts: car.products             
          } 
        });
      } else {
        throw new Error("Não foi possível encontrar o carrinho.");
      }
    } catch (error) {
      console.error("Erro ao procurar carrinho:", error);
      setErrorMessage("Ocorreu um erro ao procurar o carrinho. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="content">
		    {/* Page title */}
        <h1 className="title">GESTÃO DE STOCK</h1>

        <div className="card">
          <div className="form-group">
            {/* Input field to type in the cart code */}
            <input
              type="text"
              placeholder="Insere o código do carrinho"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input"
            />

            {/* Submit button for joining with the code */}
            <button
              className="button primary-button"
              onClick={handleEnter}
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : "Enter"}
            </button>

          </div>

          {/* Error message display */}
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Divider with "ou" (or) */}
        <div className="divider">ou</div>
        
        {/* Button for creating a new cart */}       
        <button
          className="button blur-button"
          onClick={() => navigate("/novo-carrinho")}
        >
          Criar um carrinho
        </button>
        
		  </div>
    </div>
  )
}

export default Home;
