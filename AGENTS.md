# AGENTS.md — Milestone

Two independent projects in one repo — a Spring Boot API and a React SPA. No monorepo tooling.

## Directories

| Path | What | Entrypoint |
|------|------|-----------|
| `backend/` | Java 21 + Spring Boot 3.3.5 + Maven | `com.milestone.MilestoneApplication` |
| `frontend/` | React 19 + Vite 8 (plain JS, **not** TypeScript) | `src/main.jsx` |

## Backend commands (from `backend/`)

| Command | What |
|---------|------|
| `mvn spring-boot:run` | Dev server on `:8080` |
| `mvn spring-boot:run -Dspring-boot.run.profiles=mysql` | Switch to MySQL |
| `mvn compile` | Compile check |
| `mvn test` | Run tests |

Backend has **no tests yet** (`src/test/` does not exist). Dev DB is H2 file at `./data/milestonedb.mv.db`. Browse at `http://localhost:8080/h2-console`.

JWT secret and TTL via `APP_JWT_SECRET` / `APP_JWT_TTL` env vars (dev defaults in `application.properties`).

## Frontend commands (from `frontend/`)

| Command | What |
|---------|------|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint (JS/JSX only) |
| `npm run preview` | Preview production build |

No typecheck step (plain JS). No test framework installed.

## Dev workflow

1. Start backend (`mvn spring-boot:run`) — runs on `:8080`
2. Start frontend (`npm run dev`) — runs on `:5173`, proxies API calls to `:8080/api`
3. Frontend env var `VITE_API_URL` overrides API base URL (default `http://localhost:8080/api`)

## API conventions

- All routes under `/api` prefix
- JWT in `Authorization: Bearer <token>` header
- Token persisted in `localStorage` under key `milestone.token`
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- CRUD at `/api/goals`, `/api/goals/:id/milestones`, `/api/milestones/:id/tasks`, `/api/tasks/:id`
- Milestone reorder: `PUT /api/milestones/:id/move?dir=up|down`
- 204 response for DELETE; error body `{ "error": "..." }`

## Notable quirks

- **Plain JS throughout** — no TypeScript in frontend; do not introduce `.ts`/`.tsx` without asking
- `dev-dist/` is a Vite PWA dev artifact — gitignored at `frontend/.gitignore` but **not** in root `.gitignore`
- Lombok is used in backend; IDE needs Lombok plugin
- `@Builder`, `@Data`, `@AllArgsConstructor` on DTOs/entities
- Backend has a root `.gitignore`? No — only `frontend/.gitignore` exists
- `./backend/data/` contains the H2 dev database file — it's committed (not gitignored)
