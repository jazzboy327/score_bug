# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev        # Start dev server (http://localhost:5173)
yarn build      # TypeScript compile + Vite build → dist/
yarn lint       # Run ESLint
yarn preview    # Preview production build locally
```

## Environment Setup

Requires a `.env` file with:
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_SUPABASE_AUTH_TOKEN_KEY=sb-[project-ref]-auth-token
```

## Architecture

This is a real-time baseball scoreboard management system built with React 19, TypeScript (strict mode), Vite, Tailwind CSS 4, and Supabase.

### Route Structure (`src/config.ts`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Login` | Authentication entry point |
| `/a` | `AdminPanel` | Manage/list all games |
| `/r` | `GameForm` | Create a new game |
| `/e/:gameId` | `GameForm` | Edit existing game |
| `/c/:gameId` | `ScoreControl` | Live scoring controller |
| `/o/:gameId/a` | `ScoreboardA` | Scoreboard display template A |
| `/o/:gameId/b` | `ScoreboardB` | Scoreboard display template B |

### Data Flow

**Services** (`src/services/`) abstract all Supabase operations:
- `SupabaseGameinfoService` — CRUD for `game_info` table; ordered by `created_at DESC`
- `SupabaseScoreService` — score updates and real-time subscriptions on `scores` table
- `SupabaseAuthorizationService` — authorization checks
- `SupabaeJwtproviderService` — JWT token management and refresh

**Custom Hooks** (`src/hooks/`):
- `userAuth.ts` — validates auth token via `config.auth_token_key`, used to gate protected routes
- `userInfo.ts` — exposes current user information

**Real-time pattern**: Scoreboard components (`ScoreboardA`, `ScoreboardB`) and `ScoreControl` subscribe to Supabase channels for live updates. Subscriptions are set up inside `useEffect` and cleaned up on unmount.

### Key Types (`src/types/scoreboard.ts`)

- `GameInfoRow` — game metadata: team names, colors, logo URLs, font sizes
- `ScoreRow` — live data: inning, ball/strike/out counts, per-inning scores
- `GameInfoWithScore` — combined view used by scoreboards
- Service interfaces define the contract implemented by Supabase services

### Database Tables

- `game_info` — game metadata (teams, colors, logos, font size settings added in v1.5)
- `scores` — live scoring data with real-time enabled

Schema migration for v1.5 is in `database_v1.5_upgrade.sql`.
