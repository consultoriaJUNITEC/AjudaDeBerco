package models

import (
	"sync"
	"time"
)

type ProductInCar struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Quantity       int       `json:"quantity"`
	Unit           string    `json:"unit"` // May not be needed
	ExpirationDate time.Time `json:"expiration_date"`
}

type Car struct {
	ID        string                    `json:"id"`
	Products  map[string][]ProductInCar `json:"products"`
	CreatedAt time.Time                 `json:"created_at"`
}

// CarStore gerencia o armazenamento de carrinhos com expiração automática
type CarStore struct {
	cars     map[string]Car
	expiry   map[string]time.Time
	mutex    sync.RWMutex
	lifetime time.Duration // Tempo de vida de um carrinho
}

// Variável global para o store de carrinhos (singleton)
var GlobalCarStore *CarStore

// InitCarStore inicializa o armazenamento de carrinhos
func InitCarStore() {
	store := &CarStore{
		cars:     make(map[string]Car),
		expiry:   make(map[string]time.Time),
		lifetime: 24 * time.Hour, // 24 horas de vida útil
	}

	// Iniciar uma goroutine para limpar carrinhos expirados
	go store.startCleanupRoutine()

	GlobalCarStore = store
}

// startCleanupRoutine inicia uma rotina periódica para limpar carrinhos expirados
func (cs *CarStore) startCleanupRoutine() {
	ticker := time.NewTicker(1 * time.Hour) // Verificar expiração a cada hora
	defer ticker.Stop()

	for range ticker.C {
		cs.cleanExpiredCars()
	}
}

// cleanExpiredCars remove carrinhos que já expiraram
func (cs *CarStore) cleanExpiredCars() {
	now := time.Now()
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	for id, expiryTime := range cs.expiry {
		if now.After(expiryTime) {
			delete(cs.cars, id)
			delete(cs.expiry, id)
		}
	}
}

// CreateCar cria um novo carrinho com o ID fornecido
func (cs *CarStore) CreateCar(id string) Car {
	car := Car{
		ID:        id,
		Products:  make(map[string][]ProductInCar),
		CreatedAt: time.Now(),
	}

	cs.mutex.Lock()
	cs.cars[id] = car
	cs.expiry[id] = time.Now().Add(cs.lifetime) // Define expiração para 24h no futuro
	cs.mutex.Unlock()

	return car
}

// GetCar retorna um carrinho pelo ID
func (cs *CarStore) GetCar(id string) (Car, bool) {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	car, exists := cs.cars[id]

	// Se o carrinho existe, atualiza seu tempo de expiração
	if exists {
		cs.expiry[id] = time.Now().Add(cs.lifetime)
	}

	return car, exists
}

// AddProductToCar adds a product to the car's products map
func (c *Car) AddProductToCar(product ProductInCar) {
	// If the product quantity is zero, do not add it to the car
	if product.Quantity <= 0 {
		return
	}

	// Check if the product already exists in the car
	if existingProduct, exists := c.Products[product.ID]; exists {
		// If it exists, try to find one with the same expiration date
		for i, p := range existingProduct {
			if p.ExpirationDate == product.ExpirationDate {
				// If found, update the quantity and return
				c.Products[product.ID][i].Quantity += product.Quantity
				return
			}
		}
		// If not found, add the new product to the existing list
		c.Products[product.ID] = append(existingProduct, product)
		return
	}

	// If the product doesn't exist, add it to the car's products map
	c.Products[product.ID] = []ProductInCar{product}
}

// RemoveProductFromCar removes a product from the car's products map
func (c *Car) RemoveProductFromCar(productID string, expirationDate time.Time, all bool) {
	// If all is true, remove all products with that ID
	if all {
		delete(c.Products, productID)
		return
	}

	// Check if the product exists in the car
	if existingProduct, exists := c.Products[productID]; exists {
		// If the expiration date is not zero, try to find one with the same expiration date
		for i, p := range existingProduct {
			if p.ExpirationDate == expirationDate {
				// If found, remove it from the list
				c.Products[productID] = append(existingProduct[:i], existingProduct[i+1:]...)
				// If the list is empty after removal, delete the product from the car's products map
				if len(c.Products[productID]) == 0 {
					delete(c.Products, productID)
				}
				return
			}
		}
	}
}

// ChangeProductQuantity changes the quantity of a product in the car's products map
func (c *Car) ChangeProductQuantity(productID string, expirationDate time.Time, newQuantity int) {
	// If the new quantity is zero, remove the product from the car
	if newQuantity <= 0 {
		c.RemoveProductFromCar(productID, expirationDate, false)
		return
	}

	// Check if the product exists in the car
	if existingProduct, exists := c.Products[productID]; exists {
		// If it exists, try to find one with the same expiration date
		for i, p := range existingProduct {
			if p.ExpirationDate == expirationDate {
				// If found, update the quantity and return
				c.Products[productID][i].Quantity = newQuantity
				return
			}
		}
	}
}
