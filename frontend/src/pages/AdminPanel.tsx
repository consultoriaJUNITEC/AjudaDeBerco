import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthRole, isAuthenticated, isTokenPresent } from "../api/auth";
import AuthenticationMenu from "./AuthenticationMenu";
import ProductsTab from "../components/adminPanel/ProductsTab";
import CartsTab from "../components/adminPanel/CartsTab";
import DonorsTab from "../components/adminPanel/DonorsTab";
import "./AdminPanel.css";

type TabType = "products" | "carts" | "donors";

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('activeAdminTab');
    return savedTab ? (savedTab as TabType) : "products";
  });

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      setIsValidating(true);
      try {
        const authStatus = await isAuthenticated();
        setAuthenticated(authStatus);
        if (authStatus) {
          const role = getAuthRole();
          setAuthRole(role);
        }
      } catch (err) {
        console.error("Error validating authentication:", err);
        setAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };
    // Just for rendering UI while validating
    setAuthenticated(isTokenPresent());
    // Real authentication check
    checkAuth();
  }, []);

  // Handle tab switching
  const handleTabChange = (tab: TabType) => {
    localStorage.setItem('activeAdminTab', tab);
    setActiveTab(tab);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="container-adminpanel">
        <div className="content">
          <div className="loading">A verificar a autenticação...</div>
        </div>
      </div>
    );
  }

  // Show authentication menu if not authenticated
  if (!authenticated) {
    return (
      <div className="container-adminpanel">
          <AuthenticationMenu 
            onLoginSuccess={handleLoginSuccess} 
          />
      </div>
    );
  }

  if (authRole !== "admin") {
    //reroute to home if not admin
    navigate("/");
    return null;
  }  
  // Render the admin panel if authenticated
  return (
    <div className="container-adminpanel">
      <div className="content">
        {/* Page title */}
        <h1 className="title">Painel de Administrador</h1>

        {/* Tab Navigation */}          
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            <i className="fas fa-box-open"></i> Produtos
          </button>
          <button 
            className={`tab-button ${activeTab === "carts" ? "active" : ""}`}
            onClick={() => handleTabChange("carts")}
          >
            <i className="fas fa-shopping-cart"></i> Carrinhos
          </button>
          <button 
            className={`tab-button ${activeTab === "donors" ? "active" : ""}`}
            onClick={() => handleTabChange("donors")}
          >
            <i className="fas fa-hand-holding-heart"></i> Doadores
          </button>
        </div>

        {/* Tab Content - All tabs remain mounted but only one is visible */}
        <div style={{ display: activeTab === "products" ? "block" : "none" }}>
          <ProductsTab isActive={activeTab === "products"} />
        </div>
        <div style={{ display: activeTab === "carts" ? "block" : "none" }}>
          <CartsTab isActive={activeTab === "carts"} />
        </div>
        <div style={{ display: activeTab === "donors" ? "block" : "none" }}>
          <DonorsTab isActive={activeTab === "donors"} />
        </div>

        {/* Bottom Navigation */}
        <div className="admin-footer">
          <button
            className="admin-btn"
            onClick={() => navigate("/")}
          >
            <i className="fas fa-home"></i>&nbsp;Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
