import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NovoCarrinho from "./pages/NovoCarrinho";
import MyCart from "./pages/MyCart";
import AdminPanel from "./pages/AdminPanel";
import AuthenticationMenu from "./pages/AuthenticationMenu";
import Map from "./pages/Map";
import Header from "./components/Header";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-content">
          {/* Routes here */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/novo-carrinho" element={<NovoCarrinho />} />
            <Route path="/meu-carrinho" element={<MyCart />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/login" element={<AuthenticationMenu />} />
            <Route path="/mapa" element={<Map />} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
