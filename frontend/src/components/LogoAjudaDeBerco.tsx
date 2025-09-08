import React from "react";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

const LogoAjudaDeBerco: React.FC<LogoProps> = ({
  width = 170,
  height = 70,
  className = "logo"
}) => {
  return (
    <div className="logo-container">
      <a href="https://www.ajudadeberco.pt" target="_blank" rel="noopener noreferrer">
        <img
          src="/imgs/LogoAjudaDeBerço.png"
          alt="Ajuda de Berço"
          width={width}
          height={height}
          className={className}
        />
      </a>
    </div>
  );
};

export default LogoAjudaDeBerco;