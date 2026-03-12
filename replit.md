# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── worktrack/          # Expo React Native mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## WorkTrack Mobile App

**Path**: `artifacts/worktrack/`

A full-featured time tracking mobile app inspired by Toggl/Clockify with monitoring and team features.

### Features

1. **Time Tracker** — Start/stop timer with project, task category, description. Persistent running timer bar.
2. **Manual Entries** — Log time after the fact with duration picker.
3. **Reports** — Daily timesheet, weekly bar chart, project summary with progress bars.
4. **Tasks** — Task management with priority levels, project assignment, due dates, assignees.
5. **Group Chat** — Team chat with rooms (General, Design, Dev, Random). Message bubbles.
6. **Monitor** — Screen time tracking per tab/screen, app background time, AI productivity alerts (fires if >20 min on non-work screen). HR integration ready badge.
7. **Calendar** — Monthly view showing time entries and task due dates per day.

### Architecture

- All data stored in **AsyncStorage** — fully offline capable
- **React Context** (`context/AppContext.tsx`) manages all state with AsyncStorage persistence
- **Expo Router** file-based routing with tabs + formSheet modals
- **NativeTabs** with liquid glass support on iOS 26+

### Key Files

- `app/_layout.tsx` — Root layout with providers (QueryClient, AppProvider, SafeArea, Gesture, Keyboard)
- `app/(tabs)/_layout.tsx` — 6-tab layout (Timer, Reports, Tasks, Chat, Monitor, Calendar)
- `context/AppContext.tsx` — All app state + helpers (formatDuration, isToday, etc.)
- `constants/colors.ts` — Theme palette (navy/blue professional)

### Screens/Routes

- `app/(tabs)/index.tsx` — Timer + today's entries
- `app/(tabs)/reports.tsx` — Reports (daily/weekly/summary)
- `app/(tabs)/tasks.tsx` — Task list
- `app/(tabs)/chat.tsx` — Team chat
- `app/(tabs)/monitor.tsx` — Screen time monitoring
- `app/(tabs)/calendar.tsx` — Calendar view
- `app/timer-running.tsx` — Running timer sheet
- `app/new-entry.tsx` — Manual time entry sheet
- `app/edit-entry.tsx` — Edit existing entry sheet
- `app/new-project.tsx` — Create project sheet
- `app/new-task.tsx` — Create task sheet
