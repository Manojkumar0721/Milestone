# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` is the canonical guide for env vars, deployment, and conventions — read it too. This file focuses on the cross-file architecture.

## Commands

Backend (`cd backend`, requires JDK 21+):
```sh
mvn spring-boot:run     # dev server on :8080 (MySQL)
mvn compile             # build
mvn package             # build runnable JAR
```

Frontend (`cd frontend`):
```sh
npm install
npm run dev             # Vite dev server (:5173)
npm run build           # production build -> dist/
npm run lint            # ESLint (flat config)
npm run preview
```

No tests exist in either project (no `backend/src/test`, no frontend test runner). The Spring test starters are on the classpath but unused.

To run the full stack locally you need a MySQL instance reachable per `application.properties` (defaults to `localhost:3306`, DB `milestone`, auto-created). The frontend points at `http://localhost:8080/api` unless `VITE_API_URL` is set.

## Architecture

Two independent apps in one repo: a Spring Boot REST API (`backend/`) and a Vite + React 19 SPA (`frontend/`, JSX only — no TypeScript). They communicate over JSON at `/api`.

### Domain model (backend)

A three-level aggregate rooted at `Goal`:
```
User 1──* Goal 1──* Milestone 1──* Task
                └──* GoalEvent   (activity log)
```
`Goal` owns `Milestone`/`GoalEvent` and `Milestone` owns `Task` via `cascade=ALL, orphanRemoval=true`. All mutations go through `GoalService` and operate on the loaded `Goal` graph; children are persisted by cascade, never saved directly. Ordering is by an integer `position` field (`nextPosition` = max + 1); `moveMilestone` swaps positions.

### The "return full goal" contract

**Every** mutation endpoint (add/update/delete of milestone, task, or event) returns the complete, updated `GoalDto` — not the changed sub-entity. The frontend relies on this: `replaceGoal()` in `App.jsx` swaps the goal in local state in place rather than refetching. When adding a new endpoint, return the parent `GoalDto` via `GoalService.mapFresh(goal)`, which calls `em.flush()` first so cascade-inserted children have their generated IDs before `GoalMapper.toDto` runs.

### Derived status — duplicated logic, keep in sync

A milestone's status is **task-driven when it has tasks**, otherwise the manual `status` field:
- 0 tasks done → `todo`, all done → `done`, some done → `active`.

This `effectiveStatus` rule is implemented **twice** and both must agree:
- Backend: `GoalService.effectiveStatus` (drives the "Milestone complete 🏁" event logging).
- Frontend: `frontend/src/utils/progress.js` `effectiveStatus` (drives the UI, plus `milestoneFraction`/`goalProgress` for the visual journey marker).

`goalProgress` is a weight-weighted fraction across milestones (each milestone has a `weight`, default 3). Changing the status/progress rules means editing both files.

### Auth & ownership

Stateless JWT (jjwt). `JwtAuthFilter` validates the `Authorization: Bearer` token on every request and sets an `AuthUser` principal; controllers read `@AuthenticationPrincipal AuthUser u` and pass `u.id()` down. `SecurityConfig` permits only `/api/auth/**` and `GET /api/health`; everything else requires auth. **Authorization is enforced in the service layer**, not security config: `GoalService.goalOf/milestoneOf/taskOf` re-check that the entity belongs to `userId` and throw 404 otherwise. Any new entity lookup must do the same ownership check.

Errors flow through `ApiException` (carries an `HttpStatus`) → `GlobalExceptionHandler` → JSON `{ "error": "..." }`, which the frontend `api()` client unwraps into thrown `Error` messages shown as a transient banner.

### Frontend structure

`main.jsx` → `App.jsx`. `App` is an auth gate (`AuthContext` restores the JWT from `localStorage["milestone.token"]`); when signed in it renders `<Dashboard key={user.id}>` so all state resets on user switch. `Dashboard` holds all goal state and every mutation handler, passing them down as props (no Redux/global store; `useMediaQuery` picks a separate mobile tab layout vs. desktop split layout). The API client (`api/client.js`) holds the token in memory and attaches it as a Bearer header.

`JourneyMap` renders the progress as an SVG serpentine path (`utils/serpentine.js`); milestone stops are placed by cumulative weight fraction (`milestoneStops`).

### Important constraints

- `spring.jpa.open-in-view=false` — lazy associations cannot be loaded outside a transaction. `GoalService` is `@Transactional`; resolve associations inside service methods.
- `spring.jpa.hibernate.ddl-auto=update` — schema auto-migrates from entities; there are no migration files.
- Backend uses **Lombok** (`@Getter`/`@Setter`) — don't hand-write accessors.
- Frontend Vite plugin uses **Oxc** (`@vitejs/plugin-react`), not Babel/SWC.
