"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoAjudaDeBerco from "./LogoAjudaDeBerco";
import "./Header.css";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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

  // Close the mobile menu when the pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
                href="/"
                className={pathname === "/" ? "active" : ""}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/novo-carrinho"
                className={pathname === "/novo-carrinho" ? "active" : ""}
              >
                Novo Carrinho
              </Link>
            </li>            
            <li>
              <Link
                href="/mapa"
                className={pathname === "/mapa" ? "active" : ""}
              >
                Mapa
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className={pathname === "/admin" ? "active" : ""}
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
