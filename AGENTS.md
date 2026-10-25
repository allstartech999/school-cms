# Agent Guidelines for School CMS

## 🔄 Runtime & Development Workflow
- **Dev Architecture (Two Processes):**
  - **Backend (Port 8080):** Go API server reloaded live via `air` (`.air.toml`).
    - **DO NOT** restart the Go server manually (`go run main.go`, etc.) after making backend code changes; saving files automatically triggers `air` hot reload.
  - **Frontend (Port 3000):** Vite dev server (`cd frontend && npm run dev`).
    - Proxies `/api` and `/uploads` directly to `http://localhost:8080`.
    - Must keep `server.host: true` and `server.allowedHosts: true` in `vite.config.js` for external/tunnel access.

- **Cloudflare Tunnel (`tunnel.krufame.work`):**
  - Runs as a systemd user service (`systemctl --user status cloudflared`).
  - Routes `https://tunnel.krufame.work` -> `http://localhost:3000` (Vite).
  - For the tunnel to function, both Vite (port 3000) and Air (port 8080) must be running.

- **Background Process Management via tmux:**
  - If running servers in the background, use standard tmux sessions:
    - `dev-backend`: `air` in project root.
    - `dev-frontend`: `npm run dev` in `frontend/`.
  - Ensure PATH includes `$HOME/.local/bin`, `$HOME/.local/go/bin`, and `$HOME/.local/node/bin` (or `source ~/.bashrc`).

## 🛠️ Stack & Architecture
- **Backend:** Go (`net/http` standard library router, GORM ORM, PostgreSQL driver).
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons.
- **Embedded Production Binary:** Production serves single binary via `//go:embed all:dist`.
