package handlers

import (
	"log"
	"net/http"

	"github.com/Samuel-k276/backend/database"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GetDB retorna a conexão com o banco de dados
func GetDB() *pgxpool.Pool {
	return database.GetDB()
}

// Displays logs for all requests, except OPTIONS
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "OPTIONS" {
			log.Printf("Acesso: %s %s", r.Method, r.URL.Path)
		}
		next.ServeHTTP(w, r)
	})
}

// Resgisters all handlers for the application
func RegisterHandlers(mux *http.ServeMux, db *pgxpool.Pool) {
	// Carts routes
	mux.HandleFunc("/cars", AuthMiddleware(GetAllCarsHandler))
	mux.HandleFunc("/cars/create", CreateCarHandler)
	mux.HandleFunc("/cars/get", GetCarHandler)
	mux.HandleFunc("/cars/add-product", AddProductToCarHandler)
	mux.HandleFunc("/cars/remove-product", RemoveProductFromCarHandler)
	mux.HandleFunc("/cars/update-quantity", UpdateProductQuantityHandler)

	// Authentication routes
	RegisterAuthHandlers(mux)
	// Search routes
	RegisterSearchHandlers(mux, db)
	// Products routes
	RegisterProductHandlers(mux, db)
	// Donors routes
	RegisterDonorHandlers(mux, db)
	// Map routes
	RegisterMapHandlers(mux)
}
