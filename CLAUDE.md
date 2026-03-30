# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Karte** — A React Native (Expo) contact memo app for remembering people you meet.
Stack: Expo SDK 54 / Expo Router v6 / TypeScript / Zustand / AsyncStorage

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Launch on Android
npm run ios        # Launch on iOS (macOS only)
npm run web        # Launch in browser
```

Install packages with `npx expo install <pkg>` (not `npm install`) to ensure SDK-compatible versions.
If a package is unavailable via `expo install`, use `npm install --legacy-peer-deps`.

## Architecture

### Routing (`app/`)
Expo Router file-based routing. All screens live under `app/`.

| Route | Screen |
|-------|--------|
| `app/index.tsx` | Home — person list |
| `app/person/new.tsx` | Add person (modal) |
| `app/person/[id]/index.tsx` | Person detail |
| `app/person/[id]/edit.tsx` | Edit person (modal) |
| `app/person/[id]/log/new.tsx` | Add conversation log (modal) |
| `app/_layout.tsx` | Root layout — loads stores on mount |

### State (`src/store/`)
Two Zustand stores, both backed by AsyncStorage:
- `personStore.ts` — CRUD for `Person` records
- `logStore.ts` — CRUD for `ConversationLog` records + `getByPersonId()` helper

Both stores must be loaded on app start (done in `app/_layout.tsx`).

### Types (`src/types/index.ts`)
`Person` and `ConversationLog` are the two core data shapes.

### Theme (`src/constants/theme.ts`)
All colors, spacing, font sizes, and border radii are defined here. Never hardcode these values inline.
- Accent: `#5B8CFF`
- Background: `#F8F9FB`

### Components (`src/components/`)
Reusable UI parts (PersonCard, LogItem, etc.) and generic UI primitives under `src/components/ui/`.

## UI Conventions
- White base with single accent color `#5B8CFF`
- Large whitespace, minimal information density
- No external UI library — plain `StyleSheet` only
- Icons via `@expo/vector-icons` (bundled with Expo)
- Markdown rendered with `react-native-markdown-display` (display only, no live preview)
