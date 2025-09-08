package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Samuel-k276/backend/auth"
	"github.com/Samuel-k276/backend/database"
	"github.com/Samuel-k276/backend/models"
)

// Estrutura para receber requisições de atualização de carrinhos
type CarRequest struct {
	ID string `json:"id"`
}

// Estrutura para receber requisições de criação de carrinhos com senha
type CreateCarRequest struct {
	Password string `json:"password"`
	Type     string `json:"type"`
}

// Estrutura para receber requisições de adição de produtos ao carrinho
type AddProductRequest struct {
	ProductID      string    `json:"product_id"`
	Quantity       int       `json:"quantity"`
	ExpirationDate time.Time `json:"expiration_date"`
}

// CreateCarHandler cria um novo carrinho
func CreateCarHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Verificar a senha fornecida
	var req CreateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao decodificar JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Type != "Entrada" && req.Type != "Saída" {
		http.Error(w, "Tipo de carrinho inválido. Deve ser 'Entrada' ou 'Saída'", http.StatusBadRequest)
		return
	}

	// Usar a função do módulo auth para verificar a senha
	valid := auth.VerifyPasswordDirectly(req.Password)
	if !valid {
		// Verifica se a senha é um token JWT válido
		if _, err := auth.VerifyToken(req.Password); err != nil {
			http.Error(w, "Senha incorreta", http.StatusUnauthorized)
			return
		}
	}

	// Criar novo carrinho
	car, err := database.CreateCar(database.GetDB(), req.Type)

	if err != nil {
		http.Error(w, "Erro ao criar carrinho: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(car)
}

// GetCarHandler retorna um carrinho pelo ID
func GetCarHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obter ID do carrinho da query string
	carID := r.URL.Query().Get("id")
	if carID == "" {
		http.Error(w, "ID do carrinho é obrigatório", http.StatusBadRequest)
		return
	}

	// Procurar carrinho
	car, err := database.GetCar(database.GetDB(), carID)
	if err != nil {
		http.Error(w, "Carrinho não encontrado", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(car)
}

func GetAllCarsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Find all carts
	carts, err := database.GetAllCars(database.GetDB())
	if err != nil {
		http.Error(w, "Erro ao procurar carrinhos", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(carts)
}

// AddProductToCarHandler adiciona um produto ao carrinho
func AddProductToCarHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obter ID do carrinho da query string
	carID := r.URL.Query().Get("id")
	if carID == "" {
		http.Error(w, "ID do carrinho é obrigatório", http.StatusBadRequest)
		return
	}

	// Buscar carrinho
	car, exists := models.GlobalCarStore.GetCar(carID)
	if !exists {
		http.Error(w, "Carrinho não encontrado", http.StatusNotFound)
		return
	}

	var req AddProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao decodificar JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.ProductID == "" || req.Quantity <= 0 || req.ExpirationDate.IsZero() {
		http.Error(w, "ID do produto, quantidade e data de expiração são obrigatórios", http.StatusBadRequest)
		return
	}

	// Buscar informações do produto
	db := GetDB()
	product, err := models.GetProduct(db, req.ProductID)
	if err != nil {
		http.Error(w, "Erro ao buscar produto: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Adicionar produto ao carrinho
	productInCar := models.ProductInCar{
		ID:             product.ID,
		Name:           product.Name,
		Quantity:       req.Quantity,
		Unit:           product.Unit,
		ExpirationDate: req.ExpirationDate,
	}

	car.AddProductToCar(productInCar)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(car)
}

// RemoveProductFromCarHandler remove um produto do carrinho
func RemoveProductFromCarHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obter ID do carrinho e do produto da query string
	carID := r.URL.Query().Get("car_id")
	productID := r.URL.Query().Get("product_id")

	if carID == "" || productID == "" {
		http.Error(w, "IDs do carrinho e do produto são obrigatórios", http.StatusBadRequest)
		return
	}

	// Buscar carrinho
	car, exists := models.GlobalCarStore.GetCar(carID)
	if !exists {
		http.Error(w, "Carrinho não encontrado", http.StatusNotFound)
		return
	}

	// Verificar se foi fornecida uma data de expiração específica
	expDateStr := r.URL.Query().Get("expiration_date")
	var expDate time.Time
	var removeAll bool
	if expDateStr == "" {
		// Se não foi fornecida, remover todos os produtos com o mesmo ID
		removeAll = true
	} else {
		// Caso contrário, tentar fazer o parse da data de expiração
		// Se não conseguir, retornar erro
		var err error
		expDate, err = time.Parse(time.RFC3339, expDateStr)
		if err != nil {
			http.Error(w, "Data de expiração inválida: "+err.Error(), http.StatusBadRequest)
			return
		}
	}

	// Remover produto do carrinho
	car.RemoveProductFromCar(productID, expDate, removeAll)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(car)
}

// UpdateProductQuantityHandler atualiza a quantidade de um produto no carrinho
func UpdateProductQuantityHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Obter ID do carrinho da query string
	carID := r.URL.Query().Get("car_id")
	productID := r.URL.Query().Get("product_id")

	if carID == "" || productID == "" {
		http.Error(w, "IDs do carrinho e do produto são obrigatórios", http.StatusBadRequest)
		return
	}

	// Buscar carrinho
	car, exists := models.GlobalCarStore.GetCar(carID)
	if !exists {
		http.Error(w, "Carrinho não encontrado", http.StatusNotFound)
		return
	}

	var req struct {
		Quantity       int       `json:"quantity"`
		ExpirationDate time.Time `json:"expiration_date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Erro ao decodificar JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 || req.ExpirationDate.IsZero() {
		http.Error(w, "Quantidade e data de expiração são obrigatórios", http.StatusBadRequest)
		return
	}

	// Atualizar quantidade do produto
	car.ChangeProductQuantity(productID, req.ExpirationDate, req.Quantity)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(car)
}
