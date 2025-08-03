import React, { useState, useRef, useEffect } from "react";
import type { Product } from "@/types/product";
import { searchProducts } from "@/api/products";
import "./SearchBar.css";

interface SearchBarProps {
  onProductSelect: (product: Product) => void;
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onProductSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // To detect clicks outside the modal and close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle search input changes with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    
    debounceTimeout.current = setTimeout(async () => {
      try {
        const results = await searchProducts(value);
        setSearchResults(results);
      } catch (error) {
        console.error("Erro ao procurar produtos:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelectProduct = (product: Product) => {
    onProductSelect(product);
  };

  return (
    <div className="searchbar-container">
      <div className="searchbar-modal" ref={modalRef}>
        <h2>Procurar Produto</h2>

        {/* Input field for searching products */}
        <input
          type="text"
          placeholder="Digite para buscar..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="searchbar-input"
          autoFocus
        />
        
        {/* Search results or loading state */}
        {isLoading ? (
          <div className="searchbar-loading">Carregando...</div>
        ) : (
          <div>
            {searchResults.length > 0 ? (
              <div className="searchbar-results-container">
                {searchResults.map((product: Product) => (
                  <div 
                    key={product.id}
                    className="searchbar-result-item"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div><strong>{product.name}</strong></div>
                    <div>Código: {product.id}</div>
                    <div>Unidade: {product.unit}</div>
                  </div>
                ))}
              </div>
            ) : (
              searchTerm.trim() && <div className="searchbar-no-results">Nenhum resultado encontrado</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
