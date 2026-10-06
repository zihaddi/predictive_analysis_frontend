# Predictive Analysis — Development Guide

> SvelteKit 3.0 · Svelte 5.57 (runes) · TypeScript · Tailwind CSS 4 · Vite 8 · pnpm

This is the long-form guide to the codebase. It is written for a developer who knows Nuxt 3 / Vue 3
(the `heyhomex_frontend` project) and is learning SvelteKit + Svelte 5 on this project.
Every file in `src/` is reproduced and annotated, every Svelte/SvelteKit concept the project uses
(or will use soon) has its own section, and the end has recipes, gotchas and a glossary.

All API names below were checked against the versions installed in `node_modules`
(`@sveltejs/kit@3.0.0`, `svelte@5.57.1`). SvelteKit 3 renamed or removed several Kit 2 APIs, so
prefer this guide and the official docs over older blog posts / StackOverflow answers.

- Svelte docs: https://svelte.dev/docs/svelte
- SvelteKit docs: https://svelte.dev/docs/kit
- Interactive tutorial (highly recommended, ~3 h): https://svelte.dev/tutorial

---

## Table of contents

**Part A — This project**

1. [Reading order](#1-reading-order)
2. [Big picture: SSR, hydration, request lifecycle](#2-big-picture-ssr-hydration-request-lifecycle)
3. [Folder structure](#3-folder-structure)
4. [Auth model](#4-auth-model)
5. [Nuxt → SvelteKit cheat sheet](#5-nuxt--sveltekit-cheat-sheet)
6. [Config files](#6-config-files)
7. [`src/` top-level files (annotated)](#7-src-top-level-files-annotated)
8. [`src/lib/` (annotated)](#8-srclib-annotated)
9. [`src/routes/` (annotated)](#9-srcroutes-annotated)
10. [Walkthroughs](#10-walkthroughs)

**Part B — Svelte 5**

11. [Component anatomy](#11-component-anatomy)
12. [`$state`](#12-state)
13. [`$derived`](#13-derived)
14. [`$effect`](#14-effect)
15. [`$props` and `$bindable`](#15-props-and-bindable)
16. [Snippets and `{@render}`](#16-snippets-and-render)
17. [Template syntax](#17-template-syntax)
18. [Events](#18-events)
19. [Bindings](#19-bindings)
20. [Classes and styles](#20-classes-and-styles)
21. [Special elements](#21-special-elements)
22. [Lifecycle, `tick`, context](#22-lifecycle-tick-context)
23. [Shared reactive state in `.svelte.ts` files](#23-shared-reactive-state-in-sveltets-files)
24. [Legacy stores and `svelte/reactivity`](#24-legacy-stores-and-sveltereactivity)
25. [Transitions and animations](#25-transitions-and-animations)
26. [TypeScript in components](#26-typescript-in-components)
27. [Styling: scoped CSS and Tailwind 4](#27-styling-scoped-css-and-tailwind-4)

**Part C — SvelteKit 3**

28. [Routing](#28-routing)
29. [Layouts](#29-layouts)
30. [Loading data](#30-loading-data)
31. [Invalidation: when `load` reruns](#31-invalidation-when-load-reruns)
32. [Form actions](#32-form-actions)
33. [API routes (`+server.ts`)](#33-api-routes-serverts)
34. [Hooks](#34-hooks)
35. [Errors](#35-errors)
36. [Cookies, sessions, CSRF](#36-cookies-sessions-csrf)
37. [Page options](#37-page-options)
38. [`$app/*` module reference](#38-app-module-reference)
39. [Environment variables](#39-environment-variables)
40. [Server-only modules](#40-server-only-modules)
41. [Links, preloading, scroll](#41-links-preloading-scroll)
42. [Remote functions (experimental)](#42-remote-functions-experimental)
43. [Adapters and deployment](#43-adapters-and-deployment)

**Part D — Working on this project**

44. [Connecting the real backend](#44-connecting-the-real-backend)
45. [Recipes](#45-recipes)
46. [Testing](#46-testing)
47. [Tooling and debugging](#47-tooling-and-debugging)
48. [Gotchas](#48-gotchas)
49. [Glossary](#49-glossary)
50. [i18n and dark mode](#50-i18n-and-dark-mode)

---

# Part A — This project

## 1. Reading order

If you have 30 minutes: §2 → §3 → §4 → §10 (login walkthrough) → §48 (gotchas).

If you have an afternoon: Part A fully, then §12–§16 (the runes you will touch every day), then
§28–§32 (routing, layouts, load, actions). Skim the rest and come back when you need it.

Before you add a feature: §45 (recipes) and the **Business modules** table in `CLAUDE.md`.

## 2. Big picture: SSR, hydration, request lifecycle

SvelteKit is a full-stack framework like Nuxt: it renders pages on the server for the first request
(SSR), ships JavaScript to the browser, "hydrates" the HTML so Svelte takes over, and then handles
further navigation client-side (SPA-style) by fetching only data, not HTML.

### What happens on `GET /dashboard`

```
Browser                SvelteKit server
  │  GET /dashboard         │
  │────────────────────────▶│
  │                         │ 1. src/hooks.server.ts  handle()
  │                         │    - reads "token" cookie
  │                         │    - sets event.locals.user
  │                         │    - route is protected and no user? → redirect(303,'/login')
  │                         │    - resolve(event) → continue
  │                         │ 2. src/routes/+layout.server.ts  load()
  │                         │    - returns { user: locals.user }         → page.data.user
  │                         │ 3. (no +page.server.ts for /dashboard yet)
  │                         │ 4. Render on the server:
  │                         │      +layout.svelte (root)
  │                         │        └ (app)/+layout.svelte  (Sidebar + header)
  │                         │            └ (app)/dashboard/+page.svelte
  │   HTML + serialized data│
  │◀────────────────────────│
  │ 5. Browser shows HTML immediately (no JS needed yet)
  │ 6. JS loads → hydrate → Svelte attaches event handlers, state becomes live
  │
  │  click <a href="/login"> (client-side navigation)
  │────────────────────────▶│ 7. Only the load() functions that need to rerun are called
  │   JSON (page data)      │    (as a "__data.json" request) — no HTML round trip
  │◀────────────────────────│
  │ 8. Svelte swaps the page component in place; layouts stay mounted
```

### Server vs. client — decided by file name

| File                                            | Runs on                      | Purpose                                          |
| ----------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `+page.svelte`, `+layout.svelte`, any `.svelte` | server (SSR) **and** browser | UI                                               |
| `+page.ts`, `+layout.ts`                        | server **and** browser       | "universal" `load` (public data)                 |
| `+page.server.ts`, `+layout.server.ts`          | server only                  | `load` with cookies/secrets, form `actions`      |
| `+server.ts`                                    | server only                  | API endpoint (`GET`, `POST`, …)                  |
| `hooks.server.ts`                               | server only                  | runs before every request                        |
| `hooks.client.ts`                               | browser only                 | client error handling / init                     |
| `src/lib/server/**`, `*.server.ts`              | server only                  | SvelteKit refuses to bundle them for the browser |
| `src/env.ts`                                    | build/startup                | env var declarations                             |

A component can therefore run in two places. Anything that needs `window`, `document`,
`localStorage` must go into `$effect` / `onMount` (browser-only) or be guarded with
`browser` from `$app/env`.

## 3. Folder structure

```
Predictive analysis/
├── .env                        local secrets/config (git-ignored) — copy from .env.example
├── .env.example                template; every var must also be declared in src/env.ts
├── .gitignore
├── .npmrc                      pnpm settings
├── .prettierignore
├── .vscode/                    recommended extensions (Svelte for VS Code)
├── CLAUDE.md                   project rules + Business modules table (keep it updated)
├── DEVELOPMENT_GUIDE.md        ← this file
├── README.md                   default sv-create readme
├── eslint.config.js            ESLint flat config (js + typescript-eslint + eslint-plugin-svelte + prettier)
├── prettier.config.js          Prettier (+ svelte, + tailwind class sorting), tabs, single quotes
├── package.json                scripts, devDependencies, "#lib" import alias
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json               extends "$app/tsconfig" (generated by svelte-kit sync)
├── vite.config.ts              Vite + Tailwind + SvelteKit plugin (Kit config lives here, no svelte.config.js)
├── static/                     copied verbatim to the site root
│   └── robots.txt              → /robots.txt
└── src/
    ├── app.html                HTML shell with %sveltekit.head% / %sveltekit.body%
    ├── app.d.ts                global `App.*` type augmentations (App.Locals.user)
    ├── env.ts                  defineEnvVars({ API_BASE_URL })
    ├── hooks.server.ts         auth guard — runs on every request (≈ Nuxt middleware)
    ├── lib/                    everything importable as "#lib/..."
    │   ├── index.ts            empty barrel ("#lib" alone resolves here)
    │   ├── assets/favicon.svg
    │   ├── components/         UI components; folder = feature namespace (like app/components/<Feature>)
    │   │   ├── Auth/LoginForm.svelte
    │   │   ├── Button/PrimaryButton.svelte
    │   │   ├── Input/TextInput.svelte
    │   │   ├── Sidebar/Sidebar.svelte
    │   │   └── Common/         (empty) components shared by several features
    │   ├── server/             (empty) server-only helpers: DB clients, secret-using code
    │   ├── stores/auth.ts      auth.user / auth.isLoggedIn for components
    │   ├── types/auth.ts       User, UserRole
    │   └── utils/fetchApi.ts   fetch wrapper for the backend API
    └── routes/                 file-based router; folder path = URL path
        ├── layout.css          Tailwind entry: @import 'tailwindcss'; @plugin '@tailwindcss/forms'
        ├── +layout.svelte      root layout: imports CSS, favicon, <title>
        ├── +layout.server.ts   provides page.data.user to every page
        ├── +page.server.ts     "/" → redirect to /dashboard or /login
        ├── +page.svelte        (empty; "/" never renders)
        ├── (guest)/            route GROUP — parentheses = not part of the URL
        │   ├── +layout.svelte  centered card for public pages
        │   └── login/
        │       ├── +page.svelte        /login UI
        │       └── +page.server.ts     form action: validate → set cookie → redirect
        ├── (app)/              route GROUP for authenticated pages
        │   ├── +layout.svelte  sidebar + header + <main>
        │   └── dashboard/
        │       └── +page.svelte        /dashboard
        └── api/
            └── auth/logout/
                └── +server.ts          POST /api/auth/logout → delete cookie → redirect
```

Generated — never edit, git-ignored:

| Path                                 | What                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `.svelte-kit/`                       | route manifest, generated `./$types`, dev/build output                                |
| `node_modules/$app/tsconfig.json`    | the tsconfig our `tsconfig.json` extends                                              |
| `node_modules/$app/types/index.d.ts` | typed `RouteId`, `Path`, layout params for `$app/types`                               |
| `node_modules/$app/types/env.d.ts`   | declarations for `$app/env/public` and `$app/env/private` generated from `src/env.ts` |

`pnpm exec svelte-kit sync` regenerates all of them (it runs automatically on `pnpm dev`, `pnpm check`, `pnpm build`, and on install via the `prepare` script).

## 4. Auth model

This is a deliberate difference from `heyhomex_frontend`, so it gets its own section.

|                         | heyhomex_frontend (Nuxt)                                                                                                  | **this project**                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Public pages            | Every public page fetched a **CMS token** first (`CMS_EMAIL` / `CMS_PASSWORD`, `$fetchCMS`) and sent it with each request | **No token at all.** Public pages call open backend endpoints, or no backend at all |
| Logged-in users         | Firebase + backend token in a cookie, several `$fetch*` wrappers per role                                                 | One httpOnly `token` cookie, one `fetchApi()`                                       |
| Where the token is used | Client and server                                                                                                         | **Server only** (`load`, `actions`, `+server.ts`)                                   |

Rules:

1. **Only authenticated users have a token.** It is issued by the `/login` action and stored in
   the `token` cookie with `httpOnly: true`. The browser's JavaScript can never read it.
2. **`hooks.server.ts` turns the cookie into `event.locals.user`** on every request. Components
   read the user via `page.data.user` (wrapped as `auth.user`); server code reads `locals.user`.
3. **Guests make no authenticated calls.** If a public page needs data, the backend endpoint must be
   open and you call `fetchApi('/path', { fetch })` without `token`. Do **not** introduce a service
   account / CMS credential to call the API on behalf of anonymous visitors.
4. **The raw token never leaves the server.** Never return it from `load`, never put it in a store,
   `localStorage` or a `data-*` attribute. If a component needs backend data, add a `load` (or a
   `+server.ts` endpoint) and let the server attach the `Authorization` header.
5. New authenticated routes go under `src/routes/(app)/` **and** their prefix goes into
   `PROTECTED_PREFIXES` in `hooks.server.ts`. The layout group only picks the UI shell; the
   hook enforces access.

## 5. Nuxt → SvelteKit cheat sheet

### Project / routing

| Nuxt                                                            | SvelteKit                                               | Notes                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `app/pages/foo/index.vue`                                       | `src/routes/foo/+page.svelte`                           | every page is literally `+page.svelte`, the folder is the URL   |
| `app/pages/foo/[id].vue`                                        | `src/routes/foo/[id]/+page.svelte`                      | `params.id` in `load`                                           |
| `app/pages/[...slug].vue`                                       | `src/routes/[...slug]/+page.svelte`                     | rest param                                                      |
| `app/layouts/admin.vue` + `definePageMeta({ layout: 'admin' })` | `src/routes/(app)/+layout.svelte`                       | layout chosen by **folder**, groups `(name)` keep the URL clean |
| `app/middleware/auth.ts` + `definePageMeta({ middleware })`     | `src/hooks.server.ts` `handle`                          | one place, every request, server-side                           |
| `app/error.vue`                                                 | `src/routes/+error.svelte`                              | can exist per folder                                            |
| `server/api/foo.get.ts`                                         | `src/routes/api/foo/+server.ts` with `export const GET` | one file, many methods                                          |
| `server/middleware/*`                                           | `hooks.server.ts`                                       |                                                                 |
| `nuxt.config.ts`                                                | `vite.config.ts` → `sveltekit({ ... })`                 | Kit 3 has no `svelte.config.js` by default                      |
| `public/`                                                       | `static/`                                               |                                                                 |
| `app/assets/`                                                   | `src/lib/assets/`                                       | import them, Vite hashes them                                   |
| auto-imported components/composables                            | **explicit imports**                                    | nothing is auto-imported                                        |
| `~/` or `@/` alias                                              | `#lib/`                                                 | package.json `imports` map; `.ts` needs extension               |
| `useRuntimeConfig().public.X`                                   | `import { X } from '$app/env/public'`                   | declared in `src/env.ts`                                        |
| `process.server` / `process.client`                             | `browser`, `building`, `dev` from `$app/env`            |                                                                 |

### Data & forms

| Nuxt                                             | SvelteKit                                                      | Notes                                                       |
| ------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| `useFetch` / `useAsyncData` inside the component | `load()` in `+page.server.ts` / `+page.ts`                     | data arrives as the `data` prop                             |
| `$fetch`                                         | `fetch` (passed into `load`) + `fetchApi()`                    | Kit's `fetch` forwards cookies and dedupes during hydration |
| `refresh()` from `useAsyncData`                  | `invalidate(...)`, `invalidateAll()`                           | §31                                                         |
| `useState('key')`                                | `page.data` (server-provided) or a `.svelte.ts` store (client) | §23                                                         |
| `<form @submit.prevent="save">` + `$fetch` POST  | `<form method="POST" use:enhance>` + `actions`                 | works without JS too                                        |
| `createError({ statusCode: 404 })`               | `error(404, 'Not found')`                                      | throws                                                      |
| `navigateTo('/x')`                               | server: `redirect(303, '/x')`; client: `goto('/x')`            |                                                             |
| `useRoute()`                                     | `page` from `$app/state`                                       | `page.url`, `page.params`, `page.route.id`                  |
| `useRouter().push`                               | `goto`                                                         |                                                             |
| `useCookie('token')`                             | `cookies.get/set/delete` in server code                        | no client cookie helper (httpOnly by design)                |
| `useHead({ title })`                             | `<svelte:head><title>…</title></svelte:head>`                  |                                                             |
| `<NuxtLink to="/x">`                             | `<a href="/x">`                                                | Kit intercepts normal links                                 |
| `<NuxtPage />` / `<slot />`                      | `{@render children()}`                                         |                                                             |
| `<ClientOnly>`                                   | `{#if browser}` or render inside `$effect`/`onMount`           |                                                             |

### Component syntax (Vue 3 → Svelte 5)

| Vue                                         | Svelte 5                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `defineProps<{ x: string }>()`              | `let { x }: { x: string } = $props();`                                                |
| `withDefaults(defineProps…)`                | `let { x = 'default' } = $props();`                                                   |
| `defineModel()`                             | `let { value = $bindable() } = $props();`                                             |
| `defineEmits(['save'])` + `emit('save', v)` | callback prop: `let { onsave } = $props(); onsave(v)`                                 |
| `ref(0)` / `reactive({})`                   | `let n = $state(0)` / `let o = $state({})`                                            |
| `computed(() => a + b)`                     | `let sum = $derived(a + b)`                                                           |
| `watch(x, fn)` / `watchEffect(fn)`          | `$effect(() => { fn(x) })`                                                            |
| `onMounted(fn)`                             | `onMount(fn)` or `$effect(fn)`                                                        |
| `onUnmounted(fn)`                           | return a cleanup from `$effect` / `onMount`                                           |
| `nextTick()`                                | `await tick()`                                                                        |
| `provide/inject`                            | `setContext/getContext`                                                               |
| `v-if / v-else-if / v-else`                 | `{#if} {:else if} {:else} {/if}`                                                      |
| `v-for="x in xs" :key="x.id"`               | `{#each xs as x (x.id)}`                                                              |
| `v-model="x"`                               | `bind:value={x}`                                                                      |
| `@click="fn"`                               | `onclick={fn}`                                                                        |
| `@click.prevent`                            | `onclick={(e) => { e.preventDefault(); fn() }}`                                       |
| `:class="{ a: c }"`                         | `class={{ a: c }}` or `class:a={c}`                                                   |
| `:style="{ color }"`                        | `style:color`                                                                         |
| `<slot />` / `<slot name="x" />`            | `{@render children()}` / `{@render x()}`                                              |
| `<template #x>`                             | `{#snippet x()} … {/snippet}`                                                         |
| `<Teleport>`                                | no built-in; use a portal action/attachment or `<svelte:body>`                        |
| `<Transition>`                              | `transition:fade`, `in:fly`, `out:slide`                                              |
| `<component :is>`                           | `<Component />` where `Component` is a variable (Svelte 5 components are just values) |

## 6. Config files

### `package.json`

```jsonc
{
	"name": "predictive-analysis",
	"type": "module", // ESM project
	"scripts": {
		"dev": "vite dev", // dev server + HMR on :5173
		"build": "vite build", // production build → .svelte-kit/output, then adapter
		"preview": "vite preview", // serve the production build locally
		"prepare": "svelte-kit sync || echo ''", // runs after install: generates types
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "...",
		"lint": "prettier --check . && eslint .",
		"format": "prettier --write ."
	},
	"devDependencies": {
		"@sveltejs/kit": "^3.0.0",
		"@sveltejs/adapter-auto": "^8.0.0", // picks Vercel/Netlify/Cloudflare at build; see §43
		"@sveltejs/vite-plugin-svelte": "^7.2.0",
		"svelte": "^5.57.1",
		"svelte-check": "^4.6.0",
		"tailwindcss": "^4.3.0",
		"@tailwindcss/vite": "^4.3.0",
		"@tailwindcss/forms": "^0.5.11",
		"typescript": "^6.0.3",
		"vite": "^8.3.0",
		"eslint": "...",
		"typescript-eslint": "...",
		"eslint-plugin-svelte": "...",
		"prettier": "...",
		"prettier-plugin-svelte": "...",
		"prettier-plugin-tailwindcss": "..."
	},
	"imports": {
		"#lib": "./src/lib/index.js", // import '#lib'            → src/lib/index.ts
		"#lib/*": "./src/lib/*" // import '#lib/x/y.ts'    → src/lib/x/y.ts
	}
}
```

Everything is a devDependency because SvelteKit bundles the app; nothing is required at runtime
except what the adapter outputs.

**`imports` is a Node.js "subpath imports" map**, not a bundler alias. Node resolves the target
literally, so `#lib/types/auth` does **not** become `auth.ts` — you must write
`#lib/types/auth.ts`. `.svelte` and `.svg` files already carry their extension, so only `.ts`
imports feel different. (TypeScript allows the `.ts` extension because the generated tsconfig sets
`allowImportingTsExtensions`.)

### `vite.config.ts`

```ts
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(), // Tailwind 4 runs as a Vite plugin (no postcss config)
		sveltekit({
			compilerOptions: {
				// every project file is compiled in runes mode; node_modules keep their own mode
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
```

In SvelteKit 3 the Kit configuration is passed to the `sveltekit()` plugin (Kit 2 used a separate
`svelte.config.js`). Options you are likely to touch, all inside `sveltekit({ ... })`:

| Option                                  | Purpose                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| `adapter`                               | deployment target (§43)                                      |
| `alias`                                 | extra import aliases (we use package.json `imports` instead) |
| `csrf.trustedOrigins`                   | extra origins allowed to POST forms (§36)                    |
| `csp`                                   | Content-Security-Policy generation                           |
| `env.dir`                               | where `.env` files live                                      |
| `experimental.remoteFunctions`          | enable remote functions (§42)                                |
| `files`                                 | rename `src/routes`, `src/lib`, `static`, …                  |
| `paths.base`                            | deploy under a sub-path                                      |
| `prerender`                             | crawl settings, `handleHttpError`                            |
| `router.type`                           | `'pathname'` (default) or `'hash'`                           |
| `version.name` / `version.pollInterval` | detect new deployments (`updated` in `$app/state`)           |
| `compilerOptions`, `preprocess`         | passed to the Svelte compiler                                |

### `tsconfig.json`

```json
{
	"extends": "$app/tsconfig",
	"compilerOptions": { "strict": true, "types": ["$app/types", "node"] },
	"include": ["src", "vite.config.ts"]
}
```

`$app/tsconfig` resolves to `node_modules/$app/tsconfig.json`, which Kit regenerates. It sets
`moduleResolution: bundler`, `verbatimModuleSyntax`, `allowImportingTsExtensions`,
`rootDirs: ['..', '../.svelte-kit/types']` (so `./$types` resolves next to each route file) and
`lib: ESNext, DOM`. Add your own options in the project file; never edit the generated one.

### `eslint.config.js`

Flat config: `js.configs.recommended` → `ts.configs.recommended` → `svelte.configs.recommended`
→ `prettier` (disables formatting rules) → `svelte.configs.prettier`. `.svelte`, `.svelte.ts` and
`.svelte.js` files are parsed with the TypeScript parser and `projectService: true` (type-aware
linting). `no-undef` is off because TypeScript already does that. Add project rules in the last
object (`rules: {}`), e.g. `'svelte/button-has-type': 'error'`.

### `prettier.config.js`

Tabs, single quotes, no trailing commas, 100 columns, `prettier-plugin-svelte` (formats `.svelte`),
`prettier-plugin-tailwindcss` (sorts class names in the canonical Tailwind order — so do not
hand-order classes, run `pnpm format`).

### `.env.example`

```
# Every variable must also be declared in src/env.ts (defineEnvVars).
API_BASE_URL=""
```

Copy to `.env`. Vite loads `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`. Kit 3 ignores
any variable that is not declared in `src/env.ts` (§39).

### `.gitignore`

Ignores `node_modules`, `.svelte-kit`, `build`, `.output`, `.env*` (but keeps `.env.example` and
`.env.test`), Vite temp files.

## 7. `src/` top-level files (annotated)

### `src/app.html`

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="text-scale" content="scale" />
		%sveltekit.head%
		<!-- <svelte:head> content, CSS, modulepreload links -->
	</head>
	<body data-sveltekit-preload-data="hover">
		<!-- prefetch page data when a link is hovered (§41) -->
		<div style="display: contents">%sveltekit.body%</div>
		<!-- the rendered app -->
	</body>
</html>
```

Other placeholders you can use: `%sveltekit.assets%` (asset base path), `%sveltekit.nonce%` (CSP),
`%sveltekit.env.X%` (public env var, e.g. for a theme class on `<html>`).

### `src/app.d.ts`

```ts
import type { User } from '#lib/types/auth.ts';

declare global {
	namespace App {
		interface Locals {
			// event.locals — per-request bag filled by hooks.server.ts
			user: User | null;
		}
		// interface Error {}         // shape of errors shown by +error.svelte (§35)
		// interface PageData {}      // fields that EVERY page.data has
		// interface PageState {}     // shape of pushState()/replaceState() state (shallow routing)
		// interface Platform {}      // adapter-specific platform object (e.g. Cloudflare env)
	}
}
export {}; // makes this a module so `declare global` works
```

Because `Locals.user` is declared, `event.locals.user` is typed in hooks, `load` and `actions`,
and `locals.user` in `+layout.server.ts` flows into `page.data.user` typing for layouts/pages.

### `src/env.ts`

```ts
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	API_BASE_URL: {
		public: true, // importable from $app/env/public (sent to the browser)
		description: 'Base URL of the backend API, without trailing slash.',
		schema: (value) => value ?? '' // validate/transform at startup; default to ''
	}
});
```

- Omit `public` (or `public: false`) → only importable from `$app/env/private`, and the build fails
  if client code imports it. Use this for backend secrets later.
- `static: true` → value inlined at build time (enables dead-code elimination, e.g. feature flags).
- `schema` can also be a Standard Schema validator (Valibot/Zod). Without a schema the variable
  must be present (empty string allowed).
- After editing this file, `svelte-kit sync` regenerates `node_modules/$app/types/env.d.ts`, so the
  import is typed — `API_BASE_URL` is a `string` here because of the schema's return type.

### `src/hooks.server.ts`

```ts
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks'; // Kit 3: hook types live in /hooks

// Any path starting with one of these requires a logged-in user.
const PROTECTED_PREFIXES = ['/dashboard'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('token'); // httpOnly cookie set by the login action

	// TODO: verify the token against the backend and load the real user (§44).
	event.locals.user = token
		? { id: '1', name: 'Demo User', email: 'demo@example.com', role: 'admin' }
		: null;

	const { pathname } = event.url;
	const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

	if (isProtected && !event.locals.user) redirect(303, '/login'); // redirect() THROWS
	if (pathname === '/login' && event.locals.user) redirect(303, '/dashboard');

	return resolve(event); // render the route (load + components)
};
```

Why this is the right place for the guard:

- It runs for **every** request — pages, `__data.json` requests from client-side navigation, form
  actions and `+server.ts` endpoints. A guard in a layout `load` would **not** cover API routes.
- It runs before any `load`, so protected `load` functions can assume `locals.user` exists.
- There is exactly one list to maintain (`PROTECTED_PREFIXES`).

`resolve(event, options)` accepts `transformPageChunk` (edit the HTML, e.g. inject a theme class),
`filterSerializedResponseHeaders` and `preload` (control which assets get preload links). More hooks in §34.

## 8. `src/lib/` (annotated)

### `lib/index.ts`

Empty barrel; `import x from '#lib'` resolves here. Keep it empty or export only truly global
things — barrels that re-export everything hurt tree-shaking and HMR.

### `lib/types/auth.ts`

```ts
export type UserRole = 'admin' | 'user';

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}
```

Plain types, shared by server and client code. One file per domain as the app grows
(`types/report.ts`, `types/api.ts`, …). Types only — no runtime code — so importing them from a
`.svelte` file never pulls server code into the browser.

### `lib/utils/fetchApi.ts`

```ts
import { API_BASE_URL } from '$app/env/public';

type FetchApiOptions = RequestInit & {
	token?: string; // Bearer token for authenticated calls (server code only, §4)
	fetch?: typeof fetch; // pass SvelteKit's fetch from load/actions
};

export async function fetchApi<T>(path: string, options: FetchApiOptions = {}): Promise<T> {
	const { token, fetch: f = fetch, headers, ...rest } = options;

	const res = await f(`${API_BASE_URL}${path}`, {
		...rest,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers
		}
	});

	if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
	return res.json() as Promise<T>;
}
```

Usage from a server `load`:

```ts
export const load: PageServerLoad = async ({ fetch, locals }) => {
	const reports = await fetchApi<Report[]>('/reports', { fetch, token: locals.token });
	return { reports };
};
```

Why pass Kit's `fetch`?

- During SSR it can call **relative** URLs and your own `+server.ts` routes directly without a
  network hop.
- It forwards `cookie` and `authorization` headers to same-origin requests.
- Responses made during SSR are **inlined into the HTML** so the browser does not refetch during hydration.
- `handleFetch` (§34) can rewrite these requests (e.g. point `https://api.example.com` to an internal address).

### `lib/stores/auth.ts`

```ts
import { page } from '$app/state';
import type { User } from '#lib/types/auth.ts';

export const auth = {
	get user(): User | null {
		return (page.data.user as User | null) ?? null;
	},
	get isLoggedIn(): boolean {
		return this.user !== null;
	}
};
```

This _looks_ like a store but is a pair of getters over `page.data.user`, which the root
`+layout.server.ts` provides on every request. Reasons it is **not** a `$state` singleton:

1. On the server, modules are instantiated once and shared by all requests. A module-level
   `let user = $state(null)` would let request A's user leak into request B's HTML.
2. `$effect` never runs during SSR, so "hydrate the store in an effect" produces empty SSR HTML
   and a flash of wrong content.
3. `page.data` is request-scoped on the server (backed by Svelte context) and a reactive
   `$state` in the browser, so reads are correct in both places and update on navigation.

Use `auth.user` **only inside components** (render time). In `hooks.server.ts`, `load` and
`actions` use `event.locals.user` — `page` is not available there and would throw.

For client-only UI state, see §23.

### `lib/components/Button/PrimaryButton.svelte`

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		// accept every native <button> attribute
		loading?: boolean;
		children: Snippet; // required slot content
	}

	let { loading = false, children, disabled, ...rest }: Props = $props();
</script>

<button
	class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
	disabled={loading || disabled}
	{...rest}
>
	{@render children()}
</button>
```

- `$props()` is destructured once; `loading = false` is a default; `...rest` collects everything
  else (`type`, `onclick`, `aria-*`, `form`, …) and `{...rest}` spreads it on the element.
- `disabled` is pulled out so we can combine it with `loading` instead of letting `rest` override it.
- `children` is the implicit snippet for content placed between `<PrimaryButton>…</PrimaryButton>`.

### `lib/components/Input/TextInput.svelte`

```svelte
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label: string;
		name: string;
		error?: string;
		value?: string;
	}

	let { label, name, error, value = $bindable(''), ...rest }: Props = $props();
</script>

<div class="space-y-1">
	<label for={name} class="block text-sm font-medium text-gray-700">{label}</label>
	<input
		id={name}
		{name}
		bind:value
		class="block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
		{...rest}
	/>
	{#if error}
		<p class="text-xs text-red-600">{error}</p>
	{/if}
</div>
```

- `value = $bindable('')` — parents may write `<TextInput bind:value={email} />` for two-way
  binding, or pass nothing and let the input manage itself (the login form does the latter and
  relies on the native form POST).
- `{name}` is shorthand for `name={name}`. `id={name}` + `<label for={name}>` gives accessible labels.
- `@tailwindcss/forms` (loaded in `layout.css`) resets native input styles so the Tailwind classes apply cleanly.

### `lib/components/Auth/LoginForm.svelte`

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import PrimaryButton from '#lib/components/Button/PrimaryButton.svelte';
	import TextInput from '#lib/components/Input/TextInput.svelte';

	let { error }: { error?: string } = $props();
	let loading = $state(false);
</script>

<form
	method="POST"
	class="space-y-5"
	use:enhance={() => {
		// runs when the form is submitted (JS available)
		loading = true;
		return async ({ update }) => {
			// runs when the server responds
			await update(); // apply the ActionResult: set `form`, follow redirects, etc.
			loading = false;
		};
	}}
>
	<TextInput label="Email" name="email" type="email" placeholder="you@example.com" required />
	<TextInput label="Password" name="password" type="password" placeholder="••••••••" required />

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	<PrimaryButton type="submit" {loading}>
		{loading ? 'Signing in…' : 'Sign in'}
	</PrimaryButton>
</form>
```

- No `action` attribute → posts to the **current page's `default` action** (`login/+page.server.ts`).
- Without JavaScript this is a normal HTML form and still works (full-page POST → 303 → `/dashboard`).
- `use:enhance` is progressive enhancement: with JS it submits with `fetch`, keeps focus/scroll and
  applies the result without reloading. §32 explains the callback in detail.
- `error` comes from the page (`form?.error`) — the component is dumb on purpose.

### `lib/components/Sidebar/Sidebar.svelte`

```svelte
<script lang="ts">
	import { page } from '$app/state';

	// Register new business modules here (and document them in CLAUDE.md).
	const items = [{ href: '/dashboard', label: 'Dashboard' }];
</script>

<aside class="hidden w-60 shrink-0 border-r border-gray-200 bg-white p-4 md:block">
	<div class="mb-6 px-2 text-lg font-bold text-indigo-600">Predictive Analysis</div>
	<nav class="space-y-1">
		{#each items as item (item.href)}
			<a
				href={item.href}
				class="block rounded-lg px-3 py-2 text-sm font-medium {page.url.pathname === item.href
					? 'bg-indigo-50 text-indigo-700'
					: 'text-gray-600 hover:bg-gray-50'}"
			>
				{item.label}
			</a>
		{/each}
	</nav>
</aside>
```

- `page.url.pathname` is reactive — the active class updates on client-side navigation without
  any extra code.
- `(item.href)` is the **key** of the `{#each}` block — always key lists of objects.
- `hidden md:block` hides the sidebar below the `md` breakpoint; a mobile drawer is a natural
  first use of a client-side `.svelte.ts` store (§23, §45).

## 9. `src/routes/` (annotated)

### `routes/layout.css`

```css
@import 'tailwindcss';
@plugin '@tailwindcss/forms';
```

Tailwind 4 has no `tailwind.config.js`; configuration is CSS (`@theme`, `@plugin`, `@source`). §27.

### `routes/+layout.svelte` (root)

```svelte
<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg'; // Vite returns the hashed URL
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Predictive Analysis</title>
	<!-- pages override with their own <title> -->
</svelte:head>

{@render children()}
<!-- child layout or page goes here -->
```

### `routes/+layout.server.ts` (root)

```ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return { user: locals.user };
};
```

Whatever a layout `load` returns is merged into `page.data` (and the `data` prop) for the layout
and **every page beneath it**. This is the single source of truth for "who is logged in" on the
client. Because this is the root layout, it runs for every page, including guest pages (where
`user` is `null`).

### `routes/+page.server.ts` and `routes/+page.svelte` (the `/` route)

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	redirect(303, locals.user ? '/dashboard' : '/login');
};
```

`+page.svelte` is a one-line comment: a route only exists if it has a page component, but this one
never renders because `load` always redirects.

### `routes/(guest)/+layout.svelte`

```svelte
<script lang="ts">
	import type { LayoutProps } from './$types';
	let { children }: LayoutProps = $props();
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	{@render children()}
</main>
```

The `(guest)` folder is a **route group**: it adds a layout without adding a URL segment, so the
login page is `/login`, not `/guest/login`.

### `routes/(guest)/login/+page.server.ts`

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.' }); // → page gets `form.error`
		}

		// TODO: replace with the real backend call (§44).
		cookies.set('token', 'demo-token', {
			path: '/', // REQUIRED, otherwise the cookie is scoped to /login
			httpOnly: true, // JS cannot read it
			sameSite: 'lax', // sent on top-level navigations, not on cross-site POSTs
			maxAge: 60 * 60 * 24 * 7
			// secure defaults to true except on localhost
		});

		redirect(303, '/dashboard');
	}
};
```

- `actions.default` handles `<form method="POST">` with no `action` attribute. Named actions
  (`actions.login`, `actions.register`) are targeted with `action="?/login"`.
- `fail(status, data)` returns `data` to the page as the `form` prop **without redirecting**, so the
  page re-renders with the error. Return only serializable data (no passwords!).
- `redirect(303, …)` after a successful POST is the Post/Redirect/Get pattern — a refresh will not
  resubmit the form.

### `routes/(guest)/login/+page.svelte`

```svelte
<script lang="ts">
	import LoginForm from '#lib/components/Auth/LoginForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props(); // `form` = last action result (or undefined)
</script>

<svelte:head>
	<title>Login · Predictive Analysis</title>
</svelte:head>

<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
	<h1 class="text-2xl font-bold text-gray-900">Welcome back</h1>
	<p class="mt-1 mb-6 text-sm text-gray-500">Sign in to continue</p>
	<LoginForm error={form?.error} />
</div>
```

`PageProps` (from the generated `./$types`) types both `data` and `form`, so `form?.error` is
known to be `string | undefined`.

### `routes/(app)/+layout.svelte`

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import Sidebar from '#lib/components/Sidebar/Sidebar.svelte';
	import { auth } from '#lib/stores/auth.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen bg-gray-50">
	<Sidebar />

	<div class="flex min-w-0 flex-1 flex-col">
		<header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
			<span class="text-sm text-gray-500">Hello, {auth.user?.name}</span>
			<form method="POST" action="/api/auth/logout" use:enhance>
				<button class="text-sm font-medium text-gray-600 hover:text-gray-900">Logout</button>
			</form>
		</header>

		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</div>
</div>
```

Logout is a tiny `<form method="POST">`, not a link: anything that changes state must not be a
`GET` (crawlers and prefetching would log users out). `use:enhance` makes it a smooth client-side
navigation after the server redirect.

### `routes/(app)/dashboard/+page.svelte`

```svelte
<script lang="ts">
	// Placeholder data. Replace with real values loaded in +page.server.ts.
	const stats = [
		{ label: 'Total Records', value: '1,248' },
		{ label: 'Models Trained', value: '12' },
		{ label: 'Predictions Today', value: '312' },
		{ label: 'Avg. Accuracy', value: '94.2%' }
	];
</script>

<svelte:head>
	<title>Dashboard · Predictive Analysis</title>
</svelte:head>

<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<p class="text-sm text-gray-500">{stat.label}</p>
			<p class="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
		</div>
	{/each}
</div>

<div class="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
	<h2 class="text-base font-semibold text-gray-900">Recent activity</h2>
	<p class="mt-2 text-sm text-gray-500">Nothing here yet.</p>
</div>
```

To wire real data: create `dashboard/+page.server.ts` with a `load` that returns `{ stats }`,
change the script to `let { data }: PageProps = $props();` and iterate `data.stats`.

### `routes/api/auth/logout/+server.ts`

```ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete('token', { path: '/' }); // same path as when it was set
	redirect(303, '/login');
};
```

`+server.ts` files export one handler per HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`,
`OPTIONS`, `HEAD`) plus an optional `fallback`. §33.

## 10. Walkthroughs

### 10.1 Login, step by step

1. Browser requests `GET /login`.
2. `hooks.server.ts`: no cookie → `locals.user = null`. Path is `/login` and user is null → no
   redirect → `resolve(event)`.
3. Root `+layout.server.ts` returns `{ user: null }`.
4. Server renders root layout → `(guest)` layout → login page. HTML goes to the browser with the
   serialized `data` (`{ user: null }`) embedded. Browser hydrates.
5. User types credentials and submits. `use:enhance` sets `loading = true` and POSTs the
   `FormData` with `fetch` (header `x-sveltekit-action: true`, `Accept: application/json`).
6. `hooks.server.ts` runs again for the POST (still no cookie; `/login` with no user → continue).
7. `login/+page.server.ts` → `actions.default`:
   - empty field → `return fail(400, { error })` → the response is `{ type: 'failure', status: 400, data }`;
     `update()` sets the page's `form` prop → `<LoginForm error=…>` shows the message, inputs keep their values.
   - valid → `cookies.set('token', …)` → `redirect(303, '/dashboard')` → response
     `{ type: 'redirect', location: '/dashboard' }` with a `Set-Cookie` header.
8. `update()` sees the redirect and calls `goto('/dashboard')` (client-side navigation, with
   `invalidateAll` so all `load` functions rerun).
9. Browser requests `/dashboard/__data.json` (data only). `hooks.server.ts` finds the cookie →
   `locals.user = {...}`; path is protected and user exists → continue.
10. Root `+layout.server.ts` returns `{ user }`. The response is JSON.
11. Client swaps `(guest)` layout for `(app)` layout and mounts the dashboard page.
    `(app)/+layout.svelte` renders `Hello, Demo User` from `auth.user` → `page.data.user`.

Refresh the browser on `/dashboard`: steps 9–11 happen as a full SSR render instead; the result
is identical, which is the point of SSR + hydration.

### 10.2 Logout

Click **Logout** → `POST /api/auth/logout` (enhanced form) → `cookies.delete('token')` →
`redirect(303, '/login')` → `goto('/login')` → `__data.json` for `/login` → `user: null` →
`(guest)` layout mounts. Visiting `/dashboard` now hits the hook's guard and bounces to `/login`.

### 10.3 Full reload vs. client-side navigation

|                         | Full reload (`F5`, first visit, `data-sveltekit-reload`) | Client-side (`<a>`, `goto`)           |
| ----------------------- | -------------------------------------------------------- | ------------------------------------- |
| What the server returns | HTML + inlined data                                      | JSON (`__data.json`)                  |
| Which `load`s run       | all for that route                                       | only those whose inputs changed (§31) |
| Layouts                 | re-created                                               | kept mounted (state preserved)        |
| `hooks.server.ts`       | runs                                                     | runs (for the data request)           |
| `$effect` / `onMount`   | run after hydration                                      | run when the page component mounts    |

# Part B — Svelte 5

## 11. Component anatomy

```svelte
<script module lang="ts">
	// optional: runs ONCE per module, not per instance. Export helpers/consts from here.
	export const SIZES = ['sm', 'md'] as const;
</script>

<script lang="ts">
	// runs once per component INSTANCE. Props, state, derived values, effects, imports.
	let { title }: { title: string } = $props();
	let open = $state(false);
</script>

<!-- markup: exactly like HTML, plus {expressions} and {#blocks} -->
<section>
	<h2>{title}</h2>
	<button onclick={() => (open = !open)}>Toggle</button>
	{#if open}<p>Content</p>{/if}
</section>

<style>
	/* scoped to this component by default (a hash class is added to every selector) */
	section {
		padding: 1rem;
	}
	:global(body) {
		margin: 0;
	} /* escape hatch */
</style>
```

- One component = one `.svelte` file. The file name is the component name (`PascalCase`).
- Components are plain values: you can pass them as props, store them in objects, render with `<Comp />`.
- **Runes mode is forced project-wide** (`vite.config.ts`). The legacy syntax (`export let`, `$:`,
  `on:click`, `<slot>`, `$store` on a custom store, `createEventDispatcher`) is a compile error.

## 12. `$state`

```ts
let count = $state(0); // primitive
let user = $state({ name: 'A', tags: ['x'] }); // objects/arrays become deeply reactive proxies

count += 1; // reassign → UI updates
user.name = 'B'; // mutate → UI updates (deep)
user.tags.push('y'); // array methods work
```

| Variant              | When                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$state(v)`          | default. Deep proxy for objects/arrays; `Map`/`Set`/class instances are **not** proxied (use `svelte/reactivity` or classes with `$state` fields) |
| `$state.raw(v)`      | large/immutable data: no deep proxy, only reassignment triggers updates. Cheaper for big lists you replace wholesale                              |
| `$state.snapshot(v)` | plain, non-proxy copy — pass to `structuredClone`, `JSON.stringify`, `console.log`, third-party libs                                              |
| `$state.eager(v)`    | (5.5x) update the DOM synchronously for this value — rarely needed                                                                                |

Rules:

- Declare with `let`, never `const` (you need to reassign). Use `const` for derived/raw values you never reassign.
- Destructuring a `$state` object breaks reactivity for the destructured parts (they are plain copies).
- Class fields can be runes: `class Todo { done = $state(false); text = $state(''); }`. Methods see
  the reactive fields. This is the recommended way to model entities with behaviour.
- Reactivity is **signal-based** — only what read the value re-renders; there is no virtual DOM diff.

## 13. `$derived`

```ts
let items = $state<Item[]>([]);
let total = $derived(items.reduce((s, i) => s + i.price, 0)); // expression
let grouped = $derived.by(() => {
	// multi-statement
	const map = new Map<string, Item[]>();
	for (const i of items) (map.get(i.cat) ?? map.set(i.cat, []).get(i.cat)!).push(i);
	return map;
});
```

- Lazily evaluated, cached, re-computed only when something it read changes.
- Must be side-effect free (no state writes, no fetch). That is what `$effect` is for.
- Since 5.25 you _may_ temporarily assign to a derived (optimistic UI); it reverts when
  dependencies change. Use sparingly.
- Replaces Vue `computed` and most uses of `$:`.

## 14. `$effect`

```ts
$effect(() => {
	const id = setInterval(() => (seconds += 1), 1000); // runs after the component mounts
	return () => clearInterval(id); // cleanup: before re-run and on destroy
});

$effect(() => {
	console.log(count); // re-runs whenever `count` changes (dependencies tracked at run time)
});
```

| Variant              | When                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `$effect`            | after DOM update; browser only                                                          |
| `$effect.pre`        | before DOM update (e.g. measure scroll position before new content renders)             |
| `$effect.root`       | manual root for effects outside a component lifecycle (rare, must be destroyed by hand) |
| `$effect.tracking()` | `true` if called inside a tracking context (library code)                               |
| `$effect.pending()`  | number of pending `await`s in the current boundary (async Svelte)                       |

Rules that save hours of debugging:

1. **Effects never run on the server.** SSR output cannot depend on them (this is why
   `stores/auth.ts` reads `page.data` instead of being hydrated in an effect).
2. Only **synchronously read** values are tracked. Values read after an `await` or inside a
   `setTimeout` callback are not dependencies.
3. Do not write to state that the same effect reads — you create a loop. Reach for `$derived`
   instead; if you truly need an effect, wrap the read in `untrack(() => …)` (from `'svelte'`).
4. Do not use effects to sync two pieces of state — derive one from the other.
5. For "do something when a prop changes" prefer deriving; for imperative DOM/library
   integration use `$effect` or, better, attachments (§17).

## 15. `$props` and `$bindable`

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		title: string; // required
		size?: 'sm' | 'md'; // optional
		value?: string; // bindable (see below)
		header?: Snippet; // optional named snippet
		children?: Snippet; // default content
		onclose?: (reason: string) => void; // "event" as callback prop
	}

	let {
		title,
		size = 'md',
		value = $bindable(''), // parent may bind:value
		header,
		children,
		onclose,
		...rest // everything else → spread on the root element
	}: Props = $props();

	const id = $props.id(); // unique per instance, SSR-safe (for aria-*/label for)
</script>

<div {...rest} data-size={size}>
	{#if header}{@render header()}{/if}
	<h2 {id}>{title}</h2>
	<input bind:value aria-labelledby={id} />
	{@render children?.()}
	<button onclick={() => onclose?.('button')}>Close</button>
</div>
```

- Props are **read-only** unless declared `$bindable`. Reassigning a non-bindable prop is a warning
  and will be overwritten on the next parent update.
- Defaults only apply when the parent passes `undefined`.
- Prop names follow the attribute they stand for: use `onclick`, `onclose` (lowercase) so they
  spread naturally onto elements and read like DOM events.
- Rename while destructuring: `let { class: className } = $props();`.

## 16. Snippets and `{@render}`

Snippets replace slots. A snippet is a chunk of markup with parameters, defined where it is used
or passed as a prop.

```svelte
<!-- Table.svelte -->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	let { rows, row, empty }: { rows: T[]; row: Snippet<[T, number]>; empty?: Snippet } = $props();
</script>

<table>
	{#each rows as r, i (i)}
		{@render row(r, i)}
	{:else}
		{@render empty?.()}
	{/each}
</table>

<!-- usage -->
<Table rows={users}>
	{#snippet row(u, i)}
		<tr><td>{i + 1}</td><td>{u.name}</td></tr>
	{/snippet}
	{#snippet empty()}<tr><td>No users</td></tr>{/snippet}
</Table>
```

- Content without a `{#snippet}` wrapper becomes the implicit `children` snippet.
- A snippet declared **inside** a component's markup (not passed to a child) can be rendered
  multiple times — handy for repeating markup without a sub-component.
- Snippets can be passed explicitly as props: `<Table {rows} row={myRowSnippet} />`.
- `Snippet<[A, B]>` types the parameters.

## 17. Template syntax

```svelte
{#if cond} … {:else if other} … {:else} … {/if}

{#each items as item, index (item.id)} … {:else} <!-- empty list --> {/each}
{#each { length: 5 } as _, i} … {/each}                 <!-- repeat N times -->

{#await promise}
	loading…
{:then value} {value}
{:catch err} {err.message}
{/await}

{#key value} <Comp /> {/key}       <!-- destroy + recreate when `value` changes (restart transitions) -->

{@html trustedHtml}                <!-- raw HTML: XSS risk, only for sanitized content -->
{@const area = w * h}              <!-- local constant inside a block -->
{@render snippet(args)}
{@attach (node) => { /* setup */ return () => { /* teardown */ } }}   <!-- attachments (5.29+) -->
{@debug var1, var2}                <!-- breakpoint when they change -->
```

**Attachments** (`{@attach fn}`) are the modern replacement for most `use:action` cases: a
function receives the DOM node, runs when it mounts, re-runs when its reactive dependencies
change, and its return value is the cleanup. You can store attachment factories in `lib/utils`
(e.g. `tooltip(text)`, `clickOutside(cb)`) and spread them via props. `use:enhance` is still an
action because SvelteKit ships it that way.

## 18. Events

```svelte
<button onclick={handle}>…</button>
<button onclick={(e) => { e.preventDefault(); save(); }}>…</button>   <!-- no .prevent modifiers -->
<input oninput={(e) => (q = e.currentTarget.value)} />
<form onsubmit={(e) => { e.preventDefault(); … }}>
<div onclickcapture={…}>          <!-- capture phase: suffix `capture` -->
```

- Handlers are plain attributes (`on` + event name, lowercase). They can be spread with `{...rest}`.
- No modifiers: call `preventDefault()` / `stopPropagation()` yourself, or write tiny wrappers.
- Component "events" are **callback props** (`onsave`, `onchange`). `createEventDispatcher` is deprecated.
- Multiple handlers for the same event on one element: combine them in one function.

## 19. Bindings

| Binding                                                         | Element / use                                        |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| `bind:value`                                                    | input, textarea, select (number inputs give numbers) |
| `bind:checked`                                                  | checkbox                                             |
| `bind:group`                                                    | radio / checkbox groups sharing one variable         |
| `bind:files`                                                    | `<input type="file">`                                |
| `bind:this={el}`                                                | DOM element or component instance reference          |
| `bind:clientWidth` / `bind:clientHeight` / `bind:offsetWidth` … | read-only dimension bindings                         |
| `bind:innerWidth` / `bind:scrollY` on `<svelte:window>`         | window metrics                                       |
| `bind:open` on `<details>` / `<dialog>`                         |                                                      |
| `bind:prop` on a component                                      | only if the child declared `prop = $bindable()`      |
| `bind:value={get, set}`                                         | function bindings (5.9+) to validate/transform       |

## 20. Classes and styles

```svelte
<div class="card {active ? 'ring-2' : ''}">                    <!-- template string -->
<div class={['card', active && 'ring-2', { hidden }]}>        <!-- array/object form (clsx-like, 5.16+) -->
<div class:active>                                             <!-- directive: adds "active" when `active` is truthy -->
<div class:is-open={open}>
<div style:color={c} style:--brand="#4f46e5">                  <!-- style directive, CSS vars included -->
```

With Tailwind, prefer full class strings in each branch (`active ? 'bg-indigo-50' : 'bg-white'`)
so Tailwind's scanner sees the complete names. Never build names like `bg-${color}-500`.

## 21. Special elements

| Element                                                               | Purpose                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `<svelte:head>`                                                       | inject into `<head>` (title, meta, links) — SSR-aware           |
| `<svelte:window onkeydown={…} bind:innerWidth={w}>`                   | window events/bindings with automatic cleanup                   |
| `<svelte:document>` / `<svelte:body>`                                 | same for document/body                                          |
| `<svelte:element this={tag}>`                                         | dynamic tag name                                                |
| `<svelte:boundary onerror={…}>` + `{#snippet failed(error, reset)}`   | error boundary around a subtree; also hosts `pending` for async |
| `<svelte:options runes={true} css="injected" />`                      | per-component compiler options                                  |
| `<svelte:component this={C}>` / `<svelte:self>` / `<svelte:fragment>` | **legacy** — in Svelte 5 use `<C />`, import yourself, snippets |

## 22. Lifecycle, `tick`, context

```ts
import { onMount, onDestroy, tick, setContext, getContext, untrack } from 'svelte';

onMount(() => {              // browser only, after first render; return cleanup
	const chart = new Chart(canvas, …);
	return () => chart.destroy();
});

await tick();                // wait until pending state changes are applied to the DOM

// Context: pass values down the tree without prop drilling. Must be called during component init.
setContext('theme', theme);                         // parent
const theme = getContext<Theme>('theme');           // any descendant
```

`onMount` vs `$effect`: `onMount` runs once and does not track dependencies; `$effect` re-runs
when its dependencies change. For third-party libraries that need a DOM node, an attachment
(`{@attach}`) is usually the cleanest.

Context is how `$app/state`'s `page` works on the server (request-scoped), which is why it can only
be read during rendering.

## 23. Shared reactive state in `.svelte.ts` files

Runes work in any file with a `.svelte.ts` / `.svelte.js` extension. This is the Svelte 5 way to
write "composables" / global stores for **client-side UI state**.

```ts
// src/lib/stores/ui.svelte.ts
class UiStore {
	sidebarOpen = $state(false);
	toasts = $state<{ id: number; text: string }[]>([]);

	toggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
	}
	toast(text: string) {
		const id = Date.now();
		this.toasts.push({ id, text });
		setTimeout(() => (this.toasts = this.toasts.filter((t) => t.id !== id)), 3000);
	}
}
export const ui = new UiStore();
```

```svelte
<script lang="ts">
	import { ui } from '#lib/stores/ui.svelte.ts';
</script>

<button onclick={() => ui.toggleSidebar()}>Menu</button>
{#if ui.sidebarOpen}…{/if}
```

Rules:

- You cannot `export let x = $state()` and reassign it from outside — export an object/class
  instance and mutate its fields, or export getter/setter functions.
- **Never put per-user or per-request data in a module-level `$state`** (shared across requests on
  the server). Per-user data comes from `load` → `page.data`.
- Reading a `$state` field across a function boundary must go through a getter or the object
  itself (`ui.sidebarOpen`), not a copied primitive.

## 24. Legacy stores and `svelte/reactivity`

`svelte/store` (`writable`, `readable`, `derived`, `get`) still works and auto-subscribes in
components with the `$store` prefix. Use it only when integrating a library that expects the store
contract; otherwise prefer runes.

`svelte/reactivity` provides reactive versions of built-ins: `SvelteMap`, `SvelteSet`, `SvelteDate`,
`SvelteURL`, `SvelteURLSearchParams`, plus `MediaQuery` and `createSubscriber` for wrapping external
event sources. `svelte/reactivity/window` exports reactive `innerWidth`, `scrollY`, `online`, etc.

## 25. Transitions and animations

```svelte
<script>
	import { fade, fly, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
</script>

{#if visible}<div transition:fade>…</div>{/if}
<!-- in + out -->
<div in:fly={{ y: 20, duration: 200 }} out:fade>…</div>
{#each items as item (item.id)}
	<li animate:flip>{item.name}</li>
	<!-- animates reordering in keyed each -->
{/each}
```

Also `svelte/easing`, `svelte/motion` (`Tween`, `Spring` classes in Svelte 5). Transitions are
local by default (`|global` modifier to play on ancestor block changes).

## 26. TypeScript in components

- `<script lang="ts">` everywhere. `.svelte.ts` for rune modules.
- Type props with an `interface Props` and extend element attribute types from `svelte/elements`
  (`HTMLButtonAttributes`, `HTMLInputAttributes`, `HTMLAttributes<HTMLDivElement>`, `SvelteHTMLElements`).
- Generic components: `<script lang="ts" generics="T extends { id: string }">`.
- `Snippet<[Arg1, Arg2]>`, `Component` and `ComponentProps<typeof X>` from `'svelte'`.
- Route files import generated types from `'./$types'`: `PageProps`, `LayoutProps`, `PageData`,
  `LayoutData`, `PageServerLoad`, `PageLoad`, `LayoutServerLoad`, `Actions`, `RequestHandler`.
- `App.Locals`, `App.PageData`, `App.Error`, `App.PageState` are augmented in `src/app.d.ts`.
- Run `pnpm check` — svelte-check type-checks `.svelte` markup as well as scripts.

## 27. Styling: scoped CSS and Tailwind 4

**Scoped `<style>`**: selectors are scoped to the component by adding a hash class. Styles for
child components need `:global(...)` or CSS custom properties passed down. Unused selectors are
removed with a warning.

**Tailwind 4** is configured in CSS, not JS:

```css
/* src/routes/layout.css */
@import 'tailwindcss';
@plugin '@tailwindcss/forms';

@theme {
	--color-brand: #4f46e5; /* → bg-brand, text-brand, border-brand … */
	--font-sans: 'Inter', ui-sans-serif, system-ui;
	--radius-card: 1rem; /* → rounded-card */
}

@layer components {
	.card {
		@apply rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200;
	}
}
```

- Content detection is automatic (no `content: []`), but class names must appear as complete
  strings in your source.
- `@source "../node_modules/some-ui-lib"` if a library ships Tailwind classes.
- Dark mode: `dark:` works with `prefers-color-scheme` by default; use
  `@custom-variant dark (&:where(.dark, .dark *));` for a class-based toggle.
- `prettier-plugin-tailwindcss` sorts classes — do not fight it.

# Part C — SvelteKit 3

## 28. Routing

Directory-based. Only files starting with `+` are route files; every other file in `routes/` is
ignored by the router (but keep helpers in `lib/`).

| Path                                     | URL                   | Notes                                                                                 |
| ---------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `routes/+page.svelte`                    | `/`                   |                                                                                       |
| `routes/about/+page.svelte`              | `/about`              |                                                                                       |
| `routes/blog/[slug]/+page.svelte`        | `/blog/hello`         | `params.slug`                                                                         |
| `routes/files/[...path]/+page.svelte`    | `/files/a/b/c`        | rest param, also matches `/files`                                                     |
| `routes/[[lang]]/about/+page.svelte`     | `/about`, `/en/about` | optional param                                                                        |
| `routes/items/[id=integer]/+page.svelte` | `/items/42`           | **matcher** in `src/params/integer.ts`: `export const match = (p) => /^\d+$/.test(p)` |
| `routes/(app)/dashboard/+page.svelte`    | `/dashboard`          | group — no URL segment                                                                |
| `routes/api/users/+server.ts`            | `/api/users`          | endpoint                                                                              |
| `routes/+error.svelte`                   | —                     | error page for this subtree                                                           |

Route files per folder:

| File                               | Exports                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `+page.svelte`                     | the page component (`data`, `form` props)                                                             |
| `+page.ts`                         | universal `load`, page options                                                                        |
| `+page.server.ts`                  | server `load`, `actions`, page options                                                                |
| `+layout.svelte`                   | layout component (`data`, `children`)                                                                 |
| `+layout.ts` / `+layout.server.ts` | layout `load`, page options                                                                           |
| `+server.ts`                       | `GET`/`POST`/… handlers; a `POST` handler here shadows page `actions` in the same folder              |
| `+error.svelte`                    | rendered when `error()` is thrown or a load fails; receives nothing — use `page.error`, `page.status` |

Specificity: static segments beat dynamic, matchers beat plain params, rest params lose to
everything. `page.route.id` gives the matched route id (e.g. `/(app)/dashboard`), which is also
usable with `resolve()` from `$app/paths`.

## 29. Layouts

- Layouts nest by folder. Each renders `{@render children()}`.
- Layout state persists across navigation between its children (the sidebar does not re-mount).
- **Breaking out** of a layout: `+page@.svelte` uses the root layout, `+page@(app).svelte` resets
  to the `(app)` layout. Same for `+layout@.svelte`.
- Groups `(name)` exist purely to assign layouts (and to scope `+error.svelte`).
- Layout `load` data is available to all children via `data` / `page.data` and via
  `await parent()` inside child `load` functions.

## 30. Loading data

### Server load (`+page.server.ts` / `+layout.server.ts`)

```ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
	params,
	url,
	route, // route info
	fetch, // Kit's fetch (cookies forwarded, SSR-inlined)
	cookies,
	locals,
	request, // server-only
	parent, // () => Promise<parent layout data>
	depends, // register custom invalidation keys
	setHeaders, // e.g. cache-control
	untrack, // read url/params without making them dependencies
	getClientAddress,
	platform,
	isDataRequest,
	isSubRequest
}) => {
	if (!locals.user) error(401, 'Unauthorized'); // throws → +error.svelte
	const report = await fetchApi<Report>(`/reports/${params.id}`, { fetch, token: locals.token });
	if (!report) error(404, 'Report not found');
	return { report }; // must be serializable (devalue): Date, Map, Set, BigInt OK; class instances NO
};
```

### Universal load (`+page.ts` / `+layout.ts`)

Runs on the server for SSR **and** in the browser on client-side navigation. No `cookies`,
`locals`, `request`. Receives `data` = whatever the sibling server `load` returned. Use it for
public data (§4: no token!) or to return non-serializable things like component constructors.

### Where the data goes

- `+page.svelte` → `let { data } = $props()` — merged data of all parent layouts + the page.
- `page.data` from `$app/state` — the same object, readable anywhere (used by `stores/auth.ts`).
- Keys from deeper loads override parent keys with the same name.

### Streaming

Return a promise **nested** in an object and it streams after the initial HTML:

```ts
return { report: await getReport(), comments: getComments() }; // comments streams
```

```svelte
{#await data.comments}<Spinner />{:then comments}…{/await}
```

Top-level awaited values block the render; streamed promises need SSR + JS in the browser.

### Errors and redirects in `load`

`error(status, message | App.Error)` → nearest `+error.svelte`. `redirect(status, location)` →
redirect. Both throw, so no code runs after them. Unexpected exceptions become a 500 with a
generic message (details stay in the server log / `handleError`).

## 31. Invalidation: when `load` reruns

A `load` function reruns on client-side navigation only if something it **used** changed:
`params.x` or `url.searchParams` it read, `await parent()` when the parent reran, a `fetch` URL
that was invalidated, or a `depends('key')` key that was invalidated.

```ts
// in load
depends('app:reports');
// anywhere on the client
import { invalidate, invalidateAll, refreshAll } from '$app/navigation';
await invalidate('app:reports'); // reruns loads that depend on this key
await invalidate('/api/reports'); // reruns loads that fetched this URL
await invalidate((url) => url.pathname.startsWith('/api/'));
await invalidateAll(); // every load on the current page
```

After a form action, `use:enhance`'s default `update()` calls `invalidateAll()` so pages show
fresh data. `goto(url, { invalidateAll: true })` does the same for navigation.

Reading `url.pathname` in a layout `load` makes it rerun on every navigation — use
`untrack(() => url.pathname)` if you only need it once.

## 32. Form actions

### Server side

```ts
import { fail, invalid, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	create: async ({ request, locals, fetch }) => {
		// <form action="?/create">
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		if (!title) return fail(400, { title, missing: true }); // keeps user input
		await fetchApi('/reports', {
			fetch,
			token: locals.token,
			method: 'POST',
			body: JSON.stringify({ title })
		});
		return { success: true }; // page gets form.success
	},
	remove: async ({ url }) => {
		// <form action="?/remove&id=3">
		const id = url.searchParams.get('id');
		// …
		redirect(303, '/reports');
	}
};
```

- `fail(status, data)` → `form` prop = `data`, status 4xx, no navigation.
- `invalid(message)` (Kit ≥ 2.47) → throws a validation error that `use:enhance` surfaces; useful
  with schema validation. `isValidationError(e)` to detect it.
- Return a plain object → `form` prop with status 200.
- `redirect()` → navigation. `error()` → error page.
- Only one `+page.server.ts` `actions` per route; a `+server.ts` in the same folder would shadow POST.

### Client side — `use:enhance`

```svelte
<form method="POST" action="?/create" use:enhance={({ formElement, formData, action, cancel, submitter, controller }) => {
	// before submit: validate, add fields, or cancel()
	if (!formData.get('title')) { cancel(); return; }

	return async ({ result, update, formElement }) => {
		// result.type: 'success' | 'failure' | 'redirect' | 'error'
		if (result.type === 'success') formElement.reset();
		await update({ reset: false, invalidateAll: true });   // default behaviour, configurable
		// or handle manually: applyAction(result)
	};
}}>
```

Default `update()` behaviour: on `success`/`failure` set `form` and (on success) reset the form and
`invalidateAll()`; on `redirect` → `goto`; on `error` → render nearest error page.
`applyAction(result)` from `$app/forms` applies a result you obtained yourself (e.g. after a manual
`fetch` + `deserialize(await res.text())`).

### Progressive enhancement checklist

1. `method="POST"`, real `name` attributes on inputs, a submit button.
2. The action returns `fail()` with the user's input so the no-JS re-render keeps it.
3. Redirect after success.
4. Add `use:enhance` last — it only improves what already works.

### File uploads

`<form enctype="multipart/form-data">`, then `formData.get('file') as File` in the action. Stream
it to the backend with `fetch` and a `FormData` body (do not set `Content-Type` yourself in that case).

## 33. API routes (`+server.ts`)

```ts
import { json, error, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, setHeaders }) => {
	const q = url.searchParams.get('q') ?? '';
	setHeaders({ 'cache-control': 'public, max-age=60' });
	return json({ q, user: locals.user?.id ?? null });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401);
	const body = await request.json();
	// …
	return new Response(null, { status: 201 });
};

export const fallback: RequestHandler = () => text('Method not allowed', { status: 405 });
```

- Return a standard `Response` (helpers: `json`, `text`, `redirect`, `error`).
- When a folder has both `+page.svelte` and `+server.ts`, `GET` with `Accept: text/html` renders
  the page, otherwise the handler runs (content negotiation).
- `+server.ts` is the right place for things the browser calls directly (`fetch('/api/…')`),
  webhooks, file downloads. For page data prefer `load`; for mutations prefer `actions`.
- Guarded by `hooks.server.ts` like everything else — remember `PROTECTED_PREFIXES` is pathname-based.

## 34. Hooks

### `src/hooks.server.ts`

| Export        | Signature (types from `@sveltejs/kit/hooks`) | Purpose                                                                                                                                                                      |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handle`      | `Handle`                                     | wrap every request (auth, locals, headers, HTML transforms). Compose several with `sequence(a, b)`                                                                           |
| `handleFetch` | `HandleFetch`                                | intercept `fetch` calls made inside `load`/actions on the server (rewrite URLs, forward cookies to the API)                                                                  |
| `handleError` | `HandleServerError`                          | log unexpected errors (Sentry), shape the `App.Error` the client sees. Receives `{ kind: 'app' \| 'framework' \| 'unknown' \| 'validation', error, event, status, message }` |
| `init`        | `ServerInit`                                 | async one-time setup when the server starts (DB connection)                                                                                                                  |
| `reroute`     | `Reroute`                                    | map a URL to a different route id before routing (i18n prefixes) — also allowed in `hooks.ts` (universal)                                                                    |
| `transport`   | `Transport`                                  | teach devalue to serialize custom classes between server and client (`encode`/`decode`)                                                                                      |

```ts
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit/hooks';

const auth: Handle = async ({ event, resolve }) => {
	/* … */ return resolve(event);
};
const security: Handle = async ({ event, resolve }) => {
	const res = await resolve(event);
	res.headers.set('x-frame-options', 'DENY');
	return res;
};
export const handle = sequence(auth, security);

export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	if (request.url.startsWith('https://api.example.com/')) {
		request = new Request(
			request.url.replace('https://api.example.com/', 'http://api-internal:8080/'),
			request
		);
	}
	return fetch(request);
};

export const handleError: HandleServerError = ({ kind, error, event, status, message }) => {
	if (kind === 'unknown') console.error(event.url.pathname, error);
	return { message: status === 404 ? 'Not found' : 'Something went wrong' };
};
```

### `src/hooks.client.ts`

`handleError` (client-side errors), `init` (browser startup), `reroute`, `transport`.

## 35. Errors

- **Expected errors**: `error(404, 'Not found')` or `error(422, { message, code: 'X' })` (shape =
  `App.Error`, extend it in `app.d.ts`). Rendered by the nearest `+error.svelte` with
  `page.status` / `page.error`. Not logged as crashes.
- **Unexpected errors**: any other exception. Logged, passed to `handleError`, rendered as 500 with
  a generic message (stack traces never reach the browser in production).
- `+error.svelte` is looked up from the failing route upwards; a root `src/routes/+error.svelte`
  is the global fallback. If the root layout `load` itself fails, Kit renders `src/error.html`.
- Inside a component subtree use `<svelte:boundary>` to catch render errors.

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
	import { page } from '$app/state';
</script>

<h1>{page.status}</h1><p>{page.error?.message}</p>
```

## 36. Cookies, sessions, CSRF

`event.cookies` (server only): `get(name)`, `getAll()`, `set(name, value, { path, httpOnly, sameSite, secure, maxAge, expires, domain })`,
`delete(name, { path })`, `serialize()`, `parse()`.

- `path` is **required** by Kit on `set`/`delete`; use `'/'` for site-wide cookies and the same path when deleting.
- `httpOnly: true` for auth tokens (our rule, §4). `secure` defaults to `true` except on `localhost`.
- `sameSite: 'lax'` is the right default for a session cookie; `'strict'` breaks links from emails; `'none'` requires `secure` and is only for cross-site embedding.
- Cookies set during `load`/actions are included in the response and also visible to subsequent
  `fetch` calls in the same request.
- **CSRF**: Kit rejects form POSTs whose `Origin` does not match the app unless the origin is listed
  in `csrf.trustedOrigins` (vite config). `sameSite: 'lax'` adds a second layer.
- There is no server-side session store in this template; the token cookie _is_ the session.
  If you need server sessions later, `sv add lucia` scaffolds one.

## 37. Page options

Exported from `+page.ts`, `+page.server.ts`, `+layout.ts` or `+layout.server.ts`; apply to the
subtree:

```ts
export const prerender = true; // true | false | 'auto' — render at build time
export const ssr = false; // SPA for this subtree (no server render)
export const csr = false; // no JavaScript at all (static content)
export const trailingSlash = 'always'; // 'never' (default) | 'always' | 'ignore'
export const entries = () => [{ slug: 'a' }, { slug: 'b' }]; // which dynamic pages to prerender
export const config = { runtime: 'edge' }; // adapter-specific
```

Prerendered pages cannot read cookies or use actions. Everything in this project is SSR by
default, which is what an authenticated app wants.

## 38. `$app/*` module reference

| Module                                | Exports (Kit 3.0)                                                                                                                                                                                                                                                                                                  | Notes                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `$app/state`                          | `page` (`url`, `params`, `route.id`, `status`, `error`, `data`, `form`, `state`, `shallow`), `navigating` (`from`, `to`, `type`, `complete`), `updated` (`current`, `check()`)                                                                                                                                     | reactive via runes; works in SSR during render only                                                                                  |
| `$app/navigation`                     | `goto(url, { replaceState, invalidate, invalidateAll, refreshAll, state, shallow, reset })`, `invalidate`, `invalidateAll`, `refreshAll`, `preloadData`, `preloadCode`, `beforeNavigate`, `afterNavigate`, `onNavigate` (view transitions), `pushState`, `replaceState` (shallow routing), `disableScrollHandling` | browser only                                                                                                                         |
| `$app/forms`                          | `enhance`, `applyAction`, `deserialize`                                                                                                                                                                                                                                                                            |                                                                                                                                      |
| `$app/paths`                          | `resolve(routeIdOrPath, params?)`, `asset(path)`, `match(...)`                                                                                                                                                                                                                                                     | **Kit 3 removed the `base`/`assets` constants** — use `resolve('/dashboard')` and `asset('/robots.txt')` so `paths.base` is honoured |
| `$app/env`                            | `browser`, `dev`, `building`, `version`                                                                                                                                                                                                                                                                            | runtime flags (not env vars)                                                                                                         |
| `$app/env/public`, `$app/env/private` | your variables from `src/env.ts`                                                                                                                                                                                                                                                                                   | §39                                                                                                                                  |
| `$app/server`                         | `read(asset)`, `getRequestEvent()`, remote functions `query`/`form`/`command`/`prerender` (§42)                                                                                                                                                                                                                    | server only                                                                                                                          |
| `$app/types`                          | `RouteId`, `Pathname`, `ResolvedPathname`, `RouteParams<'/x/[id]'>`, `LayoutParams`                                                                                                                                                                                                                                | generated                                                                                                                            |
| `@sveltejs/kit`                       | `error`, `fail`, `invalid`, `redirect`, `json`, `text`, `isHttpError`, `isRedirect`, `isActionFailure`, `isValidationError`, `normalizeUrl` + types (`RequestEvent`, `Cookies`, `Actions`, `Load`, …)                                                                                                              |                                                                                                                                      |
| `@sveltejs/kit/hooks`                 | `sequence` + hook types (`Handle`, `HandleFetch`, `HandleServerError`, `HandleClientError`, `Reroute`, `ServerInit`, `ClientInit`, `Transport`)                                                                                                                                                                    |                                                                                                                                      |
| `@sveltejs/kit/env`                   | `defineEnvVars`                                                                                                                                                                                                                                                                                                    |                                                                                                                                      |

`navigating` is handy for a global progress bar:

```svelte
<script>
	import { navigating } from '$app/state';
</script>

{#if navigating.to}<div class="fixed top-0 h-0.5 w-full animate-pulse bg-indigo-600"></div>{/if}
```

## 39. Environment variables

Kit 3 replaced the four `$env/*` modules with one declaration file.

1. Declare in `src/env.ts` with `defineEnvVars({ NAME: { public?, static?, schema?, description? } })`.
2. Provide values via `.env*` files or the process environment.
3. Import: `import { NAME } from '$app/env/public'` (public) or `'$app/env/private'` (server-only).
4. Values are validated when the app starts (dev server or production server). A missing/invalid
   variable fails fast with a clear message — better than a runtime `undefined`.

| Flag           | Meaning                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `public: true` | shipped to the browser. Only non-secrets                                                                        |
| `static: true` | read at **build** time and inlined (feature flags, build ids). Otherwise read when the server starts            |
| `schema`       | function `(raw) => value` (throw to reject, return a default for optional) or any Standard Schema (Valibot/Zod) |

Rename `API_BASE_URL` per environment through `.env.production` / hosting dashboard; no code changes.

## 40. Server-only modules

SvelteKit refuses to build if browser code (directly or transitively) imports:

- anything under `src/lib/server/`
- files named `*.server.ts` / `*.server.js`
- `$app/env/private`, `$app/server`

Put database clients, payment SDK secrets, backend-admin helpers there. This is a compile-time
guarantee, far stronger than "remember not to import it".

## 41. Links, preloading, scroll

Normal `<a href>` elements are intercepted for client-side navigation. Attributes (on the link or
any ancestor, e.g. `<body>`):

| Attribute                                                               | Effect                                               |
| ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `data-sveltekit-preload-data="hover" \| "tap" \| "off"`                 | run `load` early (default in `app.html`: hover)      |
| `data-sveltekit-preload-code="eager" \| "viewport" \| "hover" \| "tap"` | fetch the JS chunk early                             |
| `data-sveltekit-reload`                                                 | force a full page load (e.g. links to non-Kit pages) |
| `data-sveltekit-replacestate`                                           | `history.replaceState` instead of push               |
| `data-sveltekit-keepfocus`                                              | keep focus on the current element                    |
| `data-sveltekit-noscroll`                                               | do not scroll to top                                 |
| `rel="external"`                                                        | opt out of client routing                            |

Scroll position is restored on back/forward automatically. `onNavigate` + `document.startViewTransition`
gives you View Transitions in ~10 lines (see Kit docs).

## 42. Remote functions (experimental)

Kit 3 ships _remote functions_: type-safe server functions callable from components.

```ts
// src/lib/reports.remote.ts
import { query, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';

export const getReports = query(async () =>
	fetchApi<Report[]>('/reports', { token: getRequestEvent().locals.token })
);
export const createReport = command(v.object({ title: v.string() }), async ({ title }) => {
	/* … */
});
```

```svelte
<script>
	import { getReports, createReport } from '#lib/reports.remote.ts';
</script>

{#each await getReports() as r}…{/each}
```

Requires `sveltekit({ experimental: { remoteFunctions: true }, compilerOptions: { experimental: { async: true } } })`
in `vite.config.ts` and files named `*.remote.ts`. They are an alternative to `load`/`actions`
for highly interactive screens. Since the flag is experimental, this project uses `load` +
`actions` by default; adopt remote functions deliberately and document it in `CLAUDE.md`.

## 43. Adapters and deployment

An adapter turns `.svelte-kit/output` into something a platform runs.

| Adapter                                       | Use                                                                                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sveltejs/adapter-auto` (installed)          | detects Vercel, Netlify, Cloudflare, Azure SWA… at build. Prints "could not detect a supported production environment" for plain servers                         |
| `@sveltejs/adapter-node`                      | Node server (VPS, Docker, PM2). `pnpm add -D @sveltejs/adapter-node`, swap the import, `pnpm build`, `node build` (`PORT`, `ORIGIN`, `BODY_SIZE_LIMIT` env vars) |
| `@sveltejs/adapter-static`                    | fully prerendered site (no actions, no cookies)                                                                                                                  |
| `adapter-vercel` / `-netlify` / `-cloudflare` | platform-specific features                                                                                                                                       |

Docker sketch for adapter-node:

```Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
ENV PORT=3000 ORIGIN=https://app.example.com
EXPOSE 3000
CMD ["node", "build"]
```

Set `ORIGIN` in production so form actions pass the CSRF origin check behind a proxy. Public
env vars that are not `static` are read when the container starts, so one image serves all
environments.

# Part D — Working on this project

## 44. Connecting the real backend

The template ships with a demo login. Replacing it touches three places:

### 1. Login action — exchange credentials for a token

```ts
// src/routes/(guest)/login/+page.server.ts
const res = await fetch(`${API_BASE_URL}/auth/login`, {
	// or fetchApi with a try/catch
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email, password })
});
if (res.status === 401) return fail(401, { error: 'Invalid email or password.' });
if (!res.ok) return fail(502, { error: 'Login service unavailable.' });
const { token } = await res.json();
cookies.set('token', token, {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	maxAge: 60 * 60 * 24 * 7
});
redirect(303, '/dashboard');
```

### 2. Hook — verify the token and load the user

```ts
// src/hooks.server.ts
event.locals.token = token ?? null; // add `token: string | null` to App.Locals
event.locals.user = token ? await getUserFromToken(token, event.fetch) : null;
if (token && !event.locals.user) event.cookies.delete('token', { path: '/' }); // expired → log out
```

`getUserFromToken` lives in `src/lib/server/auth.ts` (server-only). Cache per request only; if
the backend call is expensive, verify a JWT locally and fetch the profile lazily.

### 3. Data access — always from server code

```ts
// in any +page.server.ts / +server.ts
const data = await fetchApi<T>('/path', { fetch, token: locals.token });
```

Decide one error mapping in `fetchApi` (e.g. throw an `ApiError` with `status`) and convert it
to `error(status, …)` / `fail(status, …)` at the call site.

Reminders from §4: guests never get a token; public pages call open endpoints without one; the
token never reaches the browser.

## 45. Recipes

### Protected page with data: `/reports`

```
src/routes/(app)/reports/+page.server.ts
src/routes/(app)/reports/+page.svelte
src/lib/components/Reports/ReportTable.svelte
src/lib/types/report.ts
```

1. `hooks.server.ts` → `PROTECTED_PREFIXES = ['/dashboard', '/reports']`.
2. `Sidebar.svelte` → `{ href: '/reports', label: 'Reports' }`.
3. `CLAUDE.md` → new row in **Business modules**.

```ts
// +page.server.ts
export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const page = Number(url.searchParams.get('page') ?? 1);
	const reports = await fetchApi<Paged<Report>>(`/reports?page=${page}`, {
		fetch,
		token: locals.token
	});
	return { reports, page };
};
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
	import ReportTable from '#lib/components/Reports/ReportTable.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<ReportTable rows={data.reports.items} />
<a href="?page={data.page + 1}">Next</a>
<!-- changing searchParams reruns load automatically -->
```

### Detail page with a dynamic param: `/reports/[id]`

`src/routes/(app)/reports/[id]/+page.server.ts` → `params.id`; `error(404)` when missing.
Add `src/params/integer.ts` and name the folder `[id=integer]` to reject non-numeric ids early.

### Named actions on one page

```ts
export const actions = { save: …, delete: … };
```

```svelte
<form method="POST" action="?/save" use:enhance>…</form>
<form method="POST" action="?/delete" use:enhance>…</form>
```

### Client-only UI store (mobile sidebar)

`src/lib/stores/ui.svelte.ts` as in §23; render the drawer in `(app)/+layout.svelte` behind
`{#if ui.sidebarOpen}`; close it in `afterNavigate(() => (ui.sidebarOpen = false))`.

### Global loading bar

Use `navigating` from `$app/state` in the root layout (§38).

### 404 / error page

`src/routes/+error.svelte` (§35). For a nicer 404 inside the app shell add
`src/routes/(app)/+error.svelte`.

### Public page that needs data (no token)

`src/routes/(guest)/pricing/+page.ts` (universal load is fine for public data):

```ts
export const load: PageLoad = async ({ fetch }) => ({
	plans: await fetchApi<Plan[]>('/public/plans', { fetch })
});
```

### Component that wraps a browser-only library (chart)

```svelte
<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	let { data }: { data: number[] } = $props();
	const chart: Attachment<HTMLCanvasElement> = (canvas) => {
		let instance: Chart;
		import('chart.js/auto').then(({ default: Chart }) => {
			instance = new Chart(canvas, {/* data */});
		});
		return () => instance?.destroy();
	};
</script>

<canvas {@attach chart}></canvas>
```

Dynamic `import()` keeps the library out of the SSR bundle and the initial JS.

### Add an env var

`src/env.ts` → `.env` + `.env.example` → import from `$app/env/public|private` (§39).

### Add an official integration

`pnpm dlx sv add vitest | playwright | drizzle | lucia | paraglide | mdsvex | storybook`.

### Switch to a Node server build

§43.

## 46. Testing

Nothing is installed yet. Recommended setup via the CLI (it edits `vite.config.ts` and adds
scripts):

- `pnpm dlx sv add vitest` — unit tests (`*.test.ts`) and component tests (`*.svelte.test.ts`
  running in a real browser via `vitest-browser-svelte`). Test `fetchApi`, stores, and components
  with props/snippets.
- `pnpm dlx sv add playwright` — end-to-end tests against `pnpm preview`. First test to write:
  the login → dashboard → logout flow from §10.

Keep server `load`/`actions` thin and move logic into `lib/server/*.ts` functions so they can be
unit-tested without HTTP.

## 47. Tooling and debugging

| Task                        | How                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev server                  | `pnpm dev` (`--open`, `--port 5199`, `--host` for LAN)                                                                                            |
| Type check                  | `pnpm check` (`check:watch` while coding). Output lines: `START`, `ERROR "file" line:col "msg"`, `COMPLETED … 0 ERRORS`                           |
| Lint / format               | `pnpm lint`, `pnpm format`                                                                                                                        |
| Regenerate types            | `pnpm exec svelte-kit sync`                                                                                                                       |
| Inspect reactive state      | `$inspect(value)` (dev-only console logging on change), `$inspect(value).with(debugger)`, `$inspect.trace()` inside an effect to see why it reran |
| Where do `console.log`s go? | `load`/`actions`/hooks → **terminal** (server). Component scripts → terminal during SSR **and** browser console after hydration                   |
| VS Code                     | install **Svelte for VS Code** (`svelte.svelte-vscode`) — it is in `.vscode/extensions.json`; enable "format on save" with Prettier               |
| Browser devtools            | Svelte DevTools extension shows component tree and props                                                                                          |
| HMR                         | state is preserved across edits when possible; a full reload happens when a `load` file changes                                                   |
| Inspect built output        | `.svelte-kit/output/{client,server}` after `pnpm build`; `pnpm preview` serves it                                                                 |

## 48. Gotchas

1. **`#lib` imports of `.ts` files need the extension** (`#lib/types/auth.ts`). Extensionless
   imports fail with "Cannot find module". `.svelte`/`.svg` are unaffected.
2. **`Handle`, `HandleFetch`, `HandleServerError`, `sequence` come from `@sveltejs/kit/hooks`**, not `@sveltejs/kit`.
3. **`$env/static/*` and `$env/dynamic/*` do not exist in Kit 3** — `src/env.ts` + `$app/env/public|private`.
4. **`base` / `assets` are gone from `$app/paths`** — use `resolve()` / `asset()`.
5. **Kit config lives in `vite.config.ts`** (`sveltekit({...})`); there is no `svelte.config.js`.
6. **`$effect` never runs on the server.** SSR HTML cannot depend on it.
7. **No module-level `$state` for per-user data** — it is shared across requests on the server.
8. **`redirect()` / `error()` throw.** Do not wrap them in `try/catch` without re-throwing
   (`isRedirect(e)` / `isHttpError(e)` help), and do not write `return redirect(...)` out of habit — harmless but misleading.
9. **`cookies.set` needs `path`** (use `'/'`), and `delete` needs the same path.
10. **Form POST from `curl`/Postman returns JSON** (`{"type":"redirect",...}`) because `Accept: */*`
    negotiates to JSON. Browsers get a 303. Send `Accept: text/html` to see browser behaviour.
11. **`fetch` inside `load` must be the one from the event**, not the global — otherwise cookies
    are not forwarded and SSR responses are not inlined.
12. **`load` data must be serializable** (devalue): no class instances, functions, DOM nodes.
    Return plain data; use `transport` hook for custom classes.
13. **Reading `url` or `params` in a layout `load` makes it rerun on every navigation** that changes them.
14. **Nothing is auto-imported.** Every component/helper/Kit API is an explicit `import`.
15. **Runes mode is forced**: `export let`, `$:`, `on:click`, `<slot>` are errors, not warnings.
16. **Destructuring `$state` objects copies values** and loses reactivity.
17. **Tailwind needs complete class strings** in source; no `bg-${c}-500`.
18. **`page` from `$app/state` throws when read outside rendering on the server** (e.g. in `load`).
    Use `event.url` / `event.locals` there.
19. **Protected routes are protected by `hooks.server.ts`, not by the `(app)` folder.** Both are needed.
20. **A folder with both `+page.svelte` + `actions` and a `+server.ts` `POST`** conflicts — pick one.
21. **`svelte-check` with `skipLibCheck`** also skips your own `app.d.ts`; a broken import there
    fails silently (you will notice because `locals.user` becomes `any`).
22. **`adapter-auto` warns on plain servers** ("Could not detect a supported production
    environment"). It is not an error; switch to `adapter-node` when you deploy.

## 49. Glossary

| Term                         | Meaning                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| **SSR**                      | server-side rendering: HTML produced on the server for the first request                |
| **Hydration**                | the browser attaches Svelte's runtime to server-rendered HTML so it becomes interactive |
| **CSR / SPA navigation**     | subsequent navigations handled in the browser, fetching only data                       |
| **Prerender**                | render a page to static HTML at build time                                              |
| **Rune**                     | compiler keyword starting with `$` that declares reactivity (`$state`, `$derived`, …)   |
| **Signal**                   | the fine-grained reactive primitive under runes; only dependents update                 |
| **Snippet**                  | reusable markup block with parameters; Svelte 5's replacement for slots                 |
| **Attachment**               | `{@attach fn}` — function run with a DOM node when it mounts                            |
| **Action** (Svelte)          | `use:fn` — older form of attachment (`use:enhance`)                                     |
| **Action** (SvelteKit)       | server function handling a form POST (`export const actions`)                           |
| **`load`**                   | function that provides data to a page/layout before it renders                          |
| **Universal vs server load** | `+page.ts` runs on both sides; `+page.server.ts` only on the server                     |
| **`locals`**                 | per-request object set in hooks, read in load/actions                                   |
| **`page.data`**              | merged result of all `load` functions for the current page                              |
| **Route group**              | `(name)` folder that assigns a layout without affecting the URL                         |
| **Matcher**                  | `src/params/x.ts` function validating a `[param=x]`                                     |
| **Invalidation**             | marking a `load` dependency stale so it reruns                                          |
| **Progressive enhancement**  | works without JS, better with JS (`use:enhance`)                                        |
| **Adapter**                  | plugin that packages the build for a hosting platform                                   |
| **devalue**                  | serializer Kit uses for `load` data (supports Date, Map, Set, BigInt, cycles)           |
| **Remote function**          | experimental type-safe server function callable from components                         |
| **`sv`**                     | the official Svelte CLI (`sv create`, `sv add`, `sv check`, `sv migrate`)               |

## 50. i18n and dark mode

### Language — Paraglide JS (official `sv add paraglide`)

Added with `pnpm dlx sv add paraglide="languageTags:en,bn+demo:no"`. What it set up:

| File                                                          | Role                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `messages/en.json`, `messages/bn.json`                        | one flat JSON per locale, same keys. `en` is the base locale                       |
| `project.inlang/settings.json`                                | locales + message file pattern                                                     |
| `vite.config.ts` → `paraglideVitePlugin({ strategy: [...] })` | compiles messages to `src/lib/paraglide/` (git-ignored) on dev/build               |
| `src/hooks.server.ts` → `handleParaglide`                     | `paraglideMiddleware` + fills `%paraglide.lang%` / `%paraglide.dir%` in `app.html` |

```svelte
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
</script>

<h1>{m.welcome_back()}</h1>
```

Messages are typed functions (a typo is a compile error) and unused ones are tree-shaken. Parameters:
`"greeting": "Hello {name}"` → `m.greeting({ name })`. Works in server code too (`+page.server.ts` actions use `m.error_credentials_required()`).

**Strategy = cookie.** `['cookie', 'preferredLanguage', 'baseLocale']`: the locale is stored in the `PARAGLIDE_LOCALE`
cookie, falls back to the browser language, then `en`. We deliberately do **not** use the default URL strategy
(`/bn/dashboard`): `hooks.server.ts` guards by `event.url.pathname.startsWith('/dashboard')`, so a locale prefix would
bypass the auth guard. If you ever switch to URL strategy, de-localize the pathname (`deLocalizeUrl`) before the guard check.

Switching language: `LanguageToggle.svelte` calls `setLocale('bn')` (writes the cookie and reloads so server-rendered text updates).
Adding a language: add the tag to `project.inlang/settings.json`, create `messages/<tag>.json` with every key,
add its label to `LanguageToggle.svelte`, and (for non-Latin scripts) a `@fontsource-variable/*` font in `layout.css`.

### Dark mode — plain Tailwind, no package

1. `layout.css`: `@custom-variant dark (&:where(.dark, .dark *));` and semantic tokens
   (`--color-surface`, `--color-heading`, `--color-field`, `--color-ink-*`, `--color-link` …) with light values in `@theme`
   and dark values overridden in `.dark { … }`. Components use the tokens (`bg-surface`), so most need **no** `dark:` classes.
2. `hooks.server.ts` reads the `theme` cookie into `locals.theme`; `transformPageChunk` replaces `%theme%` in
   `<html class="%theme%">` (`app.html`). The first byte of HTML already has the right class → no flash of light theme.
3. `+layout.server.ts` returns `theme`, so `ThemeToggle.svelte` can initialise from `page.data.theme` and SSR/hydration agree.
4. Toggle: `document.documentElement.classList.toggle('dark')` + `document.cookie = 'theme=…; path=/; max-age=31536000'`.
   (Not httpOnly on purpose — it is a harmless preference the client must write.)
5. Single-colour SVG icons keep a hard-coded stroke, so they get `dark:invert`.

Default is light (the Figma design). To follow the OS setting for first-time visitors, read `prefers-color-scheme`
in an inline script in `app.html` only when no `theme` cookie exists.
