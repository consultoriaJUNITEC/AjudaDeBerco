import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoAjudaDeBerco from "./LogoAjudaDeBerco";
import "./Header.css";
import { isTokenPresent, getAuthRole } from "../api/auth";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);

  // Detect scroll to change header style
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close the mobile menu when the location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Initialize auth state from localStorage and listen to storage/custom events
  useEffect(() => {
    const readAuth = () => {
      setIsLoggedIn(isTokenPresent());
      setRole(getAuthRole());
    };

    readAuth();

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === "authToken" || e.key === "authRole") {
        readAuth();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", readAuth as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", readAuth as EventListener);
    };
  }, []);

  return (
    <header className={`header ${isScrolled ? "header-scrolled" : ""}`}>
      <div className="header-containerr">  
        {/* Logo no canto esquerdo */}     
        <div className="header-logo">
          <LogoAjudaDeBerco/>
        </div>

        <div
          className="hamburger-menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <div
            className={`hamburger-line ${mobileMenuOpen ? "active" : ""}`}
          ></div>
          <div
            className={`hamburger-line ${mobileMenuOpen ? "active" : ""}`}
          ></div>
          <div
            className={`hamburger-line ${mobileMenuOpen ? "active" : ""}`}
          ></div>
        </div>

        <nav className={`main-nav ${mobileMenuOpen ? "open" : ""}`}>
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/novo-carrinho"
                className={location.pathname === "/novo-carrinho" ? "active" : ""}
              >
                Novo Carrinho
              </Link>
            </li>            
            <li>
              <Link
                to="/mapa"
                className={location.pathname === "/mapa" ? "active" : ""}
              >
                Mapa
              </Link>
            </li>
            {/* Show admin link only for admin users. If not logged in, show 'authenticar' linking to login. */}
            {isLoggedIn ? (
              role === "admin" ? (
                <li>
                  <Link
                    to="/admin"
                    className={location.pathname === "/admin" ? "active" : ""}
                  >
                    Administrador
                  </Link>
                </li>
              ) : null
            ) : (
              <li>
                <Link to="/login" className={location.pathname === "/login" ? "active" : ""}>
                  Autenticar
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
