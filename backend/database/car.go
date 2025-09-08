package database

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Struct of a car -- that thing with json allow us to receive well the info from the DB
type Car struct {
	ID         string        `json:"id_car"`
	Type       string        `json:"type"`
	DateExport string        `json:"date_export"`
	Products   []Car_Product `json:"products"`
}

// Struct of a product in the car we need more things because of the need to send to the frontend

type Car_Product struct {
	ID          int     `json:"id"`
	IDCar       string  `json:"id_car"`
	IDProduct   string  `json:"id_product"`
	Name        string  `json:"name"`
	Unit        string  `json:"unit"`
	Pos_x       int     `json:"pos_x"`
	Pos_y       int     `json:"pos_y"`
	Quantity    float64 `json:"quantity"`
	Expiration  string  `json:"expiration"`
	Description string  `json:"description"`
}

// This Part is to only the car as a whole not the products inside

// Character set used to generate the random car ID
const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// Function to generate a random 6-character code for the car ID
func GenerateRandomCode() string {

	rand.Seed(time.Now().UnixNano())
	code := make([]byte, 6)

	for i := range code {
		code[i] = charset[rand.Intn(len(charset))]
	}
	return string(code)
}

// Create car function
func CreateCar(db *pgxpool.Pool, cart_type string) (*Car, error) {

	id_car := GenerateRandomCode()

	// Insert the new car changes the $1, $2 with the id_car and cart_type
	insertQuery := `
		INSERT INTO cars (id_car, type) 
		VALUES ($1, $2)
	`
	_, err := db.Exec(context.Background(), insertQuery, id_car, cart_type)

	if err != nil {
		return nil, err
	}

	// Retrieve the created car with the date_export value
	selectQuery := `
		SELECT id_car, type, date_export 
		FROM cars 
		WHERE id_car = $1
	`
	row := db.QueryRow(context.Background(), selectQuery, id_car)

	var car Car
	err = row.Scan(&car.ID, &car.Type, &car.DateExport)
	if err != nil {
		return nil, err
	}

	return &car, nil
}

// GetAllCars retrieves all cars from the database
func GetAllCars(db *pgxpool.Pool) ([]Car, error) {
	// Query to get all cars
	query := `
		SELECT id_car, type, date_export 
		FROM cars
	`

	rows, err := db.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cars []Car
	for rows.Next() {
		var car Car
		err := rows.Scan(&car.ID, &car.Type, &car.DateExport)
		if err != nil {
			return nil, err
		}

		// Get products for each car
		productsQuery := `
			SELECT id, id_product, quantity, expiration, description
			FROM products_car
			WHERE id_car = $1
		`
		productRows, err := db.Query(context.Background(), productsQuery, car.ID)
		if err != nil {
			return nil, err
		}
		defer productRows.Close()

		var products []Car_Product
		for productRows.Next() {
			var product Car_Product
			err := productRows.Scan(&product.ID, &product.IDProduct, &product.Quantity, &product.Expiration, &product.Description)
			if err != nil {
				return nil, err
			}
			product.IDCar = car.ID
			products = append(products, product)
		}

		if err = productRows.Err(); err != nil {
			return nil, err
		}

		car.Products = products
		cars = append(cars, car)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return cars, nil
}

// Get all the products in the car
func GetCar(db *pgxpool.Pool, id_car string) (*Car, error) {
	// Query to retrieve the car by ID
	query := `
		SELECT id_car, type, date_export 
		FROM cars 
		WHERE id_car = $1
	`
	var car Car
	err := db.QueryRow(context.Background(), query, id_car).Scan(&car.ID, &car.Type, &car.DateExport)
	if err != nil {
		return nil, err
	}

	// Query to retrieve all products in the car with full product details
	query = `
		SELECT 
			pc.id,
			pc.id_product,
			p.name,
			p.unit,
			p.pos_x,
			p.pos_y,
			pc.quantity,
			pc.expiration,
			pc.description
		FROM products_car pc
		JOIN products p ON pc.id_product = p.id_product
		WHERE pc.id_car = $1
	`

	rows, err := db.Query(context.Background(), query, id_car)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Car_Product
	for rows.Next() {
		var product Car_Product
		err := rows.Scan(
			&product.ID,
			&product.IDProduct,
			&product.Name,
			&product.Unit,
			&product.Pos_x,
			&product.Pos_y,
			&product.Quantity,
			&product.Expiration,
			&product.Description,
		)
		if err != nil {
			return nil, err
		}
		// Manually assign the car ID to the product
		product.IDCar = id_car
		products = append(products, product)
	}

	// Attach the products to the car struct
	car.Products = products
	return &car, nil
}

// Delete car by id
func DeleteCarId(db *pgxpool.Pool, id_car string) error {

	// Query to delete the cars
	query := `
		DELETE FROM cars
		WHERE id_car = $1
	`
	_, err := db.Exec(context.Background(), query, id_car)
	if err != nil {
		return err
	}

	// Delete the products from those cars
	query = `
		DELETE FROM products_car
		WHERE id_car NOT IN (SELECT id_car FROM cars);
	`
	_, err = db.Exec(context.Background(), query)
	if err != nil {
		return err
	}

	return nil
}

// Delete car if the date of the exportation 1 week ago
func DeleteCars(db *pgxpool.Pool) error {

	// Query to delete the cars (PostgreSQL syntax)
	query := `
		DELETE FROM cars
		WHERE date_export != '0'
			AND DATE(date_export) < CURRENT_DATE - INTERVAL '7 days';
	`
	_, err := db.Exec(context.Background(), query)
	if err != nil {
		return err
	}

	// Delete the products from those cars
	query = `
		DELETE FROM products_car
		WHERE id_car NOT IN (SELECT id_car FROM cars);
	`
	_, err = db.Exec(context.Background(), query)
	if err != nil {
		return err
	}

	return nil
}

// When the User clicks on exporting the time of the car changes to the current date
func ChangeDateCar(db *pgxpool.Pool, id_car string) error {

	// SQL query to find the car with that id
	query := `
		UPDATE cars 
		SET date_export = CURRENT_TIMESTAMP
		WHERE id_car = $1
	`

	// Execute the query to change the date
	_, err := db.Exec(context.Background(), query, id_car)
	if err != nil {
		return err
	}

	return nil
}

// Now this part is about the products in the car

// This function add products to the car with that id
func AddProductCar(db *pgxpool.Pool, id_car string, id_product string, quantity float64, expiration string, description string) (*Car_Product, error) {

	// Query to add the Product to the car
	query := `
		INSERT INTO products_car (id_car, id_product, quantity, expiration, description)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	// Query to add products to the car and get the returned ID
	var prod Car_Product
	err := db.QueryRow(context.Background(), query, id_car, id_product, quantity, expiration, description).Scan(&prod.ID)
	if err != nil {
		return nil, err
	}

	return &prod, nil
}

// This function removes products using their id
func DeleteProductCar(db *pgxpool.Pool, id int) error {

	// SQL query to delete cars with date_export '0' or older than yesterday
	query := `
		DELETE FROM products_car
		WHERE id = $1;
	`

	// Execute the deletion query
	_, err := db.Exec(context.Background(), query, id)

	return err
}

// This function edits the info about the car product with that id
func EditProductCar(db *pgxpool.Pool, id int, quantity float64, expiration string, description string) error {

	// SQL query that updates the info of the product
	query := `
		UPDATE products_car
		SET quantity = $1, description = $2, expiration = $3
		WHERE id = $4;
	`

	// Executing the query
	_, err := db.Exec(context.Background(), query, quantity, description, expiration, id)

	return err
}

// This function gets all the products by the car id
func GetCartByID(db *pgxpool.Pool, ID string) ([]Car_Product, error) {

	// Query to get the products in the car
	query := `
		SELECT id, id_car, id_product, quantity, expiration, description
		FROM products_car
		WHERE id_car = $1
	`

	rows, err := db.Query(context.Background(), query, ID)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}

	// To close the rows when program ends
	defer rows.Close()

	// List of products in the car
	var items []Car_Product

	for rows.Next() {
		var item Car_Product

		// Scanning the info of the products
		err := rows.Scan(
			&item.ID,
			&item.IDCar,
			&item.IDProduct,
			&item.Quantity,
			&item.Expiration,
			&item.Description,
		)

		if err != nil {
			log.Println("Scan error:", err)
			continue
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("row error: %w", err)
	}

	return items, nil
}
