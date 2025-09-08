import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, Trash2} from "lucide-react";
import type { Cart } from "../../types/carts";
import { getAllCarts, getCart } from "../../api/carts";
import { getAuthToken } from "../../api/auth";
import { WEBSOCKET_ENDPOINTS, WS_ACTIONS, CART_TYPES } from "../../constants";
import "./CartsTab.css";
import { FolderInput, FolderOutput } from "lucide-react";


interface CartsTabProps {
  isActive?: boolean;
}

const DeleteCartButton: React.FC<{
  cartId: string;
  onDelete: (cartId: string) => void;
  showText?: boolean;
}> = ({ cartId, onDelete, showText = false }) => {
  const handleDelete = () => {
    const socket = new WebSocket(WEBSOCKET_ENDPOINTS.CONNECT(cartId));
    socket.onopen = () => {
      socket.send(JSON.stringify({
        action: WS_ACTIONS.DELETE_CAR,
        id_car: cartId
      }));
      socket.close();
    };
    socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };
    onDelete(cartId);
  };

  return (
    <button 
      className={showText ? "icon-button delete" : "icon-button delete-button"}
      onClick={handleDelete}
      title="Eliminar carrinho"
    >
      {showText ? (
        <>
          <i className="fas fa-trash-alt"></i>
          Eliminar
        </>
      ) : (
        <Trash2 className="icon" />
      )}
    </button>
  );
};

const CartsTab: React.FC<CartsTabProps> = ({ isActive = true }) => {
  const navigate = useNavigate();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [isLoadingCarts, setIsLoadingCarts] = useState<boolean>(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  // References to track loading state and data changes
  const isFirstLoad = useRef<boolean>(true);
  const hasLoadedData = useRef<boolean>(false);
  const lastDataString = useRef<string>("");

  // Format date for display
 const formatDate = (dateString: string) => {
  if (!dateString || dateString === "0") return "N/A";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return "Data inválida";
  }
};

  // Silent fetch for carts - without UI indicators
  const fetchCartsSilently = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }
      const data = (await getAllCarts(token)).reverse();
      const dataString = JSON.stringify(data);
      // Only update state if data has changed
      if (dataString !== lastDataString.current) {
        lastDataString.current = dataString;
        setCarts(data);
        hasLoadedData.current = true;
      }
    } catch (err) {
      console.error("Erro na verificação silenciosa de carrinhos:", err);
    }
  };

  // Fetch all carts - with UI indicators
  const fetchCarts = useCallback(async () => {
    setIsLoadingCarts(true);
    setCartError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No auth token found");
      }
      const data = (await getAllCarts(token)).reverse();
      const dataString = JSON.stringify(data);
      lastDataString.current = dataString;
      setCarts(data);
      hasLoadedData.current = true;
    } catch (err) {
      const errorMsg = "Erro ao carregar carrinhos. Por favor tente novamente.";
      setCartError(errorMsg);
      console.error("Error fetching carts:", err);
    } finally {
      setIsLoadingCarts(false);
    }
  }, []);

  // Load carts when the component mounts or when isActive changes
  useEffect(() => {
    if (isFirstLoad.current || !hasLoadedData.current) {
      fetchCarts();
      isFirstLoad.current = false;
    } else {
      fetchCartsSilently();
    }  
  }, [isActive, fetchCarts]);

  // Click outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeActionMenu && !(event.target as Element).closest('.mobile-menu') && 
          !(event.target as Element).closest('.mobile-menu-button')) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeActionMenu]);

  // Navigate to cart details
  const viewCartDetails = async (cartId: string) => {
    try {      
      const car = await getCart(cartId);
      if (car && car.id) {
        navigate("/meu-carrinho", { 
          state: { 
            cartId: car.id, 
            cartType: car.type || CART_TYPES.ENTRADA,
            cartProducts: car.products             
          } 
        });
      } else {
        throw new Error("Não foi possível encontrar o carrinho.");
      }
    } catch (error) {
      console.error("Erro ao procurar carrinho:", error);
    }
  };

  return (
    <div className="card-adminpanel">
      <div className="admin-header">
        <h2 className="table-title">Gestão de Carrinhos</h2>
        <button 
          className="admin-btn admin-btn-primary" 
          onClick={fetchCarts}
          disabled={isLoadingCarts}
        >
          <i className="fas fa-sync"></i> Atualizar
        </button>
      </div>

      {/* Cart Error Message */}
      {cartError && <div className="error-message">{cartError}</div>}

      {/* Carts Table */}
      <div className="table-wrapper">
        {isLoadingCarts ? (
          <div className="loading">A carregar carrinhos...</div>
        ) : (
          <table className="carts-table">
            <thead>
              <tr>                
                <th>Código</th>
                <th>Tipo</th>
                <th className="export-date-header">Data de Exportaçao</th>
                <th className="actions-header">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carts.length > 0 ? (
                carts.map((cart) => (
                  <tr key={cart.id}>                    
                    <td>{cart.id}</td>
                    <td>
                      {cart.type === "Saída" ? (
                        <span className="cart-type saida">
                          <FolderOutput className="icon" /> 
                        </span>
                      ) : (
                        <span className="cart-type entrada">
                          <FolderInput className="icon" /> 
                        </span>
                      )}
                    </td>
                    <td>{formatDate(cart.exportedAt)}</td>
                    <td className="actions-cell">                      
                      {/* Botões de ação para desktop */}
                      <div className="action-buttons">
                        <button
                          className="icon-button view"
                          onClick={() => viewCartDetails(cart.id)}
                          title="Ver detalhes do carrinho"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <DeleteCartButton
                          cartId={cart.id}
                          onDelete={(cartId) => setCarts((prevCarts) => prevCarts.filter((c) => c.id !== cartId))}
                        />
                      </div>
                      
                      {/* Botão de menu para mobile */}
                      <button 
                        className="mobile-menu-button"
                        onClick={() => setActiveActionMenu(activeActionMenu === cart.id ? null : cart.id)}
                        title="Menu de ações"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      
                      {/* Menu dropdown para mobile */}
                      <div className={`mobile-menu ${activeActionMenu === cart.id ? 'show' : ''}`}>
                        <button
                          className="icon-button view"
                          onClick={() => {
                            viewCartDetails(cart.id);
                            setActiveActionMenu(null);
                          }}
                        >
                          <i className="fas fa-eye"></i>
                          Ver detalhes
                        </button>                        
                        <DeleteCartButton
                          cartId={cart.id}
                          onDelete={(cartId) => {
                            setCarts((prevCarts) => prevCarts.filter((c) => c.id !== cartId));
                            setActiveActionMenu(null);
                          }}
                          showText={true}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-table">
                    Não há carrinhos disponíveis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CartsTab;
