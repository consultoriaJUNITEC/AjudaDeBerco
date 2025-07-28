import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Product } from "../../types/product";
import { getAllProducts, deleteProduct, getProductById } from "../../api/products";
import { isAuthenticated, getAuthToken } from "../../api/auth";
import { PRODUCT_CATEGORIES } from "../../constants/index";
import ProductsTabForm from "./ProductsTabForm";
import ProductMap from "./ProductMap";
import "./ProductsTab.css";

interface ProductsTabProps {
  isActive?: boolean;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ isActive = true }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productError, setProductError] = useState<string | null>(null);
  
  // Estado para controlar o menu de ações em mobile
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  // Click outside handler for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      
      // Também fecha o menu de ações mobile quando clicar fora
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


  const isFirstLoad = useRef<boolean>(true);
  const hasLoadedData = useRef<boolean>(false);
  const lastDataString = useRef<string>("");

  // Form state for adding/editing products
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    id: "",
    name: "",
    unit: "",
  });

  // Product Map overlay state
  const [showMap, setShowMap] = useState<boolean>(false);
  const [productToMap, setProductToMap] = useState<Product | null>(null);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await getAllProducts();

      // Convert to string for comparison
      const dataString = JSON.stringify(data);
      lastDataString.current = dataString;
      // Set state
      setProducts(data);
      setFilteredProducts([...data].sort((a, b) => a.id.localeCompare(b.id)));
      setProductError(null);
      hasLoadedData.current = true;
      
    } catch (err) {
      const errorMsg = "Erro ao carregar produtos. Por favor tente novamente.";
      setProductError(errorMsg);
      console.error(err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Fetch products whenever the tab becomes active
  useEffect(() => {
    if (isFirstLoad.current || !hasLoadedData.current) {
      fetchProducts();
      isFirstLoad.current = false;
    } else {
      fetchProductsSilently();
    }
  }, [isActive, fetchProducts]);

  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Filter products when searchTerm, selectedCategory or products change
  useEffect(() => {
    let filtered = [...products];

    // Apply category filter first
    if (selectedCategory !== "all") {
      const categoryPrefix = PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES];
      filtered = filtered.filter(product => product.id.startsWith(categoryPrefix));
    }

    // Then apply search filter if there's a search term
    if (searchTerm.trim()) {
      const normalizedSearchTerm = normalizeText(searchTerm);
      const searchTerms = normalizedSearchTerm.split(/\s+/);
      
      filtered = filtered.filter(product => {
        const normalizedName = normalizeText(product.name);
        const normalizedId = normalizeText(product.id);
        
        return searchTerms.some(term => 
          normalizedName.includes(term) || normalizedId.includes(term)
        );
      });

      // Sort with priority for search matches
      filtered.sort((a, b) => {
        const nameA = normalizeText(a.name);
        const nameB = normalizeText(b.name);
        
        const aStartsWithTerm = searchTerms.some(term => nameA.startsWith(term));
        const bStartsWithTerm = searchTerms.some(term => nameB.startsWith(term));
        
        if (aStartsWithTerm && !bStartsWithTerm) return -1;
        if (!aStartsWithTerm && bStartsWithTerm) return 1;
        
        return a.name.localeCompare(b.name);
      });
    }
    setFilteredProducts(filtered);
  }, [searchTerm, products, selectedCategory]);


  // Fetch products silently (without loading state)
  const fetchProductsSilently = async () => {
    try {
      const data = await getAllProducts();
      // Convert to string for comparison
      const dataString = JSON.stringify(data);
      
      // Only update state if data has changed
      if (dataString !== lastDataString.current) {
        lastDataString.current = dataString;
        setProducts(data);
        setFilteredProducts([...data].sort((a, b) => a.name.localeCompare(b.name)));
        hasLoadedData.current = true;
      }
    } catch (err) {
      console.error("Error in silent product check:", err);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Handle form success
  const handleFormSuccess = async () => {
    await fetchProducts();
    setCurrentProduct({ id: "", name: "", unit: "" });
    setProductError(null);
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentProduct({ id: "", name: "", unit: "" });
    setProductError(null);
  };

  // Handle product deletion
  const handleDelete = async (productId: string) => {
    if (window.confirm("Queres mesmo eliminar este produto?")) {
      setIsLoadingProducts(true);
      try {
        // Check token validity before deletion
        const isValid = await isAuthenticated();
        if (!isValid) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        await deleteProduct(productId, getAuthToken()!);
        await fetchProducts();
      } catch (err) {
        const errorMsg = "Erro ao eliminar produto. Por favor tente novamente.";
        setProductError(errorMsg);
        console.error(err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
  };

  const handleSeeMap = (product: Product) => {
    setProductToMap(product);
    setShowMap(true);
  }
  
  const handleMapClose = async (product: Product) => {
    product = await getProductById(product.id);
    setProductToMap(product);
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === product.id ? product : p))
    );
    setShowMap(false);
}

  // Handle edit button
  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    setFormMode("edit");
    setShowForm(true);
    setProductError(null); // Limpar erro quando abrir formulário de edição
  };

  // Handle add new button
  const handleAddNew = () => {
    setCurrentProduct({ id: "", name: "", unit: "" });
    setFormMode("add");
    setShowForm(true);
    setProductError(null); // Limpar erro quando abrir novo formulário
  };

  return (
    <div className="card-adminpanel">
      <div className="admin-header">
        <h2>Gestão de Produtos</h2>
        <button className="admin-btn admin-btn-primary" onClick={handleAddNew}>
          + Novo
        </button>
      </div>

      {/* Error Message */}
      {productError && <div className="error-message">{productError}</div>}

      {/* Add/Edit Form as Overlay */}
      {showForm && (
        <ProductsTabForm
          formMode={formMode}
          initialProduct={currentProduct}
          isLoading={isLoadingProducts}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          onError={(error) => {
            setProductError(error);
          }}
        />
      )}

      {/* Product Map Overlay */}
      {showMap && (
        <div className="overlay">
          <div className="overlay-content map-overlay">
            <ProductMap
              product={productToMap!}
              onClose={() => productToMap && handleMapClose(productToMap)}
            />
          </div>
        </div>
      )}

      {/* Search Bar and Category Filter */}
      <div className="search-container">
        <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
            type="text"
            className="search-input"
            placeholder="Pesquisar"
            value={searchTerm}
            onChange={handleSearchChange}
            id="product-search-input"
            />
          {searchTerm && (
            <button 
              className="search-clear-button"
              onClick={handleClearSearch}
              title="Limpar pesquisa"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="category-filter-container" ref={categoryDropdownRef}>
          <button 
            className={`admin-btn admin-btn-primary category-filter-button ${selectedCategory !== 'all' ? 'active' : ''}`}
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            type="button"
          >
            <i className="fas fas fa-sliders"></i>
            {selectedCategory === 'all' ? 'Categoria' : selectedCategory}
          </button>
          <div className={`category-dropdown ${showCategoryDropdown ? 'show' : ''}`}>
            <div 
              className={`category-option ${selectedCategory === 'all' ? 'selected' : ''}`}
              onClick={() => {
                setSelectedCategory('all');
                setShowCategoryDropdown(false);
              }}
            >
              Todas as Categorias
            </div>
            {Object.entries(PRODUCT_CATEGORIES).map(([category]) => (
              <div 
                key={category}
                className={`category-option ${selectedCategory === category ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(category);
                  setShowCategoryDropdown(false);
                }}
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-wrapper">
        {isLoadingProducts && !showForm ? (
          <div className="loading">A carregar produtos...</div>
        ) : (
          <table className="products-table">
            <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <tr>
                <th>Produto</th>
                <th className="hide-on-mobile">Unidade</th>
                <th className="actions-header">Ações</th>
              </tr>
            </thead>
            <tbody style={{ display: 'block', maxHeight: '400px', overflow: 'auto' }}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (                  
                <tr key={product.id} style={{ display: 'table', width: '100%', tableLayout: 'fixed'}}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td className="hide-on-mobile">{product.unit}</td>
                    <td className="actions-cell">                      
                      {/* Botões de ação para desktop */}
                      <div className="action-buttons">
                        <button
                          className="icon-button map"
                          onClick={() => handleSeeMap(product)}
                          title="Mapa"
                        >
                          <i className="fas fa-map"></i>
                        </button>
                        <button
                          className="icon-button edit"
                          onClick={() => handleEditClick(product)}
                          title="Editar produto"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDelete(product.id)}
                          title="Eliminar produto"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                      
                      {/* Botão de menu para mobile */}
                      <button 
                        className="mobile-menu-button"
                        onClick={() => setActiveActionMenu(activeActionMenu === product.id ? null : product.id)}
                        title="Menu de ações"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      
                      {/* Menu dropdown para mobile */}
                      <div className={`mobile-menu ${activeActionMenu === product.id ? 'show' : ''}`}>
                        <button
                          className="icon-button map"
                          onClick={() => {
                            handleSeeMap(product);
                            setActiveActionMenu(null);
                          }}
                        >
                          <i className="fas fa-map"></i>
                          Mapa
                        </button>
                        <button
                          className="icon-button edit"
                          onClick={() => {
                            handleEditClick(product);
                            setActiveActionMenu(null);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                          Editar
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => {
                            handleDelete(product.id);
                            setActiveActionMenu(null);
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                  <td colSpan={4} className="empty-table">
                    {searchTerm ? "Nenhum produto encontrado." : "Não há produtos registados."}
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

export default ProductsTab;
