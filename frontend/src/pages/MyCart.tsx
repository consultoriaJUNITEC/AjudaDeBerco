import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trash2, Edit, Copy } from "lucide-react";
import { ProductInCart } from "../types/carts";
import type { Product } from "../types/product";
import { getProductById } from "../api/products";
import { ASSETS, WEBSOCKET_ENDPOINTS } from "../constants/index";
import ExportMenu from "../components/ExportMenu";
import SearchBar from "../components/SearchBar";
import ProductMap from "../components/adminPanel/ProductMap";
import "./MyCart.css";

const MyCart: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extrai dados do estado da navegação com valores padrão
  const id_cart = location.state?.cartId || "N/A";
  const type = location.state?.cartType || "Entrada";
  const initialProducts = location.state?.products || [];

  // State to store the code entered by the user
  const [showPopup, setShowPopup] = useState(false);
  // Track the selected product index
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  // State to manage the export menu visibility
  const [showExportMenu, setShowExportMenu] = useState(false);
  // State to manage map visibility in popup
  const [showMapInPopup, setShowMapInPopup] = useState(false);
  // State to store the products in the cart
  const [products, setProducts] = useState<ProductInCart[]>(initialProducts ?? []);
  // State to manage search product modal visibility
  const [showSearchModal, setShowSearchModal] = useState(false);
  // State to manage product mapping
  const [productToMap, setProductToMap] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${id_cart}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socketRef = useRef<WebSocket | null>(null);

  const requestCart = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        action: "GetCar", // Solicitação de carrinho
        id_car: id_cart, // ID do carro
      };
      socketRef.current.send(JSON.stringify(message)); // Envia a mensagem via WebSocket
    } else {
      console.warn("WebSocket is not open");
    }
  };

  useEffect(() => {
    if (location.state === null || location.state.cartId === null || location.state.cartId === undefined) {
      navigate(-1);
    }
    let isMounted = true;
    const socket = new WebSocket(WEBSOCKET_ENDPOINTS.CONNECT(id_cart));
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket opened");
      requestCart();
    };

    socket.onmessage = (event) => {
      if (!isMounted) return;

      try {
        const data = JSON.parse(event.data);
        console.log("Message received:", data);

        // Verificar se a mensagem é de atualização do carrinho
        if (data.action === "UpdateCar" && data.id_car === id_cart) {
          // Atualizar os produtos no estado do carrinho com os dados recebidos
          console.log("Updating products list:", data.products);
          setProducts(data.products ?
            data.products.map((product: any) => ({
              id: product.id,
              code: product.id_product,
              name: product.name,
              unit: product.unit,
              quantity: product.quantity,
              description: product.description,
              expirationDate: product.expiration,
            })) : []
          );
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    socket.onclose = () => {
      console.warn("WebSocket closed");
    };

    return () => {
      isMounted = false;
      console.log("Closing WebSocket on unmount");
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socket.close();
      }
    };
  }, [id_cart]);

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not open");
    }
  };

  const deleteProduct = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  // Update specific field of product
  const updateProduct = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  // Add new empty product - modificado para abrir o modal de busca
  const addProduct = () => {
    setShowSearchModal(true);
  };

  // Handle product selection from search
  const handleProductSelect = (product: Product) => {
    const newProduct: ProductInCart = {
      id: 0,
      code: product.id,
      name: product.name,
      unit: product.unit,
      quantity: 1,
      description: "",
      expirationDate: "",
    };

    const updatedProducts = [
      ...(Array.isArray(products) ? products : []),
      newProduct,
    ];
    setProducts(updatedProducts);
    setSelectedProductIndex(updatedProducts.length - 1);
    setShowSearchModal(false);
    setShowPopup(true);
  };

  const handleOpenMap = async (productInCart: ProductInCart) => {
    const product = await getProductById(productInCart.code);
    if (!product) {
      console.error("Product not found");
      return;
    }
    setProductToMap(product);
    setShowMapInPopup(true);
  };

  const handleMapClose = () => {
    setShowMapInPopup(false);
  };

  return (
    <div className="container-meucarrinho">
      <div className="content">

        <h1 className="your-cart" style={{ marginTop: "2rem"}}>
          O Seu Carrinho de {type}: {id_cart}
		    </h1>
        <div className="cart-code-wrapper">	
		<button className="copy-button" style={{ marginTop: "0.1rem"}} onClick={handleCopy} title="Copiar código">
			<Copy size={18} />
		</button>
		</div>
				{showPopup && selectedProductIndex !== null && (
          <div className="popup-overlay">
            <div className="popup-content">

              {/* Mapa do produto*/}
              {showMapInPopup && (
                <div className="overlay">
                  <div className="overlay-content map-overlay">
                    <ProductMap
                      product={productToMap!}
                      mapPath={ASSETS.MAP_PATH}
                      onClose={() =>
                        productToMap && handleMapClose()
                      }
                    />
                  </div>
                </div>
              )}

              {/* Extra info */}
              <>
                <table className="styled-table">
                  <tbody>
                    {products[selectedProductIndex] && (
                      <>
                        <tr>
                          <td>Nome Artigo</td>
                          <td>
                            <p className="input-display">
                              {products[selectedProductIndex].name}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>Data de Validade</td>
                          <td>
                            <input
                              type="date"
                              value={
                                products[selectedProductIndex].expirationDate
                              }
                              onChange={(e) =>
                                updateProduct(
                                  selectedProductIndex,
                                  "date",
                                  e.target.value
                                )
                              }
                              className="input"
                              style={{ height: "2rem" }}
                              placeholder="Data"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Descrição</td>
                          <td>
                            <input
                              type="text"
                              value={products[selectedProductIndex].description}
                              onChange={(e) =>
                                updateProduct(
                                  selectedProductIndex,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="input"
                              style={{ height: "2rem" }}
                              placeholder="Breve Descrição"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Quantidade</td>
                            <td>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={products[selectedProductIndex].quantity || 1}
                              onChange={(e) => {
                                const value = Math.max(1, Number(e.target.value));
                                updateProduct(selectedProductIndex, "quantity", value);
                              }}
                              className="input"
                              style={{ height: "2rem" }}
                            />
                            </td>
                        </tr>
                        <tr>
                          <td>Localização</td>
                          <td>
                            <button
                              className="button blur-button"
                              onClick={() =>
                                handleOpenMap(products[selectedProductIndex])
                              }
                            >
                              Abrir Mapa
                            </button>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
                <button
                  className="button blur-button"
                  onClick={() => {
                    if (selectedProductIndex !== null) {
                      const productToSend = products[selectedProductIndex];

                      const message = {
                        action: "AddProductCar",
                        id_car: id_cart,
                        id: productToSend.id,
                        id_product: productToSend.code || "",
                        quantity: productToSend.quantity,
                        expiration: productToSend.expirationDate || "", // força string
                        description: productToSend.description || "", // força string
                      };

                      if (
                        socketRef.current &&
                        socketRef.current.readyState === WebSocket.OPEN
                      ) {
                        sendMessage(message);
                      } else {
                        console.warn(
                          "WebSocket is not open. Cannot send message."
                        );
                      }
                    }

                    setShowPopup(false);
                  }}
                  style={{ marginTop: "1rem" }}
                >
                  Feito
                </button>
              </>
            </div>
          </div>
        )}

        {/* Search Modal*/}
        {showSearchModal && (
          <SearchBar
            onProductSelect={handleProductSelect}
            onClose={() => setShowSearchModal(false)}
          />
        )}

        {/* Export Menu */}
        <ExportMenu
          isOpen={showExportMenu}
          onClose={() => setShowExportMenu(false)}
          products={products}
          cartType={type}
          id_car = {id_cart}
          socket = {socketRef.current!}
        />

        <div className="card-meucarrinho" style={{ marginBottom: "2rem" }}>
          <div className="table-wrapper">
            <table className="cart-styled-table" style={{ tableLayout: "fixed", width: "100%" }}>
              <thead style={{display: 'block', minWidth: '400px'}}>
                <tr>
                  <th style={{ textAlign: "center", width: '25%'}}>Produto</th>
                  <th style={{ textAlign: "center", width: '25%'}}>Quantidade</th>
                  <th style={{ textAlign: "center", width: '25%'}}>Unidades</th>
                  <th style={{ textAlign: "center", width: '25%'}}>Ações</th>
                </tr>
              </thead>
              <tbody style={{display: 'block', maxHeight: '400px', minWidth: '400px', overflowY: "auto"}}>
                {Array.isArray(products) && products.length > 0 &&
                  products.map((product, index) => (
                    <tr key={index} style={{ display: "table", tableLayout: "fixed", width: "100%" }}>
                      <td style={{ textAlign: "center", width: '25%'}}>
                        <p style={{ textAlign: "center" }}>
                          {product.name}
                        </p>
                      </td>
                      <td style={{ textAlign: "center", width: '25%'}}>
                        <p style={{ textAlign: "center" }}>
                          {product.quantity}
                        </p>
                      </td>
                      <td style={{ textAlign: "center", width: '25%'}}>
                        <p style={{ textAlign: "center" }}>
                          {product.unit}
                        </p>
                      </td>
                      <td style={{ textAlign: "center", width: '25%'}}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <button
                            className="icon-button edit-button"
                            onClick={() => {
                              setShowPopup(true);
                              setSelectedProductIndex(index);
                              setShowMapInPopup(false);
                            }}
                          >
                            <Edit className="icon" />
                          </button>
                          <button
                            className="icon-button delete-button"
                            onClick={() => {
                              // Finding the product we want to send
                              const productToSend = products[index];

                              const message = {
                                action: "DeleteProductCar",
                                id_car: id_cart,
                                id: productToSend.id,
                              };

                              if (
                                socketRef.current?.readyState === WebSocket.OPEN
                              ) {
                                socketRef.current.send(JSON.stringify(message));
                              } else {
                                console.warn("WebSocket is not open");
                              }

                              deleteProduct(index); // Updates the local state
                            }}
                          >
                            <Trash2 className="icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <button className="button blur-button" onClick={addProduct}>
              + Adicionar Produto
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginTop: "1rem",
            maxWidth: "38rem",
          }}
        >
          <button
            className="button blur-button back-button"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
          <button
            className="button blur-button back-button"
            onClick={() => setShowExportMenu(true)}
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyCart;
