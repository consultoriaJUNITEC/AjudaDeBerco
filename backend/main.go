package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Samuel-k276/backend/auth"
	"github.com/Samuel-k276/backend/database"
	"github.com/Samuel-k276/backend/handlers"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/cors"
)

// Function that deletes outdated cars
func deleteCars(db *pgxpool.Pool) {
	fmt.Println("Cleaning the outdated cars")
	database.DeleteCars(db)
}

func startScheduler(db *pgxpool.Pool) {
	go func() {
		fmt.Println("Scheduler goroutine started")
		loc, err := time.LoadLocation("Europe/Lisbon")
		if err != nil {
			fmt.Printf("Error loading timezone, using UTC: %v\n", err)
			loc = time.UTC
		}
		for {
			now := time.Now().In(loc)
			next := time.Date(now.Year(), now.Month(), now.Day(), 24, 0, 0, 0, loc)

			if now.After(next) || now.Equal(next) {
				next = next.Add(24 * time.Hour)
			}

			duration := next.Sub(now)
			fmt.Println("Waiting", duration, "until next execution at 12:00 PM")

			time.Sleep(duration)

			deleteCars(db)
		}
	}()
}

func main() {
	// Initialize authentication
	if err := auth.InitAuth(); err != nil {
		log.Fatal("Error initializing authentication module:", err)
	}
	// Initialize database
	fmt.Println("Starting database initialization...")
	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Error initializing the database:", err)
	}
	defer db.Close()
	fmt.Println("Database initialized successfully")

	// Scheduler
	startScheduler(db)

	// Set up routing
	mux := http.NewServeMux()
	// Register HTTP handlers
	handlers.RegisterHandlers(mux, db)

	// Add health check endpoint for Cloud Run
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Register WebSocket handler (no TLS)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleWebSocket(db, w, r)
	})
	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://ajuda-de-berco.vercel.app", "https://*.run.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Origin"},
		AllowCredentials: true,
		ExposedHeaders:   []string{"Access-Control-Allow-Origin"},
	})
	// Wrap the mux with CORS and logging middleware
	loggingHandler := handlers.LoggingMiddleware(c.Handler(mux))
	// Get port from environment variable (for Cloud Run) or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the HTTP server
	fmt.Printf("Server starting on 0.0.0.0:%s\n", port)
	if err := http.ListenAndServe("0.0.0.0:"+port, loggingHandler); err != nil {
		log.Fatal("Error starting HTTP server:", err)
	}
}
