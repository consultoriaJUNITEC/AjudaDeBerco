package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/Samuel-k276/backend/database"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"slices"
)

// Struct of a car
type Car struct {
	ID         string `json:"id_car"`
	DateExport string `json:"date_export"`
}

// Struct of a product in the car
type Car_Product struct {
	ID          int     `json:"id"`
	IDCar       string  `json:"id_car"`
	IDProduct   string  `json:"id_product"`
	Quantity    float64 `json:"quantity"`
	Expiration  string  `json:"expiration"`
	Description string  `json:"description"`
}

// Function to upgrade the connection
var upgrader = websocket.Upgrader{
	// This allows all the people to reach the connection
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Map with all the connections by car
var cartClients = make(map[string][]*websocket.Conn)

// Necessary because the Go routines could touch the map at the same time
var mu sync.Mutex

// Main handler of the websocket connection
func HandleWebSocket(db *pgxpool.Pool, w http.ResponseWriter, r *http.Request) {

	// Find the car id in the URL of the request
	id_car := r.URL.Query().Get("id_car")
	if id_car == "" {
		http.Error(w, "Id of the car is required", http.StatusBadRequest) // Fixed: removed extra parentheses
		return
	}

	// Upgrading the connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to Websockets", err)
		return
	}

	// Closing the connection when the program ends
	defer conn.Close()

	// Registers the connection -> mu is because of the Go routines accessing the same data
	mu.Lock()
	cartClients[id_car] = append(cartClients[id_car], conn)
	mu.Unlock()

	// Removing the connection from the connection map when the program ends
	defer removeConnection(id_car, conn)

	// Loop to receive the messages
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading the message", err)
			break
		}
		processMessage(db, id_car, msg) // Fixed: passing conn to processMessage
	}
}

// Function to remove a specific connection
func removeConnection(id_car string, conn *websocket.Conn) {
	// To be able to access the map with the clients
	mu.Lock()
	defer mu.Unlock()

	conns := cartClients[id_car]

	// Loop to find and delete the client
	for i, client := range conns {
		if client == conn {
			cartClients[id_car] = slices.Delete(conns, i, i+1)
			break
		}
	}
}

// Handles the messages from the user
func processMessage(db *pgxpool.Pool, id_car string, msg []byte) {
	// Putting the message into a map to be easier to access
	var message map[string]interface{}
	if err := json.Unmarshal(msg, &message); err != nil {
		log.Println("Error in translating the message sent by the user:", err)
		return
	}

	// Getting the action
	action := message["action"].(string)

	// Calling the functions based on the action
	switch action {
	case "DeleteCar":
		id_car := message["id_car"].(string)
		database.DeleteCarId(db, id_car)

	case "GetCar":
		id_car := message["id_car"].(string)
		broadcastCartUpdate(db, id_car)

	case "Export":
		id_car_val, ok := message["id_car"]
		if !ok {
			// "id_car" não existe no map
			log.Println("id_car missing in message")
			return
		}

		id_car, ok := id_car_val.(string)
		if !ok {
			// "id_car" não é string
			log.Println("id_car is not a string")
			return
		}

		// Agora podes usar id_car com segurança
		database.ChangeDateCar(db, id_car)

	// I will choose between adding or updating a product
	case "AddProductCar":
		// Extract all required fields
		idFloat := message["id"].(float64)
		id := int(idFloat)
		idCar := message["id_car"].(string)
		idProduct := message["id_product"].(string)
		quantity := message["quantity"].(float64)
		expiration := message["expiration"].(string)
		description := message["description"].(string)

		// If the product is not in the db
		if id == 0 {

			// Call the function to add the product to the car
			_, err := database.AddProductCar(db, idCar, idProduct, quantity, expiration, description)
			if err != nil {
				log.Println("Error handling the function to add the product to the db:", err)
				return
			}
		} else {

			// Editing the current product
			err := database.EditProductCar(db, id, quantity, expiration, description)
			if err != nil {
				log.Println("Error handling the function to edit the product in the db:", err)
				return
			}
		}

		// Give the updated car to all users
		broadcastCartUpdate(db, id_car)

	case "DeleteProductCar":
		idFloat := message["id"].(float64)
		id := int(idFloat)
		idCar := message["id_car"].(string)

		err := database.DeleteProductCar(db, id)
		if err != nil {
			log.Println("Error handling the function to remove the product in the db:", err)
			return
		}

		// Give the updated car to all users
		broadcastCartUpdate(db, idCar)

	case "EditProductCar":
		// Extract all the data needed
		idFloat := message["id"].(float64)
		id := int(idFloat)
		idCar := message["id_car"].(string)
		quantity := message["quantity"].(float64)
		expiration := message["expiration"].(string)
		description := message["description"].(string)

		err := database.EditProductCar(db, id, quantity, expiration, description)
		if err != nil {
			log.Println("Error handling the function to edit the product in the db:", err)
			return
		}

		// Give the updated car to all users
		broadcastCartUpdate(db, idCar)
	}
}

// Function that tells the other users how the car is now
func broadcastCartUpdate(db *pgxpool.Pool, id_car string) {

	// Get all the products in the car
	cart, err := database.GetCar(db, id_car)
	if err != nil {
		log.Println("Error retrieving cart from database:", err)
		return
	}

	response := map[string]interface{}{
		"action":   "UpdateCar",
		"id_car":   id_car,
		"products": cart.Products,
	}

	cartJSON, err := json.Marshal(response)
	if err != nil {
		log.Println("Error encoding cart to JSON:", err)
		return
	}

	// Accessing the users
	mu.Lock()
	defer mu.Unlock()

	for _, client := range cartClients[id_car] {
		// Sending the cart to all users
		if err := client.WriteMessage(websocket.TextMessage, cartJSON); err != nil {
			log.Println("Error sending message to client:", err)
			client.Close()
		}
	}
}
