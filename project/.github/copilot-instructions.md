Repository: kariyer_saglik (Expo + Supabase)

Purpose: Help AI coding assistants make focused, safe edits in this Expo (React Native + expo-router) app that is tightly integrated with Supabase.

Quick context
- App: Expo + expo-router (see `package.json` main `expo-router/entry` and `app/` routes).
- Backend: Supabase for auth, Postgres (RLS), storage and realtime (see `lib/supabase.ts`, `lib/realtime.ts`, `lib/queries.ts`).
- Auth: Centralized in `contexts/AuthContext.tsx` and consumed via `useAuth()` (see `hooks/useAuth.ts`).

What to prioritize
- Preserve Supabase configuration flow: prefer environment variables `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `lib/supabase.ts`). If missing, do not hardcode secrets — use Constants or placeholder behavior that won't leak keys.
- Respect platform differences: auth/storage use `AsyncStorage` on native and `localStorage` on web. Check `Platform.OS` before changing storage logic.
- Keep RLS expectations: many `test-*.js` scripts check for RLS. Avoid changes that assume open DB access.

Conventions & patterns (concrete examples)
- Data access: all DB reads/writes go through `lib/queries.ts` (e.g. `getUserProfile`, `createPost`, `sendPrivateMessage`). Add new queries there and keep controller logic minimal in components.
- Realtime: subscriptions are centrally managed in `lib/realtime.ts` (`realtimeManager.subscribeToChatRoom(...)`). Use that instead of creating ad-hoc channels.
- Auth lifecycle: `AuthProvider` performs initial session check via `supabase.auth.getSession()` and listens via `supabase.auth.onAuthStateChange`. Any change to auth flow must preserve the session clearing & AsyncStorage cleanup logic in `contexts/AuthContext.tsx`.
- Routing: follow expo-router file-based routes under `app/`. New screens must be added under `app/` and exported as route files.

Developer workflows (how to run/test locally)
- Start dev server: `npm run dev` (runs `expo start`). For native testing use Expo Go or simulators. For web: `npm run build:web` exports web build.
- Quick Supabase integration checks: `node test-supabase.js` or `node test-comprehensive.js` (requires `.env` with EXPO_PUBLIC_SUPABASE_* keys). These scripts are useful to validate RLS, storage and edge functions.

Safe edit rules for AI
- Never commit or print actual secret values. If a secret is missing, log a clear warning and fall back to non-sensitive placeholders (see `lib/supabase.ts` pattern).
- When modifying DB queries, keep `.select()` shapes explicit and avoid returning `*` from tables that include private fields (profiles contain `is_blocked`, `phone`, etc.). Prefer existing join patterns used in `lib/queries.ts`.
- Preserve explicit `is('deleted_at', null)` soft-delete checks used for posts and messages.
- When adding realtime listeners, use `realtimeManager` to avoid duplicate subscriptions and to allow centralized unsubscribe handling.

Where to look for examples
- Auth flow: `contexts/AuthContext.tsx`
- Supabase client setup: `lib/supabase.ts`
- Queries & DB patterns: `lib/queries.ts`
- Realtime channels: `lib/realtime.ts`
- Expo routing + layout: `app/_layout.tsx` and `app/(tabs)/` folder
- Tests & integration checks: `test-supabase.js`, `test-comprehensive.js`

If you change behavior that affects other areas
- Update `lib/queries.ts` and add a small unit-like JS script in `test-*.js` to validate DB access patterns.
- Run `node test-supabase.js` locally (with env vars) and ensure no RLS failures are introduced.

When unsure, ask
- If a change touches auth/session persistence, confirm how web vs mobile should behave (AsyncStorage vs localStorage) and whether clearing tokens is acceptable.

Keep this file concise and update with new conventions as the repo evolves.
