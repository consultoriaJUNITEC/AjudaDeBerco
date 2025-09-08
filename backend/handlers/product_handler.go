package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Samuel-k276/backend/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type productRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Unit string `json:"unit"`
}

type productUpdateRequest struct {
	Name      string `json:"name"`
	Unit      string `json:"unit"`
	PositionX int    `json:"position_x"`
	PositionY int    `json:"position_y"`
}

// RegisterProductHandlers registra os handlers específicos de produtos
func RegisterProductHandlers(mux *http.ServeMux, db *pgxpool.Pool) {
	// Endpoint para listar todos os produtos - sem autenticação
	mux.HandleFunc("/products", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			// GET não precisa de autenticação
			getProducts(w, db)
		} else {
			// POST continua com autenticação
			AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodPost {
					createProduct(w, r, db)
				} else {
					w.WriteHeader(http.StatusMethodNotAllowed)
				}
			})(w, r)
		}
	})

	// Endpoints para operações em um produto específico
	mux.HandleFunc("/products/", func(w http.ResponseWriter, r *http.Request) {
		// Extrair o ID da URL
		id := getProductIDFromURL(r.URL.Path)
		if id == "" {
			http.Error(w, "ID inválido", http.StatusBadRequest)
			return
		}

		if r.Method == http.MethodGet {
			// GET não precisa de autenticação
			getProduct(w, db, id)
		} else {
			// PUT e DELETE continuam com autenticação
			AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
				switch r.Method {
				case http.MethodPut:
					updateProduct(w, r, db, id)
				case http.MethodDelete:
					deleteProduct(w, db, id)
				default:
					w.WriteHeader(http.StatusMethodNotAllowed)
				}
			})(w, r)
		}
	})
}

func getProducts(w http.ResponseWriter, db *pgxpool.Pool) {
	products, err := models.GetProducts(db)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func getProduct(w http.ResponseWriter, db *pgxpool.Pool, id string) {
	product, err := models.GetProduct(db, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Produto não encontrado", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func createProduct(w http.ResponseWriter, r *http.Request, db *pgxpool.Pool) {
	var req productRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validação simples
	if req.ID == "" || req.Name == "" || req.Unit == "" {
		http.Error(w, "ID, nome e unidade são obrigatórios", http.StatusBadRequest)
		return
	}

	err := models.CreateProduct(db, req.ID, req.Name, req.Unit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"id": req.ID})
}

func updateProduct(w http.ResponseWriter, r *http.Request, db *pgxpool.Pool, id string) {
	var req productUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validação simples
	if req.Name == "" || req.Unit == "" {
		http.Error(w, "Nome e unidade são obrigatórios", http.StatusBadRequest)
		return
	}

	// Verificando se o produto existe
	_, err := models.GetProduct(db, id)
	if err != nil {
		if err == pgx.ErrNoRows {	
			http.Error(w, "Produto não encontrado", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := models.UpdateProduct(db, id, req.Name, req.Unit, req.PositionX, req.PositionY); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	updatedProduct, _ := models.GetProduct(db, id)
	json.NewEncoder(w).Encode(updatedProduct)
}

func deleteProduct(w http.ResponseWriter, db *pgxpool.Pool, id string) {
	// Verificando se o produto existe
	_, err := models.GetProduct(db, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Produto não encontrado", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := models.DeleteProduct(db, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getProductIDFromURL(path string) string {
	// O caminho será "/products/ABC123", então precisamos extrair o ID
	parts := strings.Split(path, "/")
	if len(parts) != 3 {
		return ""
	}

	return parts[2]
}
