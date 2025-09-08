package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Samuel-k276/backend/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SearchResponse representa o resultado de uma busca
type SearchResponseProduct struct {
	Results []models.Product `json:"results"`
	Count   int              `json:"count"`
}

type SearchResponseDonor struct {
	Results []models.Donor `json:"results"`
	Count   int            `json:"count"`
}

func RegisterSearchHandlers(mux *http.ServeMux, db *pgxpool.Pool) {
	// Rota para buscar produtos
	mux.HandleFunc("/search/products", func(w http.ResponseWriter, r *http.Request) {
		SearchProductsHandler(w, r, db)
	})
	// Rota para buscar doadores
	mux.HandleFunc("/search/donors", func(w http.ResponseWriter, r *http.Request) {
		SearchDonorsHandler(w, r, db)
	})
}

// SearchProductsHandler gerencia buscas de produtos por nome ou ID
func SearchProductsHandler(w http.ResponseWriter, r *http.Request, database *pgxpool.Pool) {
	// Aceitar apenas GET para buscas
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Verificar se temos parâmetros de busca
	nameQuery := r.URL.Query().Get("name")
	idQuery := r.URL.Query().Get("id")

	// Se não tiver nenhum parâmetro, retorna erro
	if nameQuery == "" && idQuery == "" {
		http.Error(w, "Parâmetro de busca 'name' ou 'id' não fornecido", http.StatusBadRequest)
		return
	}

	var products []models.Product
	var err error

	// Se tiver o parâmetro id, busca por ID
	if idQuery != "" {
		products, err = models.SearchProductsByID(database, idQuery)
	} else {
		// Senão, busca por nome (com normalização)
		normalizedQuery := models.NormalizeText(nameQuery)
		products, err = models.SearchProductsByName(database, normalizedQuery)
	}

	if err != nil {
		http.Error(w, "Erro ao realizar busca: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Preparar resposta
	response := SearchResponseProduct{
		Results: products,
		Count:   len(products),
	}

	// Enviar resposta
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func SearchDonorsHandler(w http.ResponseWriter, r *http.Request, database *pgxpool.Pool) {
	// Aceitar apenas GET para buscas
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	// Verificar se temos parâmetros de busca
	nameQuery := r.URL.Query().Get("name")
	idQuery := r.URL.Query().Get("id")

	// Se não tiver nenhum parâmetro, retorna erro
	if nameQuery == "" && idQuery == "" {
		http.Error(w, "Parâmetro de busca 'name' ou 'id' não fornecido", http.StatusBadRequest)
		return
	}

	var donors []models.Donor
	var err error

	// Se tiver o parâmetro id, busca por ID
	if idQuery != "" {
		donors, err = models.SearchDonorsByID(database, idQuery)
	} else {
		// Senão, busca por nome (com normalização)
		normalizedQuery := models.NormalizeText(nameQuery)
		donors, err = models.SearchDonorsByName(database, normalizedQuery)
	}

	if err != nil {
		http.Error(w, "Erro ao realizar busca: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Preparar resposta
	response := SearchResponseDonor{
		Results: donors,
		Count:   len(donors),
	}

	// Enviar resposta
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
