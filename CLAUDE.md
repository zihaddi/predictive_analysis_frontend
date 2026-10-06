# Predictive Analysis — Frontend

> SvelteKit 3 · Svelte 5 (runes) · TypeScript · Tailwind CSS 4 · pnpm

Scaffolded with the official Svelte CLI (`sv create`). Follow the official docs:
https://svelte.dev/docs/kit and https://svelte.dev/docs/svelte

Full file-by-file walkthrough, Nuxt → SvelteKit mapping and recipes: `DEVELOPMENT_GUIDE.md`.

## Commands

| Command                       | What it does                                                             |
| ----------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                    | Dev server (http://localhost:5173)                                       |
| `pnpm build` / `pnpm preview` | Production build / preview it                                            |
| `pnpm check`                  | Type-check with svelte-check                                             |
| `pnpm lint` / `pnpm format`   | Prettier + ESLint check / auto-format                                    |
| `pnpm dlx sv add <addon>`     | Add an official add-on (e.g. `drizzle`, `lucia`, `vitest`, `playwright`) |

Always use `sv add` for official integrations instead of wiring them by hand.

## Project structure

```
src/
├── app.d.ts                 App.Locals (user), PageData types
├── app.html                 HTML shell
├── env.ts                   defineEnvVars() — API_BASE_URL, API_PREFIX (both server-only)
├── (messages/*.json)        i18n strings live OUTSIDE src: ../messages/en.json, bn.json (Paraglide)
├── hooks.server.ts          Auth guard — runs on every request (Nuxt "middleware")
├── lib/                     Importable via `#lib/*`
│   ├── assets/              Assets imported by components (icons/, login/)
│   ├── components/          UI components — folder = feature namespace
│   │   ├── Auth/            AuthLayout (shell for ALL auth screens), AuthHero, AuthHeader, AuthLink, AuthMessage,
│   │   │                    AuthSuccess, PasswordInput, PasswordRequirements, LoginForm
│   │   ├── Button/          PrimaryButton (brand gradient; `href` → <a>, `trailingIcon`)
│   │   ├── Input/           TextInput (leading icon, invalid/error state, trailing slot), Checkbox
│   │   ├── Sidebar/         Sidebar (nav items live here)
│   │   └── Common/          Logo, Icon (recolourable SVG mask), LanguageToggle, ThemeToggle (shared across features)
│   ├── stores/              Shared state for components (Nuxt "composables")
│   │   └── auth.ts          auth.user / auth.isLoggedIn (reads page.data.user)
│   ├── api/                 Typed endpoint modules: authApi, usersApi, adminApi (one object per backend resource)
│   ├── server/              Server-only: backend.ts (raw backend client), session.ts (cookies + refresh), auth.ts (login/logout/loadUser)
│   ├── types/               Shared TS types (auth.ts: User, UserRole)
│   └── utils/               fetchApi.ts, useRequest.svelte.ts, apiError.ts (ApiError), password.ts, validation.ts
├── routes/
│   ├── +layout.svelte       Root layout — global CSS, favicon, title
│   ├── +layout.server.ts    Passes locals.user + theme to every page as page.data
│   ├── +error.svelte        Global error page (404 / 403 / 500 / other) — i18n + dark mode
│   ├── +page.server.ts      "/" → redirects to /dashboard or /login
│   ├── (guest)/             Layout group for unauthenticated pages
│   │   ├── login/                  /login
│   │   ├── forgot-password/        /forgot-password   (email → reset link)
│   │   ├── check-email/            /check-email       (reads httpOnly `reset_email` cookie; resend action)
│   │   ├── create-password/        /create-password?token=…  (new password + live requirements)
│   │   └── password-reset-success/ /password-reset-success
│   ├── (app)/               Layout group for authenticated pages (sidebar + header)
│   │   └── dashboard/       /dashboard
│   └── api/                 +server.ts endpoints (Nuxt "server/api")
│       ├── proxy/[...path]/ same-origin gateway to the backend (attaches the httpOnly token, refreshes it)
│       └── auth/logout/     POST /api/auth/logout
static/                      Served as-is at site root
```

## Conventions

- **Svelte 5 runes only** (`$state`, `$derived`, `$props`, `$effect`). No legacy `export let` / `$:` / `on:click`.
- **Components**: `PascalCase.svelte`, grouped by feature folder under `lib/components/`.
- **Stores**: `lib/stores/<name>.svelte.ts` for client-only reactive state (runes). Anything that must be correct during SSR (like the current user) comes from a server `load` and is read via `page.data` — never from a module-level `$state` singleton, which would leak between requests on the server and `$effect` does not run during SSR.
- **Auth in components**: `auth.user` from `#lib/stores/auth.ts`. In `hooks.server.ts`, `load` and `actions`: `event.locals.user`.
- **Errors**: unknown URLs and thrown `error(status, …)` render `src/routes/+error.svelte`. Add copy for a new status as `error_title_<n>` / `error_desc_<n>` in both message files and a `case` in the page. Do not build per-page "not found" UIs; throw `error(404)` from `load` instead.
- **Routes**: kebab-case folders; `+page.svelte` (UI), `+page.server.ts` (load / actions), `+server.ts` (API).
- **Layout groups** `(guest)` and `(app)` control which shell a page gets. New authenticated pages go under `(app)/`.
- **Auth guard**: add protected path prefixes to `PROTECTED_PREFIXES` in `src/hooks.server.ts`.
- **Data loading**: see **API calls** below.
- **Forms**: `<form method="POST" use:enhance>` + `actions` in `+page.server.ts`. Return `fail()` for validation errors.
- **Styling**: Tailwind utility classes only; global CSS and design tokens live in `src/routes/layout.css` (`@theme`). No inline `style=` attributes and no custom CSS blocks for things Tailwind can do.
- **i18n (Paraglide JS, added via `sv add paraglide`)**: locales `en` (base) and `bn`. All user-visible text goes in `messages/en.json` + `messages/bn.json` (same keys, snake_case) and is used as `m.key()` from `#lib/paraglide/messages.js` — never hardcode copy in components. Strategy is **cookie** (`PARAGLIDE_LOCALE`), URLs are never locale-prefixed, so `PROTECTED_PREFIXES` in `hooks.server.ts` keeps matching real paths. Switch language with `setLocale()` from `#lib/paraglide/runtime.js` (writes the cookie, reloads). `src/lib/paraglide/` is generated and git-ignored. Fonts: Roboto + Noto Sans Bengali (both `@fontsource-variable/*`, imported in `layout.css`).
- **Dark mode (no package)**: class-based. Server reads the `theme` cookie in `hooks.server.ts` → `locals.theme` → `<html class="dark">` via `%theme%` in `app.html` (no flash on SSR). `ThemeToggle.svelte` flips the class and writes the cookie. Style with the semantic tokens (`bg-surface`, `text-heading`, `text-ink-*`, `bg-field`, `border-toggle-border`, `text-link`), which are redefined under `.dark` in `layout.css` — avoid hardcoded `bg-white` / `text-gray-*`. Use `dark:invert` for single-colour SVG icons, `dark:` variants only for one-offs.
- **Auth screens**: every auth page is `<AuthLayout>` + `<AuthHeader>` + form/`AuthSuccess`. Do not copy the split-screen markup into a page. Reuse `TextInput`/`PasswordInput`/`PrimaryButton`/`AuthLink`/`AuthMessage`; add a new shared component only when two screens need it. Password rules live only in `lib/utils/password.ts` (UI checklist and server action both import it). Icons that must follow text colour (dark mode, coloured buttons) use `<Icon src={…} class="text-…" />`, not `<img>`.
- **Design tokens** (`@theme` in `layout.css`): `brand-navy`, `brand-blue`, `brand-cyan`, `hero`, `field`, `field-border`, `ink-label`, `ink-muted`, `ink-faint`, `checkbox`, `toggle-border`, `toggle-text`; font `Roboto Variable` (`@fontsource-variable/roboto`). Use these classes (`text-brand-navy`, `bg-field`) instead of hex values. Add new tokens there, not as arbitrary values.
- **Figma → Svelte**: reproduce the design faithfully (hierarchy, spacing, typography, colours, radius, shadows, proportions); do not substitute your own UI. Prefer the Tailwind scale and tokens; use an arbitrary value (`w-[342px]`) only when the exact Figma value has no close scale match. Never leave `figma.com/api/mcp/asset` URLs in code — download assets into `src/lib/assets/` and import them. Build mobile/tablet layouts deliberately (stack, hide, reorder), not by shrinking desktop. Keep markup in reusable components under `lib/components/<Feature>/`.
- **Env (SvelteKit 3)**: declare every variable in `src/env.ts` with `defineEnvVars()`, then import it from `$app/env/public` (if `public: true`) or `$app/env/private` (server-only). The old `$env/*` modules no longer exist. Mirror new vars in `.env.example`.
- **Imports**: use the `#lib/...` alias, never relative `../../lib`. Always include the file extension for `.ts` files (`#lib/types/auth.ts`, `#lib/stores/auth.svelte.ts`) — `#lib` is a package.json `imports` map, so extensionless paths do not resolve.
- **Hook types** live in `@sveltejs/kit/hooks` (`import type { Handle } from '@sveltejs/kit/hooks'`), not `@sveltejs/kit`.
- Run `pnpm check` and `pnpm lint` before committing.

## Auth model

Backend: REST + JWT (access token 1 h, **refresh tokens rotate** — a used refresh token is revoked at once). The Postman collection is the source of truth for endpoints. Envelope: `{ success, message, data?, errors? }` (`422` = field errors, `400` = business error, `401` = auth).

- **Public pages need no token.** There are no `CMS_EMAIL` / `CMS_PASSWORD` style credentials and no service account — do not add them. Guest pages may only call open endpoints (`forgot-password`, `reset-password`).
- **Only authenticated users have tokens, and the browser never sees them.** `/login` (server action → `lib/server/auth.ts`) stores `access_token`, `refresh_token` (+ `auth_remember`) in **httpOnly** cookies. `hooks.server.ts` calls `GET /auth/me` on every page request → `locals.user`, refreshing tokens transparently. Never put tokens in `page.data`, a store or `localStorage`.
- `login`, `register`, `refresh`, `logout` handle tokens, so they are **server-only** and blocked on the proxy. Everything else goes through `fetchApi()`.
- Concurrent requests with an expired access cookie share one refresh (`refreshSession` in `lib/server/session.ts`); without that, rotation would sign the user out.
- Roles are `USER` | `ADMIN` (upper-case). The backend enforces authorization; the UI only hides what a role can't use.
- Forgot-password is anti-enumeration: the backend answers success for unknown emails, so the UI cannot show an "unrecognized email" state.

## API calls

**Standard** — the Svelte version of the Nuxt `$fetchCitizen` + `isLoading / data / error` + `loadData` pattern. Do not invent another one.

```ts
// 1. Endpoint function — lib/api/<resource>.ts, typed, unwraps `data`
export const adminApi = {
	async listUsers(params = {}, options: ApiOptions = {}) {
		const res = await fetchApi<Paginated<User>>('/admin/users', {
			...options,
			query: { page: params.page ?? 1 }
		});
		return res.data!;
	}
};

// 2. Client-side / interactive: useRequest gives isLoading + data + error + execute (≈ loadData)
const users = useRequest((page: number) => adminApi.listUsers({ page }));
$effect(() => {
	void users.execute(page);
});
// {#if users.isLoading} … {:else if users.error} {describeError(users.error)} … {:else} {users.data} {/if}

// 3. Server-side (load / actions): call the same function with SvelteKit's fetch
export const load = async ({ fetch }) => ({ users: await adminApi.listUsers({}, { fetch }) });
```

- `fetchApi(path, { fetch?, method?, body?, query? })` → `ApiEnvelope<T>`; throws `ApiError` (`status`, `message`, `errors`; `status 0` = network). It always calls **`/api/proxy/*`** (same origin), never the backend directly. On the server you MUST pass the event's `fetch`.
- `describeError(err)` → localized user message; `fieldError(err, 'email')` → one 422 field message.
- New endpoint = one function in `lib/api/<resource>.ts` (+ types in `lib/types/`). Never call the backend with raw `fetch` from components. Do not name anything `$fetch…` (Svelte reserves `$` prefixes).
- Only the proxy and `lib/server/*` talk to the backend (`API_BASE_URL` + `API_PREFIX`, server-only env). To change the backend host edit `.env` (`API_BASE_URL="http://192.168.1.56:3000"`) — nothing else.
- Endpoints outside the API prefix (e.g. `GET /health`) are not reachable through the proxy; call them from `lib/server/` if ever needed.

## Adding a new business module

1. Create the route: `src/routes/(app)/<module>/+page.svelte` (+ `+page.server.ts` for data/actions).
2. Put UI in `src/lib/components/<Module>/`.
3. Shared state (if any) in `src/lib/stores/<module>.svelte.ts`; types in `src/lib/types/<module>.ts`.
4. Add a nav item in `src/lib/components/Sidebar/Sidebar.svelte`.
5. If the route needs auth, make sure its prefix is in `PROTECTED_PREFIXES` (`src/hooks.server.ts`).
6. Document it in the **Business modules** section below.

## Business modules

<!-- Append one entry per module as the product grows. Keep it short: what it is, routes, key files, API endpoints. -->

| Module         | Routes                                                                            | Key files                                                                                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth           | `/login`, `POST /api/auth/logout`                                                 | `hooks.server.ts`, `(guest)/login/+page.svelte`, `(guest)/login/+page.server.ts`, `Auth/LoginForm.svelte`, `Auth/LoginHero.svelte`, `stores/auth.ts` | Figma sign-in design (node 13:430 of file `t4QRADxe5Vttler3iPeYO4`). Real backend: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, refresh rotation. "Remember me" = 7-day cookie, otherwise session cookie. Language (en/bn, Paraglide) and dark-mode toggles work; `/forgot-password` route not built yet                                                                                     |
| Dashboard      | `/dashboard`                                                                      | `(app)/dashboard/+page.svelte`, `Users/UsersTable.svelte`, `api/admin.ts`                                                                            | Placeholder stats + admin-only paginated users table (`GET /admin/users`) on `useRequest` — the reference implementation of the API standard                                                                                                                                                                                                                                                             |
| Password reset | `/forgot-password`, `/check-email`, `/create-password`, `/password-reset-success` | `Auth/AuthLayout`, `Auth/PasswordInput`, `Auth/PasswordRequirements`, `utils/password.ts`, `api/auth.ts`                                             | Figma nodes 13:518, 13:584, 13:653, 13:712, 13:793, 13:877. Real backend: `POST /auth/forgot-password`, `POST /auth/reset-password` (token from the emailed link `…/create-password?token=…`; invalid/expired → back to `/forgot-password`). No auth header: guests have no token. Figma node 13:1769 ("Forgot Password", black frame with only a title) was an empty placeholder and is not implemented |
