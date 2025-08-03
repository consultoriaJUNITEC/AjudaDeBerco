import React, { useState } from "react";
import type { Donor } from "@/types/donor";
import { createDonor, updateDonor } from "@/api/donors";
import { isAuthenticated, getAuthToken } from "@/api/auth";
import "./DonorsTabForm.css";

interface DonorsTabFormProps {
  formMode: "add" | "edit";
  initialDonor: Donor;
  isLoading: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  onError: (error: string | null) => void;
}

const DonorsTabForm: React.FC<DonorsTabFormProps> = ({
  formMode,
  initialDonor,
  isLoading,
  onClose,
  onSuccess,
  onError,
}) => {
  const [donor, setDonor] = useState<Donor>({ ...initialDonor });
  const [processing, setProcessing] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    id?: string;
    name?: string;
  }>({});

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDonor((prev) => ({ ...prev, [name]: value }));

    // Clear validation errors as user types
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form inputs
  const validate = (): boolean => {
    const errors: { id?: string; name?: string } = {};

    if (formMode === "add" && !donor.id) {
      errors.id = "O código do doador é obrigatório";
    } else if (formMode === "add" && donor.id.length > 10) {
      errors.id = "O código deve ter no máximo 10 caracteres";
    }

    if (!donor.name) {
      errors.name = "O nome do doador é obrigatório";
    } else if (donor.name.length > 100) {
      errors.name = "O nome deve ter no máximo 100 caracteres";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    onError(null);

    if (!validate()) {
      return;
    }

    setProcessing(true);
    try {
      // Check token validity before submission
      const isValid = await isAuthenticated();
      if (!isValid) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      if (formMode === "add") {
        await createDonor(donor, token);
      } else {
        await updateDonor(donor, token);
      }

      await onSuccess();
      onClose();

    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Sessão expirada")) {
          // Session expiration is handled elsewhere
          throw err;
        }
        onError(err.message);
      } else {
        onError("Ocorreu um erro inesperado. Por favor, tente novamente.");
      }
    } finally {
      setProcessing(false);
    }
  };
  return (
    <div className="donor-form-overlay">
      <div className="donor-form-modal">
        <div className="donor-form-header">
          <h3>{formMode === "add" ? "Adicionar Doador" : "Editar Doador"}</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={processing}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          {/* ID Field - only editable when adding */}
          <div className="form-group">
            <label htmlFor="id">Código</label>
            <input
              type="text"
              id="id"
              name="id"
              value={donor.id}
              onChange={handleChange}
              disabled={formMode === "edit" || processing}
              placeholder="Código do doador"
              className={validationErrors.id ? "error" : ""}
            />
            {validationErrors.id && (
              <div className="error-text">{validationErrors.id}</div>
            )}
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={donor.name}
              onChange={handleChange}
              disabled={processing}
              placeholder="Nome do doador"
              className={validationErrors.name ? "error" : ""}
            />
            {validationErrors.name && (
              <div className="error-text">{validationErrors.name}</div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={processing || isLoading}
            >
              {processing || isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> A processar...
                </>
              ) : formMode === "add" ? (
                "Adicionar"
              ) : (
                "Atualizar"
              )}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onClose}
              disabled={processing}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonorsTabForm;
