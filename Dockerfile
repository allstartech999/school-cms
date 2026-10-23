# =========================================================================
# Stage 1: Build Frontend Assets (React 19 + Tailwind CSS v4)
# =========================================================================
FROM node:24-alpine AS frontend-builder
WORKDIR /build

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /build/frontend
RUN npm ci || npm install

# Copy frontend source files
COPY frontend/ ./
RUN npm run build

# =========================================================================
# Stage 2: Build Go Single Binary with Embedded Frontend Dist
# =========================================================================
FROM golang:1.26-alpine AS backend-builder
WORKDIR /build

# Install CGO dependencies for WebP optimization (gcc, musl, libwebp)
RUN apk add --no-cache gcc musl-dev libwebp-dev

# Copy Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source code
COPY . .

# Copy freshly compiled frontend dist from Stage 1 into ./dist
COPY --from=frontend-builder /build/dist ./dist

# Compile Go Single Binary with CGO enabled (required for github.com/chai2010/webp)
ENV CGO_ENABLED=1
RUN go build -ldflags="-s -w" -o school-cms .

# =========================================================================
# Stage 3: Production Minimal Runner
# =========================================================================
FROM alpine:3.21 AS runner
WORKDIR /app

# Install runtime libraries: libwebp, ca-certificates, tzdata
RUN apk add --no-cache libwebp ca-certificates tzdata wget \
    && cp /usr/share/zoneinfo/Asia/Bangkok /etc/localtime \
    && echo "Asia/Bangkok" > /etc/timezone

# Create directory for persistent uploads
RUN mkdir -p /app/uploads

# Copy compiled binary from backend builder
COPY --from=backend-builder /build/school-cms /app/school-cms

EXPOSE 8080

ENV PORT=8080 \
    APP_ENV=production

ENTRYPOINT ["/app/school-cms"]
