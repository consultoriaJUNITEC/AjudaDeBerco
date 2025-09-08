import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Donor } from "../../types/donor";
import { getAllDonors, deleteDonor } from "../../api/donors";
import { isAuthenticated, getAuthToken } from "../../api/auth";
import DonorsTabForm from "./DonorsTabForm";
import "./DonorsTab.css";

interface DonorsTabProps {
  isActive?: boolean;
}

const DonorsTab: React.FC<DonorsTabProps> = ({ isActive = true }) => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoadingDonors, setIsLoadingDonors] = useState<boolean>(true);
  const [donorError, setDonorError] = useState<string | null>(null);
  
  // Estado para controlar o menu de ações em mobile
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  const isFirstLoad = useRef<boolean>(true);
  const hasLoadedData = useRef<boolean>(false);
  const lastDataString = useRef<string>("");

  // Form state for adding/editing donors
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentDonor, setCurrentDonor] = useState<Donor>({
    id: "",
    name: "",
  });

  // Fetch all donors
  const fetchDonors = useCallback(async () => {
    setIsLoadingDonors(true);
    try {
      const data = await getAllDonors();
      const dataString = JSON.stringify(data);
      lastDataString.current = dataString;
      setDonors(data);
      setFilteredDonors([...data].sort((a, b) => a.id.localeCompare(b.id)));
      setDonorError(null);
      hasLoadedData.current = true;
    } catch (err) {
      const errorMsg = "Erro ao carregar doadores. Por favor tente novamente.";
      setDonorError(errorMsg);
      console.error(err);
    } finally {
      setIsLoadingDonors(false);
    }
  }, []);

  // Fetch donors whenever the tab becomes active
  useEffect(() => {
    if (isFirstLoad.current || !hasLoadedData.current) {
      fetchDonors();
      isFirstLoad.current = false;
    } else {
      fetchDonorsSilently();
    }
  }, [isActive, fetchDonors]);

  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Filter donors when searchTerm or donors change - with improved inclusive search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDonors([...donors].sort((a, b) => a.id.localeCompare(b.id)));
    } else {
      const normalizedSearchTerm = normalizeText(searchTerm);
      const searchTerms = normalizedSearchTerm.split(/\s+/);
      
      // Filter donors - donor matches if ANY search term is found in name or id
      const filtered = donors
        .filter(donor => {
          const normalizedName = normalizeText(donor.name);
          const normalizedId = normalizeText(donor.id);
          
          // Check if any search term is in the name or ID
          return searchTerms.some(term => 
            normalizedName.includes(term) || normalizedId.includes(term)
          );
        })
        .sort((a, b) => {
          // Prioritize exact matches, then sort alphabetically
          const nameA = normalizeText(a.name);
          const nameB = normalizeText(b.name);
          
          const aStartsWithTerm = searchTerms.some(term => nameA.startsWith(term));
          const bStartsWithTerm = searchTerms.some(term => nameB.startsWith(term));
          
          if (aStartsWithTerm && !bStartsWithTerm) return -1;
          if (!aStartsWithTerm && bStartsWithTerm) return 1;
          
          return a.name.localeCompare(b.name);
        });
      
      setFilteredDonors(filtered);
    }
  }, [searchTerm, donors]);


  // Fetch donors silently (without loading state)
  const fetchDonorsSilently = async () => {
    try {
      const data = await getAllDonors();
      const dataString = JSON.stringify(data);
      // Only update state if data has changed
      if (dataString !== lastDataString.current) {
        lastDataString.current = dataString;
        setDonors(data);
        setFilteredDonors([...data].sort((a, b) => a.name.localeCompare(b.name)));
        hasLoadedData.current = true;
        console.log("Donor data updated silently");
      }
    } catch (err) {
      console.error("Error in silent donor check:", err);
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
    await fetchDonors();
    setCurrentDonor({ id: "", name: "" });
    setDonorError(null);
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setCurrentDonor({ id: "", name: "" });
  };

  // Handle donor deletion
  const handleDelete = async (donorId: string) => {
    if (window.confirm("Queres mesmo eliminar este doador?")) {
      setIsLoadingDonors(true);
      try {
        const isValid = await isAuthenticated();
        if (!isValid) {
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        await deleteDonor(donorId, getAuthToken()!);
        await fetchDonors();
      } catch (err) {
        const errorMsg = "Erro ao excluir doador. Por favor tente novamente.";
        setDonorError(errorMsg);
        console.error(err);
      } finally {
        setIsLoadingDonors(false);
      }
    }
  };

  // Handle edit button
  const handleEditClick = (donor: Donor) => {
    setCurrentDonor(donor);
    setFormMode("edit");
    setShowForm(true);
  };
  // Handle add new button
  const handleAddNew = () => {
    setCurrentDonor({ id: "", name: "" });
    setFormMode("add");
    setShowForm(true);
  };
  
  // Click outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fecha o menu de ações mobile quando clicar fora
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

  return (
    <div className="card-adminpanel">
      <div className="admin-header">
        <h2 className="table-title">Gestão de Doadores</h2>
        <button className="admin-btn admin-btn-primary" onClick={handleAddNew}>
          + Novo
        </button>
      </div>

      {/* Error Message */}
      {donorError && <div className="error-message">{donorError}</div>}

      {/* Add/Edit Form as Overlay */}
      {showForm && (
        <DonorsTabForm
          formMode={formMode}
          initialDonor={currentDonor}
          isLoading={isLoadingDonors}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          onError={(error) => {
            setDonorError(error);
          }}
        />
      )}

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder={window.innerWidth < 786 ? "Pesquisar por código/nome" : "Pesquisar doadores por nome ou código..."}
            value={searchTerm}
            onChange={handleSearchChange}
            id="donor-search-input"
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
      </div>

      {/* Donors Table */}
      <div className="table-wrapper">
        {isLoadingDonors && !showForm ? (
          <div className="loading">A carregar doadores...</div>
        ) : (
          <table className="donors-table">
            <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>              
              <tr>
                <th>Nome</th>
                <th className="actions-header">Ações</th>
              </tr>
            </thead>
            <tbody style={{ display: 'block', maxHeight: '400px', overflow: 'auto' }}>
              {filteredDonors.length > 0 ? (
                filteredDonors.map((donor) => (
                  <tr key={donor.id}>                    
                    <td>{donor.id}</td>
                    <td>{donor.name}</td>
                    <td className="actions-cell">
                      {/* Botões de ação para desktop */}
                      <div className="action-buttons">
                        <button
                          className="icon-button edit"
                          onClick={() => handleEditClick(donor)}
                          title="Editar doador"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDelete(donor.id)}
                          title="Eliminar doador"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                      
                      {/* Botão de menu para mobile */}
                      <button 
                        className="mobile-menu-button"
                        onClick={() => setActiveActionMenu(activeActionMenu === donor.id ? null : donor.id)}
                        title="Menu de ações"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      
                      {/* Menu dropdown para mobile */}
                      <div className={`mobile-menu ${activeActionMenu === donor.id ? 'show' : ''}`}>
                        <button
                          className="icon-button edit"
                          onClick={() => {
                            handleEditClick(donor);
                            setActiveActionMenu(null);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                          Editar
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => {
                            handleDelete(donor.id);
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
                <tr>
                  <td colSpan={3} className="empty-table">
                    {searchTerm ? "Nenhum doador encontrado." : "Não há doadores registados."}
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

export default DonorsTab;
