package models

import (
	"context"
	"time"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Donor representa um doador no sistema
type Donor struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	NormalizedName string    `json:"-"` // Campo não exportado para JSON
	CreatedAt      time.Time `json:"created_at"`
}

// GetDonors recupera todos os doadores do banco de dados
func GetDonors(db *pgxpool.Pool) ([]Donor, error) {
	// Query to get all donors
	query := `
		SELECT id_donor, name, normalized_name, created_at 
		FROM donors
	`

	rows, err := db.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	donors := []Donor{}
	for rows.Next() {
		var donor Donor
		err := rows.Scan(&donor.ID, &donor.Name, &donor.NormalizedName, &donor.CreatedAt)
		if err != nil {
			return nil, err
		}
		donors = append(donors, donor)
	}
	return donors, nil
}

// GetDonor recupera um doador pelo ID
func GetDonor(db *pgxpool.Pool, id string) (Donor, error) {
	// Query to get a donor by ID
	query := `
		SELECT id_donor, name, normalized_name, created_at 
		FROM donors 
		WHERE id_donor = $1
	`

	var donor Donor
	err := db.QueryRow(context.Background(), query, id).Scan(&donor.ID, &donor.Name, &donor.NormalizedName, &donor.CreatedAt)
	return donor, err
}

// CreateDonor insere um novo doador no banco de dados
func CreateDonor(db *pgxpool.Pool, id, name string) error {
	// Query to insert a new donor
	query := `
		INSERT INTO donors (id_donor, name, normalized_name) 
		VALUES ($1, $2, $3)
	`

	normalizedName := NormalizeText(name)
	_, err := db.Exec(context.Background(), query, id, name, normalizedName)
	return err
}

// UpdateDonor atualiza um doador existente
func UpdateDonor(db *pgxpool.Pool, id, name string) error {
	// Query to update a donor
	query := `
		UPDATE donors 
		SET name = $1, normalized_name = $2
		WHERE id_donor = $3
	`

	normalizedName := NormalizeText(name)
	_, err := db.Exec(context.Background(), query, name, normalizedName, id)
	return err
}

// DeleteDonor remove um doador do banco de dados
func DeleteDonor(db *pgxpool.Pool, id string) error {
	// Query to delete a donor
	query := `
		DELETE FROM donors 
		WHERE id_donor = $1
	`

	_, err := db.Exec(context.Background(), query, id)
	return err
}

// SearchDonorsByID returns donors whose ID contains the search string
func SearchDonorsByID(db *pgxpool.Pool, query string) ([]Donor, error) {
	// Query to search donors by ID
	sqlQuery := `
		SELECT id_donor, name, normalized_name, created_at 
		FROM donors 
		WHERE id_donor LIKE $1
	`

	rows, err := db.Query(context.Background(), sqlQuery, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	donors := []Donor{}
	for rows.Next() {
		var donor Donor
		err := rows.Scan(&donor.ID, &donor.Name, &donor.NormalizedName, &donor.CreatedAt)
		if err != nil {
			return nil, err
		}
		donors = append(donors, donor)
	}
	return donors, nil
}

// SearchDonorsByName busca doadores cujo nome contém a string de busca
func SearchDonorsByName(db *pgxpool.Pool, query string) ([]Donor, error) {
	normalizedQuery := NormalizeText(query)

	// Query to search donors by name
	sqlQuery := `
		SELECT id_donor, name, normalized_name, created_at 
		FROM donors 
		WHERE normalized_name LIKE $1
	`

	rows, err := db.Query(context.Background(), sqlQuery, "%"+normalizedQuery+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	donors := []Donor{}
	for rows.Next() {
		var donor Donor
		err := rows.Scan(&donor.ID, &donor.Name, &donor.NormalizedName, &donor.CreatedAt)
		if err != nil {
			return nil, err
		}
		donors = append(donors, donor)
	}
	return donors, nil
}
