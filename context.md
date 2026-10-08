# Web Rush Repository Context

This file summarizes the repository as it exists now. Treat source code, schema, and migrations as the authority for implemented behavior. The project overview in `AGENTS.md` describes the intended product direction; it does not mean all of those features exist yet.

## What this project is

Web Rush is intended to become a game-like web event application with a frontend, backend, database, leaderboard, and admin functionality. The current repository is an early scaffold:

- The React client now provides a team login screen and a simple authenticated home placeholder.
- The server now has an Express authentication API. There are no game/event, leaderboard, or admin endpoints yet.
- The only database model currently defined is `Team`.
- There is no implemented event flow, gameplay, leaderboard, or admin interface in the source currently present.

Do not infer product rules from the intended overview. Requirements are evolving; ask when a meaningful product or architecture decision cannot be inferred from existing code or an explicit request.

## Repository layout

```text
.
├── AGENTS.md                    # Project principles and instructions for coding agents
├── context.md                   # This implementation-oriented repository guide
├── LICENSE                      # MIT license
├── .gitignore                   # Ignores dependencies, environment files, build output, caches, and OS files
├── client/                      # React + Vite frontend
│   ├── package.json             # Frontend scripts and dependencies
│   ├── package-lock.json        # Locked npm dependency tree
│   ├── vite.config.js           # Vite config with React plugin
│   ├── eslint.config.js         # ESLint rules for JS/JSX and React hooks/refresh
│   ├── index.html               # Browser entry HTML; title is currently "client"
│   ├── README.md                # Unmodified React/Vite starter documentation
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg             # SVG symbols used by the starter page
│   └── src/
│       ├── main.jsx             # React entry; mounts App in StrictMode
│       ├── App.jsx              # Starter Vite page and local counter state
│       ├── App.css              # Starter page component styles
│       ├── index.css            # Global styles and light/dark theme variables
│       └── assets/
│           ├── hero.png         # Starter hero illustration
│           ├── react.svg
│           └── vite.svg
    └── server/                      # Express authentication API and Prisma setup
    ├── package.json             # Server scripts and dependencies
    ├── package-lock.json        # Locked npm dependency tree
    ├── skills-lock.json         # Prisma CLI skill metadata; not application logic
    ├── .env.example              # Local server configuration template
    ├── prisma7.config.ts        # Prisma config; loads dotenv and DATABASE_URL
    ├── src/
    │   ├── app.js                # Express app and route setup
    │   ├── db.js                 # Prisma PostgreSQL client
    │   ├── security.js           # Scrypt password and HS256 JWT helpers
    │   ├── middleware/requireTeamAuth.js
    │   └── routes/auth.js        # Registration, login, current team
    └── prisma/
        ├── schema.prisma        # PostgreSQL schema: currently one Team model
        └── migrations/
            ├── migration_lock.toml
            └── 20261007152650_init/migration.sql
```

Dependency lockfiles record exact transitive package versions and integrity hashes; consult them only when dependency resolution itself is relevant. Binary and static assets are presentation resources, not application logic.

## Frontend details

- Stack: JavaScript ES modules, React, React DOM, Vite, and the Vite React plugin.
- `client/src/main.jsx` imports `theme.css` and renders `App` inside React `StrictMode`.
- `client/src/App.jsx` defines routes for `/` and `/login`. `client/src/pages/Home.jsx` checks the stored JWT with `/auth/me`; without a valid session, it redirects to `/login`. With a valid session, it shows the team name/code placeholder and a sign-out action.
- `client/src/pages/Login.jsx` posts team code and password to `/auth/login`, stores the returned JWT in local storage, and navigates to `/` after a successful login. There is intentionally no registration UI because organizers will provision teams.
- `client/src/theme.css` contains global reset rules and named design tokens (`--color-background`, `--color-text`, `--color-brand`, `--font-body`, etc.) so the team can change the palette centrally. Page-specific styles live beside each page in `pages/`.
- `client/src/components/BrandMark.jsx` and `FormField.jsx` are small shared UI components. `client/src/api.js` configures Axios; `VITE_API_URL` can override its default `http://localhost:3000/api` base URL.
- `client/vite.config.js` only configures the React plugin. There is no API proxy or environment-specific client configuration here.
- `axios` and `react-router-dom` are declared dependencies but are not currently used by the source files. Their presence does not establish routing or API behavior.
- `client/index.html` sets the Web Rush team portal title and theme color.

Useful commands, run from `client/`:

- `npm run dev` — start Vite development server.
- `npm run build` — create the production bundle in `dist/`.
- `npm run preview` — serve a built bundle locally.
- `npm run lint` — run ESLint.

## Backend and database details

- `server/package.json` declares Express 5, CORS, dotenv, Prisma 7, the Prisma PostgreSQL adapter, and `pg`.
- `server/src/app.js` configures Express, validates runtime secrets, mounts routes, and closes the Prisma connection on shutdown. `server/src/db.js` constructs Prisma with the PostgreSQL driver adapter. `server/src/security.js` provides password hashing and JWT helpers. `server/src/routes/auth.js` implements auth endpoints; `server/src/middleware/requireTeamAuth.js` checks bearer tokens.
- The API has `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, and protected `GET /api/auth/me` routes.
- Registration accepts `{ "name", "teamCode", "password" }`, requires a password of at least 8 characters, creates a `Team`, and returns `{ "token", "team" }`. Duplicate team codes return 409. Login accepts `{ "teamCode", "password" }` and returns the same shape; invalid credentials return 401.
- Authenticated calls send `Authorization: Bearer <token>`. The 12-hour HS256 JWT uses `Team.id` as `sub`. The `/me` route returns that team's current record. There is no role-based authorization yet; authorization is based on team identity.
- Passwords are stored as per-password salted scrypt hashes. JWT signatures use HMAC-SHA-256. Both use Node's built-in crypto, avoiding new dependencies.
- `server/prisma7.config.ts` loads environment variables via `dotenv/config`, points Prisma at `prisma/schema.prisma` and `prisma/migrations`, and requires `DATABASE_URL` for datasource access.
- `server/prisma/schema.prisma` configures the generated client output at `server/src/generated/prisma` and declares PostgreSQL. `Team` has an auto-increment integer `id`, required `name`, unique required `teamCode`, nullable `passwordHash`, and `createdAt` defaulting to now.
- `20261007152650_init` creates the original `Team` table; `20261008120000_add_team_auth` adds nullable `passwordHash` so existing rows are preserved. Existing team rows cannot log in until a credential setup flow is established; registration creates new rows and does not claim existing teams.
- `.env` files are ignored by Git. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters. Never invent or expose credentials.
- The Prisma generator uses `prisma-client` and emits TypeScript source to `server/src/generated/prisma`; the server imports `.ts` files directly, requiring Node with built-in TypeScript type stripping (Node 22.18+ or 24+).

Useful commands, run from `server/`:

- `npm run db:generate` — generate the Prisma client.
- `npm run db:migrate` — apply/create development migrations (requires a configured database URL).
- `npm run db:migrate:deploy` — apply committed migrations in a deployment environment (requires a configured database URL).
- `npm run db:studio` — open Prisma Studio (requires database configuration as applicable).
- `npm run dev` / `npm start` — run the Express API (require dependencies, generated client, database, and environment variables).

The server `test` script is only a placeholder that exits with “Error: no test specified”; it is not a test suite.

## Working guidance for future changes

- Read `AGENTS.md` before making project changes. It asks for straightforward, maintainable code, clear frontend/backend responsibilities, Prisma for database access, no premature abstractions, and no invented requirements.
- Preserve the current client/server separation. Keep UI concerns in `client/`, API and business logic in `server/`, and database model changes in Prisma schema plus migrations.
- Follow existing conventions where they exist, but recognize that most client code remains generated starter code and there are not yet established backend conventions.
- Do not assume dependencies listed in a manifest are already integrated into application behavior.
- Do not create commits, amend commits, reset branches, push, or otherwise manage Git history; `AGENTS.md` reserves Git history management for the development team.
- The app is licensed under MIT (`LICENSE`).

## Current-state caveat

This guide is a snapshot, not a product specification. Update it when meaningful architecture or implemented behavior changes, and keep intended/planned functionality clearly separated from working code.
