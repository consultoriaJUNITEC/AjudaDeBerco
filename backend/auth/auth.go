package auth

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// Authentication constants
const (
	// Token duration (8 hours)
	tokenDuration = 8 * time.Hour

	// Bcrypt hash cost (higher means more secure but slower)
	bcryptCost = 12
)



// Claims represents the data to be encoded in the JWT token
type Claims struct {
	jwt.StandardClaims
}

type LoginRequest struct {
	Password string `json:"password"`
}

type LoginResponse struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
}

// Global variables
var (
	// JWT secret key loaded from .env file
	jwtSecretKey string

	// Hashed passwords
	adminPasswordHash      string
	voluntarioPasswordHash string
)

// Initialization
// --------------

// InitAuth initializes the authentication module by loading environment variables
func InitAuth() error {
	// Try to load .env file (ignore error if file doesn't exist - for Cloud Run)
	err := godotenv.Load()
	if err != nil {
		// In Cloud Run, .env file won't exist, so we'll use environment variables directly
		// This is not an error, just log it for debugging
		println("Info: .env file not found, using environment variables directly")
	}

	// Load JWT secret key
	jwtSecretKey = os.Getenv("JWT_SECRET_KEY")
	if jwtSecretKey == "" {
		return errors.New("JWT_SECRET_KEY environment variable not defined in .env file")
	}

	// Load passwords from environment
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	voluntarioPassword := os.Getenv("VOLUNTARIO_PASSWORD")

	// Check if passwords are defined
	if adminPassword == "" || voluntarioPassword == "" {
		return errors.New("passwords not defined in .env file")
	}

	// Apply hash to passwords
	adminPasswordHash, err = HashPassword(adminPassword)
	if err != nil {
		return errors.New("error generating admin password hash: " + err.Error())
	}

	voluntarioPasswordHash, err = HashPassword(voluntarioPassword)
	if err != nil {
		return errors.New("error generating volunteer password hash: " + err.Error())
	}

	return nil
}

// Password related functions
// --------------------------

// HashPassword generates a bcrypt hash from a password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with a bcrypt hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// VerifyPasswordDirectly checks if a provided password matches either admin or volunteer password
func VerifyPasswordDirectly(password string) bool {
	return CheckPasswordHash(password, adminPasswordHash) || CheckPasswordHash(password, voluntarioPasswordHash)
}

// Authentication functions
// -----------------------

// AuthenticateUser authenticates using only password
func AuthenticateUser(password string) error {
	// Check if the provided password is valid
	if !VerifyPasswordDirectly(password) {
		return errors.New("incorrect password")
	}

	return nil
}

// JWT related functions
// --------------------

// GenerateJWT generates a JWT token
func GenerateJWT() (string, int64, error) {
	expirationTime := time.Now().Add(tokenDuration)

	claims := &Claims{
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecretKey))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expirationTime.Unix(), nil
}

// ExtractTokenFromRequest extracts the JWT token from the request header
// It expects the token to be in the format { "Authorization": "Bearer <token>"}
func ExtractTokenFromRequest(r *http.Request) string {
	bearerToken := r.Header.Get("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}
	return ""
}

// VerifyToken checks if a JWT token is valid and returns the claims
func VerifyToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Check signature method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signature method")
		}
		return []byte(jwtSecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Manual expiration check for extra security
	now := time.Now().Unix()
	if claims.ExpiresAt < now {
		return nil, errors.New("token expired")
	}

	return claims, nil
}
