import React  from "react";
import { useState, useEffect, useRef } from "react";
import type { Product } from "../../../types/product";
import { updateProduct } from "../../../api/products";
import { getAuthToken } from "../../../api/auth";
import { ASSETS } from "../../../constants/index"
import "./ProductMap.css";


interface ProductMapProps {
   product: Product;
   mapPath?: string;
   onClose: () => void;
}

const ProductMap: React.FC<ProductMapProps> = ({ product, mapPath, onClose }) => {
   const [isLoadingMap, setIsLoadingMap] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [canvasReady, setCanvasReady] = useState(false);
   const [isDragging, setIsDragging] = useState(false);
   const [currentCoordinates, setCurrentCoordinates] = useState(product.coordinates || { x: 0, y: 0 });
   const [temporaryCoordinates, setTemporaryCoordinates] = useState(product.coordinates || { x: 0, y: 0 });
   const [isSaving, setIsSaving] = useState(false);
   const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
   
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const mapImage = mapPath || ASSETS.MAP_PATH;
   const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
   
   // Referência da imagem do mapa
   const mapImageRef = useRef<HTMLImageElement | null>(null);
   
   // Função para redesenhar o mapa com o marcador na nova posição sem recarregar a imagem
   const redrawMap = (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Se já temos a imagem carregada, use-a diretamente
      if (mapImageRef.current) {
         // Limpar canvas
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         
         // Desenhar mapa usando imagem em cache
         ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);
         
         // Desenhar marcador na nova posição
         ctx.fillStyle = "#FF4136";
         ctx.beginPath();
         ctx.arc(x, y, 40, 0, Math.PI * 2);
         ctx.fill();
         
         // Adicionar borda ao círculo
         ctx.strokeStyle = "white";
         ctx.lineWidth = 2;
         ctx.stroke();
         
         // Desenhar texto com nome do produto
         ctx.font = "20px Arial";
         ctx.fillStyle = "black";
         ctx.textAlign = "center";
         ctx.fillText(product.name, x, y);
      }
   };

   // Função para atualizar coordenadas do produto com debounce
   const updateProductCoordinates = async (coords: { x: number, y: number }) => {
      // Limpar timer anterior se existir
      if (debounceTimerRef.current) {
         clearTimeout(debounceTimerRef.current);
      }
      
      // Criar novo timer para debounce
      debounceTimerRef.current = setTimeout(async () => {
         try {
            setIsSaving(true);
            setUpdateSuccess(null);
            
            // Criar uma cópia do produto com novas coordenadas
            const updatedProduct = {
               ...product,
               coordinates: coords
            };
            
            // Chamar API para atualizar
            const token = getAuthToken();
            if (!token) {
               throw new Error("Sem autenticação");
            }
            
            await updateProduct(updatedProduct, token);
            
            // Sucesso
            setUpdateSuccess(true);
            setTimeout(() => setUpdateSuccess(null), 3000); // Limpar mensagem após 3 segundos
         } catch (err) {
            console.error("Erro ao atualizar coordenadas:", err);
            setUpdateSuccess(false);
         } finally {
            setIsSaving(false);
         }
      }, 800); // 800ms de debounce
   };

   // Funções para manipular o arrasto
   const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Converter as coordenadas do cliente para coordenadas do canvas
      const canvasX = (mouseX / rect.width) * canvas.width;
      const canvasY = (mouseY / rect.height) * canvas.height;
      
      // Verificar se o clique foi no marcador
      const dx = canvasX - temporaryCoordinates.x;
      const dy = canvasY - temporaryCoordinates.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Se o clique for próximo o suficiente do marcador (raio maior para facilitar), iniciar arrasto
      if (distance < 40) {
         setIsDragging(true);
      }
   };
   
   const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Converter as coordenadas do cliente para coordenadas do canvas
      const canvasX = (e.clientX - rect.left) / rect.width * canvas.width;
      const canvasY = (e.clientY - rect.top) / rect.height * canvas.height;
      
      setTemporaryCoordinates({ x: canvasX, y: canvasY });
      
      // Redesenhar o mapa com o novo marcador
      redrawMap(canvasX, canvasY);
   };
   
   const handleMouseUp = () => {
      if (isDragging) {
         setIsDragging(false);
         setCurrentCoordinates(temporaryCoordinates);
         // Atualizar coordenadas no backend
         updateProductCoordinates(temporaryCoordinates);
      }
   };

   // Carregar o mapa quando o canvas estiver pronto
   useEffect(() => {
      if (!canvasReady) {
         return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
         // Tentar novamente em um curto período de tempo
         const timer = setTimeout(() => {
            setIsLoadingMap(prev => {
               if (prev) return prev;
               return true;
            });
         }, 100);
         return () => clearTimeout(timer);
      }
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
         console.error("Could not get 2D context from canvas");
         return;
      }

      setIsLoadingMap(true);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = mapImage + `?t=${new Date().getTime()}`; // Adiciona um timestamp para evitar cache
      console.log("Loading image from source:", img.src);
      
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
         
         // Armazenar a imagem para reutilização
         mapImageRef.current = img;
         
         // Desenhar a imagem do mapa
         ctx.drawImage(img, 0, 0, newWidth, newHeight);
         
         // Desenhar um marcador na posição do produto
         const coords = currentCoordinates;

         console.log("Current coordinates:", coords);
         // Desenhar um círculo vermelho
         ctx.fillStyle = "#FF4136";
         ctx.beginPath();
         ctx.arc(coords.x, coords.y, 40, 0, Math.PI * 2);
         ctx.fill();
         
         // Adicionar borda ao círculo
         ctx.strokeStyle = "white";
         ctx.lineWidth = 2;
         ctx.stroke();
         
         // Desenhar texto com nome do produto
         ctx.font = "20px Arial";
         ctx.fillStyle = "black";
         ctx.textAlign = "center";
         ctx.fillText(product.name, coords.x, coords.y);
         
         setIsLoadingMap(false);
      };
      
      img.onerror = () => {
         console.error("Error loading image from source:", img.src);
         setError("Não foi possível carregar a imagem do mapa");
         setIsLoadingMap(false);
      };
   }, [product.name, mapImage, canvasReady, currentCoordinates]);

   const handleClose = () => {
      onClose();
   };

   return (
      <div>
         <div className="product-form-header">
            <h3>Localização: {product.name}</h3>
            <button className="close-button" onClick={handleClose}>
               <i className="fas fa-times"></i>
            </button>
         </div>
         
         {error ? (
            <div className="error-message">
               <p>{error}</p>
            </div >
         ) : (
            <div className="map-container">  
               <canvas
                  ref={(el) => {
                     canvasRef.current = el;
                     if (el && !canvasReady) setCanvasReady(true);
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{ 
                     maxWidth: '100%',
                     height: 'auto',
                     display: isLoadingMap ? 'none' : 'block',
                     border: '1px solid rgba(255, 255, 255, 0.2)',
                     cursor: isDragging ? 'grabbing' : 'pointer'
                  }}               
               />
               {isLoadingMap && (
                  <div className="loading">A carregar o mapa...</div>
               )}
            </div>
         )}
         
         <div className="form-actions">
            {isSaving && (
               <div className="status-message save-indicator">
                  <i className="fas fa-spinner fa-spin"></i> A guardar posição...
               </div>
            )}
            {updateSuccess === true && (
               <div className="status-message success-message">
                  <i className="fas fa-check-circle"></i> Posição guardada!
               </div>
            )}
            {updateSuccess === false && (
               <div className="status-message error-message">
                  <i className="fas fa-exclamation-circle"></i> Erro ao guardar
               </div>
            )}
            <button onClick={onClose} className="admin-btn admin-btn-primary">
               <i className="fas fa-times"></i>&nbsp;Fechar
            </button>
         </div>
      </div>  
   );
}

export default ProductMap;
