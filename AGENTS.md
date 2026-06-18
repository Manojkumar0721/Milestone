# Milestone — Agent Guide

## Structure

```
backend/   — Spring Boot 3.3.5, Java 21, Maven
frontend/  — Vite 8 + React 19 (JSX, no TypeScript), PWA
```

## Backend

- **Entrypoint:** `com.milestone.MilestoneApplication` (`src/main/java/...`)
- **API base:** `/api` — all endpoints return JSON
- **Auth:** JWT via `jjwt 0.12.6`. Public: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Everything else requires `Authorization: Bearer <token>`.
- **DB:** MySQL by default. Config via env vars `MYSQL_URL` (full JDBC URL, e.g. Aiven/PlanetScale) or individual `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`.
- **Port:** Uses `PORT` env var (Render) with `8080` fallback.
- **CORS:** Allows `localhost:5173`–`5176` by default. Override via `APP_CORS_ORIGINS` env.
- **JWT config:** `APP_JWT_SECRET`, `APP_JWT_TTL` env vars (dev defaults in `application.properties`).
- **Lombok** on all entities — getters/setters are generated.
- **All mutation endpoints** return the full updated `GoalDto` — the frontend swaps it in-place.
- **Requires JDK 21+** — set `JAVA_HOME` accordingly (e.g. `C:\Program Files\Java\jdk-23`).
- **No tests exist** (no `src/test` directory).
- **Docker build:** `docker build -t milestone-api .` (uses multi-stage, outputs JAR)

### Commands

```sh
cd backend
mvn spring-boot:run                          # dev server on :8080 (MySQL)
mvn compile                                  # build
```

## Frontend

- **Entrypoint:** `src/main.jsx` → `App.jsx`
- **API client:** `src/api/client.js` — `VITE_API_URL` env var (default `http://localhost:8080/api`).
- **Auth context:** `src/auth/AuthContext.jsx` — JWT persisted in `localStorage` key `milestone.token`.
- **PWA:** Enabled via `vite-plugin-pwa` (auto-update). Outputs to `dev-dist/` in dev mode.
- **State management:** React hooks + prop drilling (no Redux/Zustand).
- **No tests exist.**

### Commands

```sh
cd frontend
npm install          # install deps
npm run dev          # Vite dev server (default :5173)
npm run build        # production build to dist/
npm run lint         # ESLint (flat config)
npm run preview      # preview production build
```

## Deployment

### Backend — Render (free tier)
1. Push repo to GitHub
2. Render → New Web Service → connect repo → select **Docker** runtime
3. Set env vars: `MYSQL_URL`, `APP_JWT_SECRET`, `APP_CORS_ORIGINS`
4. Free tier spins down after inactivity (cold start on first request)

### Frontend — Vercel (free tier)
1. Vercel → Add New Project → import repo → set root to `frontend/`
2. Env var: `VITE_API_URL=https://your-backend.onrender.com/api`
3. Build: `npm run build`, output: `dist/`
4. `vercel.json` handles SPA client-side routing

### MySQL — Aiven (free tier)
1. Aiven → Create MySQL → **Free** plan (1 GB, auto-pause)
2. Once created, copy the **JDBC URI** and set as `MYSQL_URL` on Render
3. Enable `ssl-mode=REQUIRED` in the URI if Aiven requires it

## conventions

- Frontend is **JSX only** — no `.ts`/`.tsx`. Don't add TypeScript.
- Backend uses **Lombok** (`@Getter`, `@Setter`) — don't write manual getters/setters.
- Vite config uses **Oxc** (via `@vitejs/plugin-react`) — not SWC or Babel.
- All API mutation responses return full `GoalDto` — frontend replaces the goal in local state rather than refetching.
- `spring.jpa.open-in-view=false` — lazy-loading outside transactions throws; fetch eagerly in service layer or use `@Transactional`.
