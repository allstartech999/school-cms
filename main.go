package main

import (
	"context"
	"embed"
	"errors"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"school-cms/db"
	"school-cms/handlers"
	schoolmcp "school-cms/mcp"
	"school-cms/middleware"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

//go:embed all:dist
var embeddedFS embed.FS

func main() {
	mcpStdio := flag.Bool("mcp-stdio", false, "Run in MCP Stdio mode for local AI Agent CLI / Claude Desktop")
	flag.Parse()

	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// 1. Initialize PostgreSQL Database via GORM
	database, err := db.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	sqlDB, err := database.DB()
	if err == nil {
		defer sqlDB.Close()
	}

	// If running in MCP Stdio mode, start and block here
	if *mcpStdio {
		log.Println("🤖 Starting School CMS MCP Server in Stdio mode...")
		mcpEngine := schoolmcp.NewSchoolMCPServer()
		if err := mcpserver.ServeStdio(mcpEngine); err != nil {
			log.Fatalf("MCP Stdio server error: %v", err)
		}
		return
	}

	// 2. Setup Go Native Router (net/http ServeMux)
	mux := http.NewServeMux()

	// --- Uploads Static Directory ---
	handlers.EnsureUploadDir()
	mux.HandleFunc("GET /uploads/", handlers.ServeOptimizedUpload)
	mux.HandleFunc("GET /api/v1/images", handlers.OptimizeImageEndpoint)

	// --- Public APIs ---
	mux.HandleFunc("GET /api/v1/posts", handlers.ListPosts)
	mux.HandleFunc("GET /api/v1/posts/{id}", handlers.GetPost)
	mux.HandleFunc("GET /api/v1/pages", handlers.ListPages)
	mux.HandleFunc("GET /api/v1/pages/{slug}", handlers.GetPage)
	mux.HandleFunc("GET /api/v1/stats", handlers.GetStats)
	mux.HandleFunc("GET /api/v1/settings", handlers.GetSiteSettings)
	mux.HandleFunc("GET /api/v1/media", handlers.ListMedia)
	mux.HandleFunc("GET /api/v1/homepage", handlers.GetHomepageConfig)
	mux.HandleFunc("GET /api/v1/menu", handlers.GetNavigationMenu)

	// --- Site Customizer & Menu APIs (Protected by Admin or Agent) ---
	mux.HandleFunc("PUT /api/v1/settings", middleware.AgentOrAdminAuth(handlers.UpdateSiteSettings))
	mux.HandleFunc("PUT /api/v1/homepage", middleware.AgentOrAdminAuth(handlers.UpdateHomepageConfig))
	mux.HandleFunc("PUT /api/v1/menu", middleware.AgentOrAdminAuth(handlers.UpdateNavigationMenu))
	mux.HandleFunc("POST /api/v1/menu/reset", middleware.AgentOrAdminAuth(handlers.ResetNavigationMenu))

	// --- Admin APIs (Protected by AdminAuth) ---
	mux.HandleFunc("POST /api/v1/admin/login", handlers.AdminLogin)
	mux.HandleFunc("POST /api/v1/posts", middleware.AdminAuth(handlers.CreatePost))
	mux.HandleFunc("PUT /api/v1/posts/{id}", middleware.AdminAuth(handlers.UpdatePost))
	mux.HandleFunc("DELETE /api/v1/posts/{id}", middleware.AdminAuth(handlers.DeletePost))
	mux.HandleFunc("POST /api/v1/pages", middleware.AdminAuth(handlers.CreatePage))
	mux.HandleFunc("PUT /api/v1/pages/{id}", middleware.AdminAuth(handlers.UpdatePage))
	mux.HandleFunc("DELETE /api/v1/pages/{id}", middleware.AdminAuth(handlers.DeletePage))
	mux.HandleFunc("POST /api/v1/media/upload", middleware.AdminAuth(handlers.UploadMedia))

	// --- AI Agent APIs (Protected by AgentAuth: X-Agent-Key) ---
	mux.HandleFunc("GET /api/v1/agent/posts", middleware.AgentAuth(handlers.AgentListPosts))
	mux.HandleFunc("POST /api/v1/agent/posts", middleware.AgentAuth(handlers.AgentCreatePost))
	mux.HandleFunc("PUT /api/v1/agent/posts/{id}", middleware.AgentAuth(handlers.UpdatePost))
	mux.HandleFunc("DELETE /api/v1/agent/posts/{id}", middleware.AgentAuth(handlers.DeletePost))
	mux.HandleFunc("GET /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentListPages))
	mux.HandleFunc("POST /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentCreateOrUpdatePage))
	mux.HandleFunc("DELETE /api/v1/agent/pages/{id}", middleware.AgentAuth(handlers.DeletePage))
	mux.HandleFunc("POST /api/v1/agent/media/fetch", middleware.AgentAuth(handlers.AgentFetchMedia))

	// --- MCP SSE Server (/mcp/sse & /mcp/messages) ---
	mcpEngine := schoolmcp.NewSchoolMCPServer()
	sseServer := mcpserver.NewSSEServer(
		mcpEngine,
		mcpserver.WithSSEEndpoint("/mcp/sse"),
		mcpserver.WithMessageEndpoint("/mcp/messages"),
	)
	mux.HandleFunc("/mcp/sse", middleware.AgentAuth(sseServer.SSEHandler().ServeHTTP))
	mux.HandleFunc("/mcp/messages", middleware.AgentAuth(sseServer.MessageHandler().ServeHTTP))

	// 3. Static Web Handler (SPA Fallback + Static files with Cache-Control)
	var distFS fs.FS
	hasEmbedded := false
	if _, err := os.Stat("dist/index.html"); err == nil {
		distFS = os.DirFS("dist")
		hasEmbedded = true
	} else if sub, err := fs.Sub(embeddedFS, "dist"); err == nil {
		distFS = sub
		hasEmbedded = true
	}

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Never fallback for API paths
		if strings.HasPrefix(path, "/api/") {
			handlers.WriteError(w, http.StatusNotFound, "API endpoint not found")
			return
		}

		if hasEmbedded {
			// Cache policy: In development mode, strictly disable browser caching
			isDev := strings.ToLower(os.Getenv("APP_ENV")) != "production" && strings.ToLower(os.Getenv("ENV")) != "production"
			if !isDev && strings.HasPrefix(path, "/assets/") {
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			}

			// Check if file exists in embedded dist
			trimmedPath := strings.TrimPrefix(path, "/")
			if trimmedPath != "" {
				f, err := distFS.Open(trimmedPath)
				if err == nil {
					f.Close()
					http.FileServer(http.FS(distFS)).ServeHTTP(w, r)
					return
				}
			}

			// SPA Fallback: serve index.html for unknown frontend routes
			r.URL.Path = "/"
			http.FileServer(http.FS(distFS)).ServeHTTP(w, r)
			return
		}

		// Fallback message if dist has not yet been embedded
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(`<!DOCTYPE html>
<html>
<head><title>School CMS API</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
  <h1 style="color: #15803d;">🌿 School CMS Backend (Go + PostgreSQL)</h1>
  <p>Backend API is running successfully on port 8080.</p>
  <p>Available endpoints: <code>/api/v1/posts</code>, <code>/api/v1/pages</code>, <code>/api/v1/stats</code></p>
</body>
</html>`))
	})

	// Wrap router with CORS and Logging middlewares
	handler := middleware.CORS(middleware.Logging(mux))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server run context for graceful shutdown
	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	// Listen for syscall signals for process to interrupt/quit
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		// Shutdown signal with grace period of 10 seconds
		shutdownCtx, shutdownCancel := context.WithTimeout(serverCtx, 10*time.Second)
		defer shutdownCancel()

		go func() {
			<-shutdownCtx.Done()
			if errors.Is(shutdownCtx.Err(), context.DeadlineExceeded) {
				log.Println("Graceful shutdown timed out.. forcing exit.")
				os.Exit(1)
			}
		}()

		// Trigger graceful shutdown
		log.Println("Shutting down gracefully...")
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
		serverStopCtx()
	}()

	log.Printf("🌿 School CMS server listening on http://localhost:%s", port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("Server failed: %v", err)
	}

	// Wait for server context to be stopped
	<-serverCtx.Done()
	log.Println("Server exited cleanly.")
}
