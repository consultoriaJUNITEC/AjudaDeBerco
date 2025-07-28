import React, { useState } from "react";
import type { Product } from "../../types/product";
import { createProduct, updateProduct } from "../../api/products";
import { isAuthenticated, getAuthToken } from "../../api/auth";
import { PRODUCT_UNITS } from "../../constants/index";
import "./ProductsTabForm.css";

interface ProductsTabFormProps {
  formMode: "add" | "edit";
  initialProduct: Product;
  isLoading: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  onError: (error: string | null) => void;
}

const ProductsTabForm: React.FC<ProductsTabFormProps> = ({
  formMode,
  initialProduct,
  isLoading,
  onClose,
  onSuccess,
  onError,
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle form changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpar erros quando o usuário começar a digitar
    if (localError) {
      setLocalError(null);
      onError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product.id || !product.name || !product.unit) {
      const errorMsg = "Todos os campos são obrigatórios.";
      setLocalError(errorMsg);
      onError(errorMsg);
      return;
    }

    try {
      // Check token validity before submission
      const isValid = await isAuthenticated();
      if (!isValid) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      if (formMode === "add") {
        await createProduct(product, getAuthToken()!);
      } else {
        await updateProduct(product, getAuthToken()!);
      }

      // Refresh product list
      await onSuccess();
      
      // Reset error state
      setLocalError(null);
      onError(null);
      
      // Close the form
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message.includes("Sessão expirada")) {
        // Handle session expiration elsewhere
        throw err;
      } else {
        const errorMsg = `Erro ao ${
          formMode === "add" ? "adicionar" : "atualizar"
        } produto. Por favor tente novamente.`;
        setLocalError(errorMsg);
        onError(errorMsg);
        console.error(err);
      }
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-modal">
        <div className="product-form-header">
          <h3>
            {formMode === "add" ? "Adicionar Novo Produto" : "Editar Produto"}
          </h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {localError && <div className="error-message">{localError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Código do Produto</label>
            <input
              type="text"
              name="id"
              value={product.id}
              onChange={handleInputChange}
              className="input"
              placeholder="Código"
              disabled={formMode === "edit"} // ID can't be changed when editing
            />
          </div>

          <div className="form-field">
            <label>Nome do Produto</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              className="input"
              placeholder="Nome"
            />
          </div>
          <div className="form-field">
            <label>Unidade</label>
            <select
              name="unit"
              value={product.unit}
              onChange={handleInputChange}
              className="select"
            >
              <option value="">Selecione uma unidade</option>
              {PRODUCT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? "A carregar..."
                : formMode === "add"
                ? "Adicionar"
                : "Atualizar"}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductsTabForm;
