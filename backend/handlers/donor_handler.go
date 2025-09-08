package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/Samuel-k276/backend/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type donorRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// RegisterDonorHandlers registra os handlers específicos de doadores
func RegisterDonorHandlers(mux *http.ServeMux, db *pgxpool.Pool) {
	// Endpoint para listar todos os doadores - GET sem autenticação, POST com autenticação
	mux.HandleFunc("/donors", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			// GET não precisa de autenticação
			getDonors(w, db)
		} else {
			// POST continua com autenticação
			AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodPost {
					createDonor(w, r, db)
				} else {
					w.WriteHeader(http.StatusMethodNotAllowed)
				}
			})(w, r)
		}
	})

	// Endpoints para operações em um doador específico
	mux.HandleFunc("/donors/", func(w http.ResponseWriter, r *http.Request) {
		// Extrair o ID da URL
		id := getDonorIDFromURL(r.URL.Path)
		if id == "" {
			http.Error(w, "ID inválido", http.StatusBadRequest)
			return
		}

		if r.Method == http.MethodGet {
			// GET não precisa de autenticação
			getDonor(w, db, id)
		} else {
			// PUT e DELETE continuam com autenticação
			AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
				switch r.Method {
				case http.MethodPut:
					updateDonor(w, r, db, id)
				case http.MethodDelete:
					deleteDonor(w, db, id)
				default:
					w.WriteHeader(http.StatusMethodNotAllowed)
				}
			})(w, r)
		}
	})
}

func getDonors(w http.ResponseWriter, db *pgxpool.Pool) {
	donors, err := models.GetDonors(db)
	if err != nil {
		log.Printf("Erro ao procurar doadores: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(donors)
}

func getDonor(w http.ResponseWriter, db *pgxpool.Pool, id string) {
	donor, err := models.GetDonor(db, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Doador não encontrado: %s", id)
			http.Error(w, "Doador não encontrado", http.StatusNotFound)
		} else {
			log.Printf("Erro ao procurar doador: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(donor)
}

func createDonor(w http.ResponseWriter, r *http.Request, db *pgxpool.Pool) {
	var req donorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Erro ao decodificar requisição: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validação simples
	if req.ID == "" || req.Name == "" {
		http.Error(w, "ID e nome são obrigatórios", http.StatusBadRequest)
		return
	}

	err := models.CreateDonor(db, req.ID, req.Name)
	if err != nil {
		log.Printf("Erro ao criar doador: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"id": req.ID})
}

func updateDonor(w http.ResponseWriter, r *http.Request, db *pgxpool.Pool, id string) {
	var req donorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Erro ao decodificar requisição: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validação simples
	if req.Name == "" {
		http.Error(w, "Nome é obrigatório", http.StatusBadRequest)
		return
	}

	// Verificando se o doador existe
	_, err := models.GetDonor(db, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Doador não encontrado: %s", id)
			http.Error(w, "Doador não encontrado", http.StatusNotFound)
		} else {
			log.Printf("Erro ao procurar doador: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := models.UpdateDonor(db, id, req.Name); err != nil {
		log.Printf("Erro ao atualizar doador: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	updatedDonor, _ := models.GetDonor(db, id)
	json.NewEncoder(w).Encode(updatedDonor)
}

func deleteDonor(w http.ResponseWriter, db *pgxpool.Pool, id string) {
	// Verificando se o doador existe
	_, err := models.GetDonor(db, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Doador não encontrado", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if err := models.DeleteDonor(db, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getDonorIDFromURL(path string) string {
	// O caminho será "/donors/ABC123"
	parts := strings.Split(path, "/")
	if len(parts) != 3 {
		return ""
	}

	return parts[2]
}
