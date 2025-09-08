package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Samuel-k276/backend/auth"
)

func RegisterAuthHandlers(mux *http.ServeMux) {
	// Route for login
	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			isLoggedIn(w, r)
		} else if r.Method == http.MethodPost {
			loginHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
}

// LoginHandler handles user login requests
func loginHandler(w http.ResponseWriter, r *http.Request) {
	// For POST requests, perform login
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Extract credentials from request body
	// Example JSON: {"password": "pass"}
	var loginReq auth.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Authenticate using password only
	if err := auth.AuthenticateUser(loginReq.Password); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}
	// Generate JWT token
	token, expiresAt, err := auth.GenerateJWT()
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Respond with token and expiration date
	// Example JSON: {"token": "<token>", "expires_at": "2023-10-01T12:00:00Z"}
	response := auth.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func isLoggedIn(w http.ResponseWriter, r *http.Request) {
	// For GET requests, check if user is logged in
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	tokenString := auth.ExtractTokenFromRequest(r)
	if tokenString == "" {
		http.Error(w, "Authentication token not provided", http.StatusUnauthorized)
		return
	}

	claims, err := auth.VerifyToken(tokenString)
	if err != nil {
		http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
		return
	}

	response := map[string]any{
		"logged_in":  true,
		"expires_at": fmt.Sprintf("%d", claims.ExpiresAt),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// AuthMiddleware is a middleware that verifies JWT token authentication
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Public routes don't need authentication
		if r.URL.Path == "/login" {
			next(w, r)
			return
		}
		// Extract token from header
		tokenString := auth.ExtractTokenFromRequest(r)
		if tokenString == "" {
			http.Error(w, "Authentication token not provided", http.StatusUnauthorized)
			return
		}

		// Verify token
		_, err := auth.VerifyToken(tokenString)
		if err != nil {
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Pass to next handler
		next(w, r)
	}
}
