# Use multi-stage build for smaller final image
FROM golang:1.23-alpine AS builder

# Set destination for COPY
WORKDIR /app

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the binary with optimizations for Cloud Run
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage - use minimal base image
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy static assets if they exist
COPY --from=builder /app/assets ./assets

# Expose the port (Cloud Run will override this with PORT env var)
EXPOSE 8080

# Run the binary
CMD ["./main"]
