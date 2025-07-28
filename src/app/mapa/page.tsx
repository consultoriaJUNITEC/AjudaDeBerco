"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Product } from "../../types/product";
import { getAllProducts, updateProduct } from "../../api/products";
import { getAuthToken } from "../../api/auth";
import { 
  filterProducts, 
  formatProductNameForMarker, 
  hasValidCoordinates, 
  getUnmappedProducts, 
  calculateDistance, 
  clientToCanvasCoordinates 
} from "../../utils/mapUtils";
import { ASSETS } from "../../constants/index";
import "./Map.css";
import "../shared.css";

const Map: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
  const [temporaryCoordinates, setTemporaryCoordinates] = useState<{x: number, y: number} | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const mapImage = ASSETS.MAP_PATH;
  // Função para redesenhar o mapa com o marcador na nova posição sem recarregar a imagem
  const redrawMap = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Usar a imagem em cache se já estiver carregada
    if (mapImageRef.current && selectedProduct) {
      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar mapa usando imagem em cache
      ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);
      
      // Desenhar todos os produtos primeiro
      filteredProducts.forEach(product => {
        // Não desenhe o produto selecionado aqui (será desenhado na nova posição)
        if (product.id !== selectedProduct.id && hasValidCoordinates(product)) {
          const { x: prodX, y: prodY } = product.coordinates!;
          // Marcador vermelho
          ctx.fillStyle = "#FF4136";
          ctx.beginPath();
          ctx.arc(prodX, prodY, 20, 0, Math.PI * 2);
          ctx.fill();
          // Contorno branco
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Obter e formatar as duas primeiras palavras do nome
          const { first: firstFormatted, second: secondFormatted } = formatProductNameForMarker(product.name);
          
          // Configurar fonte
          ctx.font = "14px Inter, sans-serif";
          ctx.textAlign = "center";
          
          if (secondFormatted) {
            // Se tem duas palavras, posicionar a primeira acima do centro
            // Contornos brancos
            ctx.strokeText(firstFormatted, prodX, prodY - 5);
            ctx.strokeText(secondFormatted, prodX, prodY + 12);
            // Texto preto
            ctx.fillStyle = "black";
            ctx.fillText(firstFormatted, prodX, prodY - 5);
            ctx.fillText(secondFormatted, prodX, prodY + 12);
          } else {
            // Se tem apenas uma palavra, centralizar verticalmente
            // Contorno branco
            ctx.strokeText(firstFormatted, prodX, prodY + 4);
            // Texto preto
            ctx.fillStyle = "black";
            ctx.fillText(firstFormatted, prodX, prodY + 4);
          }
        }
      });      
      // Desenhar marcador na nova posição (produto selecionado)
      ctx.fillStyle = "#FF4136";
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Adicionar borda ao círculo
      ctx.strokeStyle = "white";
      ctx.stroke();
      
      // Obter e formatar as duas primeiras palavras do nome
      const { first: firstFormatted, second: secondFormatted } = formatProductNameForMarker(selectedProduct.name);
      
      // Configurar fonte
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      
      if (secondFormatted) {
        // Se tem duas palavras, posicionar a primeira acima do centro
        ctx.strokeText(firstFormatted, x, y - 5);
        ctx.strokeText(secondFormatted, x, y + 12);
        ctx.fillStyle = "black";
        ctx.fillText(firstFormatted, x, y - 5);
        ctx.fillText(secondFormatted, x, y + 12);
      } else {
        // Se tem apenas uma palavra, centralizar verticalmente
        ctx.strokeText(firstFormatted, x, y + 4);
        ctx.fillStyle = "black";
        ctx.fillText(firstFormatted, x, y + 4);
      }
    }
  };

  // Carregar todos os produtos ao iniciar
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const allProducts = await getAllProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        setError("Não foi possível carregar os produtos. Por favor, tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

   // Filtrar produtos baseado no termo de pesquisa
   useEffect(() => {
      setFilteredProducts(filterProducts(products, searchTerm));
   }, [searchTerm, products]);

  // Inicializar o canvas e carregar a imagem do mapa
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsLoading(true);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapImage + `?t=${new Date().getTime()}`; // Timestamp para evitar cache
    
    img.onload = () => {
      // Canvas dimensions
      const maxWidth = 800;
      const maxHeight = 800;
      
      // Calcular proporções para manter a relação de aspecto
      let newWidth = img.width;
      let newHeight = img.height;
      
      // Resize image if necessary
      if (newWidth > maxWidth) {
        const ratio = maxWidth / newWidth;
        newWidth = maxWidth;
        newHeight = newHeight * ratio;
      }
      
      if (newHeight > maxHeight) {
        const ratio = maxHeight / newHeight;
        newHeight = maxHeight;
        newWidth = newWidth * ratio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      mapImageRef.current = img;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      drawProductMarkers();
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.error("Erro ao carregar a imagem do mapa");
      setError("Não foi possível carregar a imagem do mapa");
      setIsLoading(false);
    };
  }, []);  
  
  // Redesenhar os marcadores quando a lista de produtos filtrados mudar
  useEffect(() => {
    if (!isLoading && mapImageRef.current) {
      drawProductMarkers();
    }
  }, [filteredProducts, isLoading]);

  // Função para desenhar os marcadores dos produtos
  const drawProductMarkers = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !mapImageRef.current) return;
    
    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redesenhar o mapa
    ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Desenhar um marcador para cada produto com coordenadas definidas
    filteredProducts.forEach(product => {
      if (hasValidCoordinates(product)) {        
        const { x, y } = product.coordinates!;
        // Cor do marcador padrão
        ctx.fillStyle = "#FF4136"; // Vermelho
        // Desenhar círculo
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        // Adicionar borda ao círculo
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Obter e formatar as duas primeiras palavras do nome
        const { first: firstFormatted, second: secondFormatted } = formatProductNameForMarker(product.name);
        
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        if (secondFormatted) {
          // Se tem duas palavras, posicionar a primeira acima do centro
          // Contorno branco
          ctx.strokeText(firstFormatted, x, y - 5);
          ctx.strokeText(secondFormatted, x, y + 12);
          // Texto preto
          ctx.fillStyle = "black";
          ctx.fillText(firstFormatted, x, y - 5);
          ctx.fillText(secondFormatted, x, y + 12);
        } else {
          // Se tem apenas uma palavra, centralizar verticalmente
          // Contorno branco
          ctx.strokeText(firstFormatted, x, y + 4);
          // Texto preto
          ctx.fillStyle = "black";
          ctx.fillText(firstFormatted, x, y + 4);
        }
      }
    });
  };

  // Função para atualizar coordenadas do produto com debounce
  const updateProductCoordinates = async (product: Product, coords: { x: number, y: number }) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setUpdateSuccess(null);
        const token = getAuthToken();
        if (!token) {
          throw new Error("Sem autenticação");
        }
        
        await updateProduct({...product, coordinates: coords}, token);
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === product.id ? { ...p, coordinates: coords } : p)
        );
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(null), 3000);
      } catch (err) {
        console.error("Erro ao atualizar coordenadas:", err);
        setUpdateSuccess(false);
      } finally {
        setIsSaving(false);
      }
    }, 800); // Debounce
  };

  // Funções para manipular o arrasto
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x: canvasX, y: canvasY } = clientToCanvasCoordinates(e.clientX, e.clientY, canvas);
    
    // Verificar se o clique foi em algum marcador
    for (const product of filteredProducts) {
      if (hasValidCoordinates(product)) {
        const distance = calculateDistance(canvasX, canvasY, product);
        if (distance < 30) {
          setSelectedProduct(product);
          setTemporaryCoordinates(product.coordinates!);
          setIsDragging(true);
          return;
        }
      }
    }
    setSelectedProduct(null);
    setTemporaryCoordinates(null);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedProduct || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { x: canvasX, y: canvasY } = clientToCanvasCoordinates(e.clientX, e.clientY, canvas);
    
    setTemporaryCoordinates({ x: canvasX, y: canvasY });
    redrawMap(canvasX, canvasY);
  };
  
  const handleMouseUp = () => {
    if (isDragging && selectedProduct && temporaryCoordinates) {
      setIsDragging(false);
      const updatedProduct = {...selectedProduct, coordinates: temporaryCoordinates}
      setSelectedProduct(updatedProduct);
      updateProductCoordinates(updatedProduct, temporaryCoordinates);
    }
  };

  return (
    <div className="page-container">
      <div className="content">
        <h1 className="title">MAPA DE PRODUTOS</h1>
        
        <div className="search-container">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
               type="text"
               className="search-input"
               placeholder="Pesquise produtos por nome ou código..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="map-page-container">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : (
            <div className="map-wrapper">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}                
                style={{ 
                  maxWidth: '100%',
                  height: 'auto',
                  display: isLoading ? 'none' : 'block',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              />
              {isLoading && (
                <div className="loading-overlay">
                  A carregar o mapa...
                </div>
              )}
            </div>
          )}

          <div className="map-status-panel">
            {/* Map State */}
            {isSaving && (
              <div className="save-indicator">
                <i className="fas fa-spinner fa-spin"></i> A guardar posição...
              </div>
            )}
            {updateSuccess === true && (
              <div className="success-message">
                <i className="fas fa-check-circle"></i> Posição guardada com sucesso!
              </div>
            )}
            {updateSuccess === false && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> Tens que ser admin para alterares a posição.
              </div>
            )}
            
            {/* Lista de produtos sem coordenadas */}
            {getUnmappedProducts(filteredProducts).length > 0 && (
              <div className="unmapped-products">
                <h3>Produtos sem localização no mapa</h3>
                <div className="unmapped-products-list">
                  {getUnmappedProducts(filteredProducts)
                    .map(product => (
                      <div key={product.id} className="unmapped-product-item">
                        <span className="product-name">{product.name}</span>
                        <span className="product-id">({product.id})</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
