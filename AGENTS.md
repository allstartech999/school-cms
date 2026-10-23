# Agent Guidelines for School CMS

## 🔄 Runtime & Development Workflow
- **Live Reload with Air:** The user is already running the Go backend using `air` (`.air.toml`).
  - **DO NOT** execute commands to restart or re-run the Go server (such as `go run main.go`, `server.exe`, etc.) after making backend changes.
  - Simply save/edit the code files; `air` automatically detects changes and triggers a hot reload.
  - Do not instruct the user to restart the server unless configuration or environment changes strictly require a full cold reboot.

## 🛠️ Stack & Architecture
- **Backend:** Go (`net/http` standard library router, GORM ORM, PostgreSQL driver).
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons.
- **Embedded Production Binary:** Production serves single binary via `//go:embed all:dist`.
