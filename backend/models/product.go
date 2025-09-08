package models

import (
	"context"
	"strings"
	"time"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Product representa um produto no sistema
type Product struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	NormalizedName string    `json:"-"` // Campo não exportado para JSON
	Unit           string    `json:"unit"`
	PositionX      int       `json:"position_x"`
	PositionY      int       `json:"position_y"`
	CreatedAt      time.Time `json:"created_at"`
}

// NormalizeText remove acentos e converte caracteres especiais para suas versões simples
func NormalizeText(s string) string {
	if s == "" {
		return s
	}

	// Pre-allocate the result with the same length as input
	var sb strings.Builder
	sb.Grow(len(s))

	// Process each character only once
	for _, r := range strings.ToLower(s) {
		switch r {
		case 'á', 'à', 'ã', 'â', 'ä':
			sb.WriteByte('a')
		case 'é', 'è', 'ê', 'ë':
			sb.WriteByte('e')
		case 'í', 'ì', 'î', 'ï':
			sb.WriteByte('i')
		case 'ó', 'ò', 'õ', 'ô', 'ö':
			sb.WriteByte('o')
		case 'ú', 'ù', 'û', 'ü':
			sb.WriteByte('u')
		case 'ç':
			sb.WriteByte('c')
		case 'ñ':
			sb.WriteByte('n')
		default:
			// Keep all other characters as they are
			sb.WriteRune(r)
		}
	}

	return sb.String()
}

// GetProducts recupera todos os produtos do banco de dados
func GetProducts(db *pgxpool.Pool) ([]Product, error) {
	// Query to get all products
	query := `
		SELECT id_product, name, normalized_name, unit, pos_x, pos_y, created_at 
		FROM products
	`

	rows, err := db.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var product Product
		err := rows.Scan(&product.ID, &product.Name, &product.NormalizedName, &product.Unit, &product.PositionX, &product.PositionY, &product.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

// GetProduct recupera um produto pelo ID
func GetProduct(db *pgxpool.Pool, id string) (Product, error) {
	// Query to get a product by ID
	query := `
		SELECT id_product, name, normalized_name, unit, pos_x, pos_y, created_at 
		FROM products 
		WHERE id_product = $1
	`

	var product Product
	err := db.QueryRow(context.Background(), query, id).Scan(&product.ID, &product.Name, &product.NormalizedName, &product.Unit, &product.PositionX, &product.PositionY, &product.CreatedAt)
	return product, err
}

// CreateProduct insere um novo produto no banco de dados
func CreateProduct(db *pgxpool.Pool, id, name, unit string) error {
	// Query to insert a new product
	query := `
		INSERT INTO products (id_product, name, normalized_name, unit) 
		VALUES ($1, $2, $3, $4)
	`

	normalizedName := NormalizeText(name)
	_, err := db.Exec(context.Background(), query, id, name, normalizedName, unit)
	return err
}

// UpdateProduct atualiza um produto existente
func UpdateProduct(db *pgxpool.Pool, id, name, unit string, positionX int, positionY int) error {
	// Query to update a product
	query := `
		UPDATE products 
		SET name = $1, normalized_name = $2, unit = $3, pos_x = $4, pos_y = $5
		WHERE id_product = $6
	`

	normalizedName := NormalizeText(name)
	_, err := db.Exec(context.Background(), query, name, normalizedName, unit, positionX, positionY, id)
	return err
}

// DeleteProduct remove um produto do banco de dados
func DeleteProduct(db *pgxpool.Pool, id string) error {
	// Query to delete a product
	query := `
		DELETE FROM products 
		WHERE id_product = $1
	`

	_, err := db.Exec(context.Background(), query, id)
	return err
}

// SearchProductsByID returns products whose ID contains the search string
func SearchProductsByID(db *pgxpool.Pool, query string) ([]Product, error) {
	// Query to search products by ID
	sqlQuery := `
		SELECT id_product, name, normalized_name, unit, created_at 
		FROM products 
		WHERE id_product LIKE $1
	`

	rows, err := db.Query(context.Background(), sqlQuery, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var product Product
		err := rows.Scan(&product.ID, &product.Name, &product.NormalizedName, &product.Unit, &product.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

// SearchProductsByName busca produtos cujo nome contém a string de busca
func SearchProductsByName(db *pgxpool.Pool, query string) ([]Product, error) {
	normalizedQuery := NormalizeText(query)

	// Query to search products by name
	sqlQuery := `
		SELECT id_product, name, normalized_name, unit, created_at 
		FROM products 
		WHERE normalized_name LIKE $1
	`

	rows, err := db.Query(context.Background(), sqlQuery, "%"+normalizedQuery+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var product Product
		err := rows.Scan(&product.ID, &product.Name, &product.NormalizedName, &product.Unit, &product.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}
