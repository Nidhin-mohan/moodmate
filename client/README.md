# MoodMate — Frontend

React single-page application for mood tracking, built with TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **React 18** with TypeScript
- **Vite 6** — Build tool with HMR
- **Tailwind CSS 3** — Utility-first styling with CSS custom properties for theming
- **shadcn/ui** — Component primitives (new-york style, zinc base, lucide icons)
- **React Router 6** — Client-side routing with data-driven config
- **React Hook Form** + **Zod** — Form handling with schema validation
- **Axios** — HTTP client with request/response interceptors
- **Framer Motion** — Animations

## Getting Started

```bash
cp .env.example .env     # Default: VITE_API_BASE_URL=http://localhost:5000/api/v1
npm install
npm run dev              # http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + Vite production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve production build locally |

## Project Structure

```
src/
├── api/
│   └── index.ts              # Axios instance (Bearer token interceptor, 401 redirect)
├── auth/
│   ├── access.ts             # Role-based canAccess() helper
│   └── ProtectedRoute.tsx    # Redirects unauthenticated users to /login
├── components/
│   ├── layout/
│   │   ├── Layout.tsx        # App shell (Navbar + content area)
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/                   # shadcn/ui primitives (button, card, input, select, etc.)
├── context/
│   └── AuthContext.tsx        # Auth state via React Context + localStorage
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── SignUp.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx     # Mood stats and aggregated data
│   ├── moodTracking/
│   │   ├── MoodTrackingForm.tsx  # Create mood log
│   │   └── MoodHistory.tsx       # Browse past logs
│   ├── profile/
│   │   └── UserProfile.tsx
│   ├── Home.tsx
│   └── Unauthorized.tsx
├── routes/
│   ├── routes.json           # Route definitions (path, component, roles, layout)
│   ├── componentMap.ts       # Maps component names → React.lazy() imports
│   ├── AppRouter.tsx         # Reads config, applies role checks, renders routes
│   └── routeTypes.ts
├── services/
│   ├── authServices.ts       # Login, register, profile API calls
│   └── moodLogService.ts     # Mood CRUD + stats API calls
├── types/
│   └── auth.ts               # Auth-related TypeScript interfaces
├── lib/
│   └── utils.ts              # cn() utility (clsx + tailwind-merge)
├── utils/
│   └── toast.tsx             # showToast helper + ToastProvider
├── index.css                 # Tailwind directives + CSS custom properties
└── main.tsx                  # Entry point
```

## Architecture

### Routing

Routes are **data-driven** — declared in `routes.json`, not as JSX:

```json
{ "path": "/dashboard", "component": "Dashboard", "roles": ["user"], "layout": "MainLayout" }
```

`AppRouter` reads the config, resolves components via `componentMap.ts` (all lazy-loaded for code splitting), checks access with `canAccess()`, and wraps protected routes in `<ProtectedRoute>`.

**To add a new page:** Add an entry to `routes.json` + register the lazy component in `componentMap.ts`.

### Auth Flow

1. `AuthProvider` wraps the entire app (outside `BrowserRouter` so auth state is available at the router level)
2. State is initialized synchronously from `localStorage` — no async fetch, no loading flash
3. Token stored under `"token"`, user object under `"user"` in localStorage
4. `isLoggedIn` is derived from `!!token`
5. Axios request interceptor reads token from localStorage on every request (avoids stale closures)
6. Axios response interceptor redirects to `/login` on 401 via `window.location.href` (hard redirect for a clean slate)

### Provider Order

```
StrictMode → AuthProvider → BrowserRouter → ToastProvider + App
```

### API Layer

- Base URL configured via `VITE_API_BASE_URL` env var (baked in at build time)
- The base URL already includes `/api/v1`, so service calls use relative paths: `/auth/login`, `/mood`, `/mood/stats`
- Services catch `AxiosError` and throw plain `Error` with user-friendly messages

### Styling

- All colors use CSS custom properties: `hsl(var(--background))`, `hsl(var(--primary))`, etc.
- Theme changes only require updating CSS variables in `index.css`
- Dark mode supported via Tailwind `class` strategy
- Class utilities: `class-variance-authority` + `clsx` + `tailwind-merge` (via `cn()`)

## Routes

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | Home | Public | Landing page |
| `/login` | Login | Public | Login form |
| `/signup` | SignUp | Public | Registration form |
| `/dashboard` | Dashboard | User | Mood stats overview |
| `/mood-tracking` | MoodTrackingForm | User | Log a new mood entry |
| `/mood-history` | MoodHistory | User | Browse past mood logs |
| `/profile` | UserProfile | User | User profile |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api/v1` |

> `VITE_` prefix is required by Vite. The value is replaced at build time via `import.meta.env` — it cannot be changed after the bundle is built.

## Path Alias

`@/` maps to `./src/` — configured in both `tsconfig.app.json` and `vite.config.ts`.

## Deployment

### Docker

```bash
# From repo root
docker-compose up --build
```

- Multi-stage Dockerfile: stage 1 builds with Node 20, stage 2 serves static files via `nginx:alpine`
- `VITE_API_BASE_URL` must be set **before** `docker build` (baked into the bundle)
- nginx config includes SPA fallback (`try_files $uri /index.html`) and API proxy to backend

### Production (S3 + CloudFront)

The GitHub Actions CD pipeline:
1. Builds the Vite bundle with `VITE_API_BASE_URL` injected from secrets
2. Syncs `dist/` to an S3 bucket
3. Invalidates the CloudFront distribution cache
