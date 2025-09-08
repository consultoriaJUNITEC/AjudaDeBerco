package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/Samuel-k276/backend/constants"
)

func RegisterMapHandlers(mux *http.ServeMux) {
	// Endpoint para upload de mapa
	mux.HandleFunc("/map", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			AuthMiddleware(uploadMapHandler)(w, r)
		} else if r.Method == http.MethodGet {
			getMapPathHandler(w)
		} else {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		}
	})

	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))

}

func getMapPathHandler(w http.ResponseWriter) {
	// Obter o caminho do mapa
	path := constants.GetMapPath()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"path": path,
	})
}

func uploadMapHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20)

	file, _, err := r.FormFile("mapa")
	if err != nil {
		http.Error(w, "Erro ao ler ficheiro", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Caminho final do ficheiro
	path := constants.GetMapPath()
	dst, err := os.Create(path)
	if err != nil {
		http.Error(w, "Erro ao guardar ficheiro", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	io.Copy(dst, file)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"path": path,
	})
}
