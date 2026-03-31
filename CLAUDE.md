# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Recall** — A React Native (Expo) contact memo app for remembering people you meet.
Stack: Expo SDK 54 / Expo Router v6 / TypeScript / Zustand / AsyncStorage
Bundle ID: `com.shoas.recall` | EAS Project ID: `b8f37e38-cd06-4d24-8deb-d34c81475269`

## Commands

```bash
npm start              # Start Expo dev server (use --clear to reset Metro cache)
npm run android        # Launch on Android
npm run ios            # Launch on iOS (macOS only)
npm run web            # Launch in browser
npx tsc --noEmit       # TypeScript type check
eas build --platform ios --profile production  # Production build
```

Install packages with `npx expo install <pkg>` to ensure SDK-compatible versions.
If unavailable via `expo install`, use `npm install --legacy-peer-deps`.

## Architecture

### Routing (`app/`)
Expo Router file-based routing. Entry point is `expo-router/entry` (defined in `package.json`).

| Route | Screen |
|-------|--------|
| `app/index.tsx` | Home — person list with search and tag filter |
| `app/settings.tsx` | Settings — notification time, JSON/CSV export, JSON import |
| `app/schedule/new.tsx` | Add schedule (modal) |
| `app/person/new.tsx` | Add person (modal) |
| `app/person/[id]/index.tsx` | Person detail with conversation logs |
| `app/person/[id]/edit.tsx` | Edit person with next-meeting date (modal) |
| `app/person/[id]/log/new.tsx` | Add conversation log (modal) |
| `app/person/[id]/log/[logId].tsx` | Edit conversation log (modal) |
| `app/_layout.tsx` | Root layout — font loading, store init, notification permission, app splash |

### State (`src/store/`)
Three Zustand stores, all backed by AsyncStorage:
- `personStore.ts` — CRUD + `bulkSet` for `Person` records
- `logStore.ts` — CRUD + `bulkSet` + `removeByPersonId` + `getByPersonId` for `ConversationLog`
- `scheduleStore.ts` — CRUD + `bulkSet` for `Schedule` records

Call store actions via `usePersonStore.getState().method()` inside `useEffect` (not as hooks) to avoid "maximum update depth" errors. Subscribe only to state values (`s.persons`, `s.logs`) and derive data in `useMemo`.

### Types (`src/types/index.ts`)
`Person`, `ConversationLog`, and `Schedule` are the three core data shapes.
- `Person.tags` is always `string[]` (never undefined — migration handled in `load()`)
- `Person.nextMeetingDate` — optional ISO date string for reminder
- `Person.nextMeetingNotificationId` — expo-notifications identifier for cancellation
- `Schedule.notificationId` — expo-notifications identifier for cancellation

### Theme (`src/constants/theme.ts`)
All colors, spacing, font sizes, and border radii are defined here. Never hardcode these values inline.
- Accent: `#5B8CFF` | Background: `#F8F9FB`
- `FontSize.xs=12, sm=14, md=16, lg=20` | `Spacing.xs=4, sm=8, md=16, lg=24`

### Components (`src/components/`)
| Component | Purpose |
|-----------|---------|
| `PersonCard` | List item with avatar, name, meta, last-met date, tags |
| `PersonForm` | Create/edit person form with photo picker, TagInput, next-meeting date picker |
| `TagInput` | Tag chip input with suggestion autocomplete |
| `LogCard` | Conversation log list item |
| `LogForm` | Create/edit conversation log with date picker |
| `AppSplash` | In-app animated splash screen (shown after font load) |

### Fonts
`CormorantGaramond_600SemiBold` from `@expo-google-fonts/cormorant-garamond` is used for the "Recall" header title and splash screen. Font loading is handled in `_layout.tsx` with `SplashScreen.preventAutoHideAsync/hideAsync`.

### Notifications (`src/utils/notifications.ts`)
- Uses `expo-notifications`
- Notification time preference stored in AsyncStorage (`recall_notify_hour`, default: 21)
- `scheduleNextMeetingNotification` — triggered from `person/[id]/edit.tsx` when saving nextMeetingDate
- `scheduleAppointmentNotification` — triggered from `schedule/new.tsx`
- Both schedule a notification for the **day before** at the user's chosen hour
- Cancel via `cancelNotification(id)` when removing a person or clearing a date

### Backup (`src/utils/backup.ts`)
- Uses `expo-file-system/legacy` (NOT `expo-file-system` — v19 changed the API, `cacheDirectory` moved to legacy)
- `exportJson` / `exportCsv` write to `FileSystem.cacheDirectory` then call `Sharing.shareAsync`
- `importJson` uses `DocumentPicker` to select a file, then deduplicates by ID

## UI Conventions
- White base with single accent color `#5B8CFF`
- Large whitespace, minimal information density
- No external UI library — plain `StyleSheet` only
- Icons via `@expo/vector-icons` (bundled with Expo)
- Markdown rendered with `react-native-markdown-display` (display only, no live preview)
- Minimum tap target: 44×44 for all interactive elements

## Release Info
- Version: 1.0.0 | Build: 1
- Privacy policy: `docs/privacy-policy.md`
- App Store description: `docs/app-store-description.md`
