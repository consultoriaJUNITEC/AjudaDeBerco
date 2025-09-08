# AjudaDeBerco

## 📋 Project Description

Stock management helper system for "Ajuda de Berço" organization. This web application helps creating the input and output reports and navigating the warehouse.

## 🛠️ Technologies
	•	Frontend: React + TypeScript
	•	Backend: Go
	•	Database: SQLite
	•	Containerization: Docker

## 🚀 Getting Started

### 🔧 Prerequisites
	•	Node.js (v18+)
	•	Go (v1.20+)
	•	SQLite (pre-installed or used via Go’s built-in libraries)
	•  Docker and Docker Compose for containerized deployment


### 🔙 Backend (Go)
	•  Go was selected for its performance, simplicity, and efficiency
	•  Provides robust HTTP handling and easy deployment with minimal dependencies
	•  Strong typing helps prevent runtime errors

### 🛢️ Database
	•	SQLite is used as a lightweight embedded database
	•	The .db file will be automatically created in the backend root

### 💻 Frontend (React + TypeScript)
	•  React offers a component-based architecture for building interactive UIs
	•  TypeScript adds static type-checking to improve code quality and maintainability
	•  Allows for a responsive and modern interface


## 🚀 Running the Application

You can run this application using either Docker or manually.

### Option 1: Using Docker

1. Make sure Docker and Docker Compose are installed on your system
2. From the project root, run:
   ```
   docker-compose up -d
   ```
3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

To stop the containers:
```
docker-compose down
```

### Option 2: Manual Setup

#### Backend
1. Navigate to `backend/` directory
2. Run `go build -o backend` to compile the backend
3. Start the server with `./backend`
4. The app will be available at http://localhost:8080

#### Frontend
1. Open another terminal
2. Navigate to `frontend/` directory
3. Run `npm install`
4. Then `npm start`
5. The app will be available at http://localhost:3000


## 📦 Build

### For Development

#### Frontend
- Navigate to `frontend/` directory
- Run `npm run build` to create a production build
- Output will be in the `build` folder

#### Backend
- Navigate to `backend/` directory
- Run `go build -o app` to compile the backend binary

### For Docker Deployment
- From the project root directory:
  ```
  docker-compose build
  ```
- This will build both frontend and backend Docker images according to their respective Dockerfiles
- After building, run with:
  ```
  docker-compose up -d
  ```


## 📄 API Documentation
	•	API endpoints are documented in API_ENDPOINTS.md
	•	Backend data structures are explained in BACKEND_STRUCTURE.md
