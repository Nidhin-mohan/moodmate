# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this client directory.

## Commands

```bash
npm run dev          # vite dev server with HMR
npm run build        # tsc -b && vite build (type-check + bundle)
npm run lint         # eslint
npm run preview      # vite preview (serve production build locally)
```

## Architecture Notes

React 18 + TypeScript + Vite 6 + Tailwind CSS v3 + shadcn/ui (new-york style, zinc base color).

### Provider Wrapping Order

`StrictMode` → `AuthProvider` → `BrowserRouter` → `ToastProvider` + `App`

AuthProvider is intentionally outside BrowserRouter so auth state is available at the router level (AppRouter calls `useAuth()` to determine role before rendering routes).

### Key Directories

- `src/api/` — Axios instance with interceptors (attaches Bearer token from localStorage, auto-redirect on 401)
- `src/context/` — `AuthContext.tsx`: React Context for auth state, token under `"token"` and user under `"user"` in localStorage
- `src/auth/` — `ProtectedRoute.tsx` (redirects unauthenticated to `/login`), `access.ts` (role-based `canAccess()`)
- `src/routes/` — data-driven routing system (JSON config → lazy-loaded components)
- `src/pages/` — page components (Home, Login, SignUp, Dashboard, MoodTrackingForm, MoodHistory, UserProfile, Unauthorized)
- `src/components/layout/` — Layout shell (Navbar + content area)
- `src/components/ui/` — shadcn/ui primitives (button, card, input, select, slider, switch, checkbox, textarea, toggle)
- `src/services/` — API call wrappers (`authServices.ts`, `moodLogService.ts`)
- `src/types/` — TypeScript interfaces for auth types
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `src/utils/toast.tsx` — `showToast` helper (callable anywhere, no hooks needed) + `ToastProvider` (react-toastify singleton)

### Routing System

Routes are **data-driven**, not hard-coded JSX:
1. `routes/routes.json` — declares path, component name, allowed roles, optional layout
2. `routes/componentMap.ts` — maps component names to `React.lazy()` imports (all pages are code-split)
3. `routes/AppRouter.tsx` — reads JSON config, resolves components, applies role checks via `canAccess()`, wraps protected routes in `<ProtectedRoute>`, optionally wraps in layout component

To add a new route: add an entry to `routes.json` and register the lazy component in `componentMap.ts`.

Currently two roles: `"public"` (unauthenticated) and `"user"` (logged in). The design supports adding roles like `"admin"` or `"therapist"` trivially.

### Auth Flow

- `AuthContext` initializes state synchronously from localStorage — no async fetch, no loading flash
- `isLoggedIn` is derived from `!!token`
- Axios request interceptor reads token from localStorage (not React state) on every request to avoid stale closure issues
- Axios 401 interceptor does a hard `window.location.href = "/login"` redirect — this guarantees a clean slate on session expiry but loses in-memory state
- `<ProtectedRoute>` renders children if `isLoggedIn`, otherwise redirects to `/login`

### UI / Styling

- All colors use CSS custom properties (`hsl(var(--xyz))`), defined in `src/index.css`. Theme changes only require updating CSS variable values, not Tailwind classes.
- shadcn/ui configured via `components.json` (new-york style, zinc base, lucide icons, `rsc: false`)
- Dark mode supported via Tailwind `class` strategy
- Animations: `framer-motion` + `tailwindcss-animate` plugin
- Class utilities: `class-variance-authority` + `clsx` + `tailwind-merge` (via `cn()` in `lib/utils.ts`)

### Forms

`react-hook-form` v7 + `zodResolver` + Zod for validation. Tag fields (people, places, events) are collected as comma-separated strings in the form and converted to `string[]` in `onSubmit` before calling the API.

## Path Alias

`@/` maps to `./src/` — configured in both `tsconfig.app.json` and `vite.config.ts`.

## API Base URL

Set via `VITE_API_BASE_URL` in `.env`. Falls back to `http://localhost:5000/api/v1` if not set. Used in `src/api/index.ts`.

## Deployment Steps

### Local Development
1. Create `.env` from `.env.example`
2. `npm install && npm run dev`
3. Runs at `http://localhost:5173` with HMR

### Docker
1. `docker-compose up --build` from repo root
2. Vite builds the app at Docker build time. `VITE_API_BASE_URL` must be set **before** `docker build` — it's baked into the bundle at compile time.
3. Served via nginx:alpine at `localhost:5173` (maps to container port 80)
4. SPA fallback configured in `nginx.conf` (`try_files $uri /index.html`)

### Production
- Multi-stage Dockerfile: stage 1 builds with Node 20, stage 2 serves static files with nginx:alpine
- Final image contains only nginx + static files — no Node.js or build tools
- `VITE_API_BASE_URL` must point to the production backend URL and be set at build time

## Tradeoff Explanations

- **Data-driven routing vs JSX routes**: Adds two-file overhead per route (routes.json + componentMap.ts) but centralizes route metadata (roles, layouts) and eliminates scattered auth checks across components.
- **localStorage auth vs httpOnly cookies**: Simpler to implement and works across subdomains. Vulnerable to XSS. `withCredentials: true` on Axios is set defensively for a potential future migration to cookie-based auth.
- **Hard redirect on 401 vs React navigation**: Axios interceptors can't access React context or hooks. `window.location.href = "/login"` forces a full page reload, losing in-memory state, but guarantees a clean application state on session expiry.
- **`componentMap` typed as `any`**: TypeScript can't narrow `componentMap[stringKey]` to a valid React component type. The `as any` cast is the pragmatic escape hatch for the data-driven routing pattern.
- **No edit/delete in mood UI**: Immutable mood logs preserve full history for pattern analysis and prevent retroactive data manipulation. Users log again if their mood changes.

## Lessons Learned

- **localStorage key consistency**: The token key used by AuthContext and the Axios interceptor must match exactly (both use `"token"`). A mismatch silently breaks all authenticated requests.
- **Vite env var prefix**: Must use `VITE_` prefix (not `REACT_APP_`). Wrong prefix means the var is silently `undefined` at runtime. `import.meta.env` values are replaced at build time — they're baked into the bundle.
- **API path alignment**: The base URL includes `/api/v1`, so service calls use relative paths like `/auth/login` and `/mood`, not full paths. Getting this wrong causes silent 404s.
- **Form-to-API type conversion**: Backend expects `string[]` for tag fields, form collects `string`. The `split(",").map(s => s.trim()).filter(Boolean)` conversion must happen before calling the service.

## Incident Simulations

### All authenticated calls return 401
1. Check localStorage key match between AuthContext (`"token"`) and Axios interceptor
2. Check that the request interceptor correctly formats `Authorization: Bearer <token>`
3. Check token expiry (7 days from login)
4. Check that server's JWT_SECRET hasn't changed since the token was issued

### Routes 404 on page refresh (production)
The web server must have SPA fallback routing. In nginx: `try_files $uri /index.html`. The Docker setup includes this in `nginx.conf`, but other hosting environments need equivalent config.

### Docker frontend can't reach backend
`VITE_API_BASE_URL` must be a URL reachable from the **user's browser**, not from inside the Docker network. `http://backend:5000` won't work — Docker service names aren't resolvable from the browser. Use `http://localhost:5000/api/v1` for local Docker, or the production URL. Requires a client image rebuild to change.

### Blank page after login
Check browser console for lazy-load errors. If a component name in `routes.json` doesn't match a key in `componentMap.ts`, the route renders nothing. Also verify that the component file exists and has a default export.
