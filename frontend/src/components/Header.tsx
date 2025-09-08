import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoAjudaDeBerco from "./LogoAjudaDeBerco";
import "./Header.css";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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
            <li>
              <Link
                to="/admin"
                className={location.pathname === "/admin" ? "active" : ""}
              >
                Administrador
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
