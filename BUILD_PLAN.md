# Milestone Flutter App — Complete Build Plan

## 1. Overview

Convert the existing Milestone (Spring Boot + React SPA) into a **standalone Android Flutter app** with SQLite local storage. No backend, no hosting — just a single APK that can be shared and installed directly.

### Auth flow

On first launch (or after logout) the user sees a **welcome screen** with two options:
- **Continue with Google** — displays their Google avatar + display name + email on the Profile tab
- **Continue as Guest** — shows an initial-letter avatar, no email, display name defaults to "Guest" (editable)

Chosen mode is saved to a `user_prefs` SQLite table so the user isn't prompted again on subsequent launches.

| Auth mode | Avatar | Email shown | Default name |
|---|---|---|---|
| Guest | Initial letter on purple background | ❌ No | "Guest" |
| Google | Initial letter on default background | ✅ `user@milestone.app` | "Milestone User" |

### Design decisions from design preview

| Feature | Behavior |
|---|---|
| **Theme picker** | Bottom sheet with 6 themes (Midnight, Charcoal, Obsidian, Deep Navy, Slate, Cream). All colors driven by CSS variables for instant switching. |
| **Achievements** | Bottom sheet grid (2×4) showing 8 achievements with earned/locked states. 4 sample achievements pre-unlocked. |
| **Goal edit/delete** | `more_vert` dropdown in journey detail header → "Edit Goal" opens pre-filled form, "Delete Goal" shows M3 confirmation dialog. |
| **Task inline edit** | Task title is `contenteditable` — tap to edit, Enter to save. |
| **Task delete** | Hover-to-reveal `close` (X) button on each task row. |
| **Task add** | "Add a task…" input at bottom of milestone body — press Enter to create. |
| **Delete confirmation** | Centered M3 dialog: "Delete Goal? This will also remove all milestones and tasks." [Cancel] [Delete]. |
| **Tab spacing** | 16px gap between header and content on Journey, Roadmap, Momentum tabs. |
| **Difficulty levels** | Easy, Medium, Hard, **Epic** (was "Insane"). |
| **Profile settings** | Items: Achievements, Theme, Reminders (toggle), Export Data, Share Milestone, About. "Edit Profile" and "My Stats" removed — avatar/name edit is inline. |

### What changes

| From (existing) | To (Flutter app) |
|---|---|
| Spring Boot backend (REST API) | ❌ Removed |
| H2 / MySQL database | ✅ SQLite (on-device) |
| React SPA (Vite) | ✅ Flutter (Dart) |
| JWT auth (register/login with username+password) | ✅ Google / Guest auth screen (local only) |
| Remote API calls (`fetch()`) | Local DB queries (`sqflite`) |
| React Context + local state | ✅ Provider (ChangeNotifier) |
| SVG serpentine (inline SVG) | ✅ CustomPainter |
| framer-motion animations | ✅ Flutter AnimationController |
| 3 env vars (JWT, CORS, URL) | ❌ None needed |

---

## 2. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Flutter SDK | >=3.24 (latest stable) | `flutter doctor` must pass |
| Android Studio | Ladybug or newer | For emulator & build tools |
| Java | 17+ (bundled with AS) | For Android Gradle plugin |
| Android SDK | 34-35 | Installed via SDK Manager |
| Target device | Android 5.0+ (API 21) | Wide compatibility |

---

## 3. Project Structure (28 files)

```
milestone_app/
├── android/                                  # Auto-generated, minimal edits
├── lib/
│   ├── main.dart                             # Entry point: init DB, run App
│   ├── app.dart                              # MaterialApp, theme, providers, routes
│   │
│   ├── models/                               # Data classes with toMap/fromMap
│   │   ├── goal.dart
│   │   ├── milestone.dart
│   │   ├── task.dart
│   │   └── goal_event.dart
│   │
│   ├── database/
│   │   └── database_helper.dart              # Singleton: open/create DB, 4 tables
│   │
│   ├── repositories/                         # CRUD operations per entity
│   │   ├── goal_repository.dart
│   │   ├── milestone_repository.dart
│   │   ├── task_repository.dart
│   │   └── event_repository.dart
│   │
│   ├── providers/
│   │   └── goal_provider.dart                # ChangeNotifier: goals, active goal, all mutations
│   │
│   ├── utils/
│   │   └── progress_utils.dart               # goalProgress, nextMilestone, daysUntil, streak, serpentine math
│   │
│   ├── theme/
│   │   └── app_theme.dart                    # Dark theme (#0b1020), difficulty colors, text styles
│   │
│   ├── screens/
│   │   ├── splash_screen.dart                # Brand logo + loading → auto-navigate
│   │   ├── auth_screen.dart                  # Google / Guest welcome screen
│   │   ├── dashboard_screen.dart             # Goal list (scrollable) + FAB
│   │   ├── goal_detail_screen.dart           # TabBar (Journey / Roadmap / Momentum)
│   │   └── goal_form_screen.dart             # Create/edit modal (title, why, difficulty, date)
│   │
│   └── widgets/
│       ├── journey_map_widget.dart           # CustomPainter serpentine path + milestone nodes
│       ├── milestone_card.dart               # Expandable: title, status, weight, task list, reorder
│       ├── confetti_widget.dart              # Animated particle burst (~2s)
│       ├── finish_overlay.dart               # Full-screen "Goal complete!" celebration
│       ├── stat_card.dart                    # Metric card (value + label)
│       ├── brand_widget.dart                 # Milestone logo
│       └── empty_state_widget.dart           # "No goals yet" placeholder
│
├── assets/                                   # Logo SVG, optional fonts
│
├── test/
│   ├── models/                               # Unit tests for toMap/fromMap
│   ├── repositories/                         # Unit tests with in-memory DB
│   └── providers/                            # Provider behavior tests
│
├── pubspec.yaml
├── analysis_options.yaml
└── README.md
```

---

## 4. Data Model & Database Schema

### 4.1 Entity Relationships

```
Goal (1) ──< Milestone (N) ──< Task (N)
  └──< GoalEvent (N)
```

### 4.2 SQLite Tables

```sql
CREATE TABLE user_prefs (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Pre-populated rows:
--   ('auth_mode', 'guest' | 'google')
--   ('display_name', 'Guest' | 'Milestone User')
--   ('auth_email', '' | 'user@milestone.app')

CREATE TABLE goals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  why         TEXT    NOT NULL,
  difficulty  TEXT    NOT NULL DEFAULT 'medium',   -- easy|medium|hard|insane
  target_date TEXT,                                 -- ISO date (yyyy-MM-dd) or null
  created_at  TEXT    NOT NULL                      -- ISO datetime
);

CREATE TABLE milestones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id     INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'todo',      -- todo|active|done
  weight      INTEGER NOT NULL DEFAULT 1,           -- 1-5
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);

CREATE TABLE tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  done         INTEGER NOT NULL DEFAULT 0,          -- 0|1
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL
);

CREATE TABLE goal_events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  ts      TEXT    NOT NULL,                          -- ISO datetime
  text    TEXT    NOT NULL
);
```

### 4.3 Flutter Models (each file ~40-50 lines)

Each model is a Dart class with:
- Named constructor `fromMap(Map<String, dynamic> map)`
- Method `Map<String, dynamic> toMap()`
- Property `id` (nullable `int?` for new records, non-null `int` after insert)

---

## 5. Data Layer

### 5.1 DatabaseHelper (`database_helper.dart`)

```dart
class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  Future<Database> get database async {
    _database ??= await _initDB();
    return _database!;
  }

  Future<Database> _initDB() async {
    final dir = await getApplicationDocumentsDirectory();
    final path = join(dir.path, 'milestone.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('PRAGMA foreign_keys = ON');
    await db.execute('''CREATE TABLE goals (...)''');
    await db.execute('''CREATE TABLE milestones (...)''');
    await db.execute('''CREATE TABLE tasks (...)''');
    await db.execute('''CREATE TABLE goal_events (...)''');
  }
}
```

- Singleton pattern
- DB file: `milestone.db` in app documents directory
- Foreign keys enabled via `PRAGMA foreign_keys = ON`
- Version 1 schema

### 5.2 Repositories (each ~60-100 lines)

Each repository receives `DatabaseHelper.instance.database`:

| Repository | Key Methods |
|---|---|
| `GoalRepository` | `getAll()`, `getById(id)`, `create(goal)`, `update(goal)`, `delete(id)` |
| `MilestoneRepository` | `getByGoal(goalId)`, `create(milestone)`, `update(milestone)`, `delete(id)`, `reorder(id, dir)` |
| `TaskRepository` | `getByMilestone(milestoneId)`, `create(task)`, `update(task)`, `delete(id)`, `toggle(id)` |
| `EventRepository` | `getByGoal(goalId, limit?)`, `create(event)`, `deleteByGoal(goalId)` |

**Milestone reorder logic** (in `moveMilestone`):
```dart
// Fetch all milestones for this goal ordered by position
// Find the milestone to swap with (above or below)
// Swap their position values in a transaction
final targetId = dir == 'up' ? above.id : below.id;
await db.transaction((txn) async {
  await txn.update('milestones', {'position': targetPos}, where: 'id = ?', whereArgs: [milestoneId]);
  await txn.update('milestones', {'position': currentPos}, where: 'id = ?', whereArgs: [targetId]);
});
```

---

## 6. State Management (Provider)

### 6.1 GoalProvider (`goal_provider.dart`)

```dart
class GoalProvider extends ChangeNotifier {
  final GoalRepository _goalRepo;
  final MilestoneRepository _milestoneRepo;
  final TaskRepository _taskRepo;
  final EventRepository _eventRepo;

  List<Goal> _goals = [];
  Goal? _activeGoal;
  List<Milestone> _milestones = [];
  Map<int, List<Task>> _tasksByMilestone = {};
  List<GoalEvent> _events = [];
  bool _isLoading = false;

  // Computed properties
  double get activeGoalProgress => ...;  // 0.0 - 1.0
  String? get nextMilestoneTitle => ...;
  int? get daysUntilTarget => ...;
  int get streak => ...;  // consecutive active days

  // Goal CRUD
  Future<void> loadGoals();
  Future<void> createGoal(title, why, difficulty, targetDate);
  Future<void> updateGoal(id, title, why, difficulty, targetDate);
  Future<void> deleteGoal(id);
  void setActiveGoal(int id);

  // Milestone CRUD
  Future<void> addMilestone(goalId, title, weight);
  Future<void> updateMilestone(id, {title?, status?, weight?});
  Future<void> deleteMilestone(id);
  Future<void> moveMilestone(id, dir);  // 'up' | 'down'
  void cycleMilestoneStatus(id);  // todo→active→done→todo

  // Task CRUD
  Future<void> addTask(milestoneId, title);
  Future<void> toggleTask(id);
  Future<void> deleteTask(id);

  // Events
  Future<void> addEvent(goalId, text);
}
```

### 6.2 Provider Tree (in `app.dart`)

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => GoalProvider()),
  ],
  child: MaterialApp(...),
)
```

---

## 7. Screen-by-Screen Specifications

### 7.1 SplashScreen

| Element | Detail |
|---|---|
| Layout | Centered vertical column |
| Content | `BrandWidget` (logo) + CircularProgressIndicator |
| Behavior | On build, calls `provider.loadGoals()`, checks `user_prefs` for `auth_mode` key. If exists → navigate to `DashboardScreen`. If not → navigate to `AuthScreen`. |
| Transition | Replace (not push) — no going back |
| Duration | ~1s minimum for branding |

### 7.2 AuthScreen

| Element | Detail |
|---|---|
| Layout | Centered column with logo + tagline + two buttons |
| Content | Logo, "Milestone" title, "Reach the finish line" subtitle, two buttons |
| Google button | White pill with Google G icon + "Continue with Google" text. Sets `auth_mode='google'`, `display_name='Milestone User'`, `auth_email='user@milestone.app'` in `user_prefs`. |
| Guest button | Outline pill with "Continue as Guest" text. Sets `auth_mode='guest'`, `display_name='Guest'`, `auth_email=''` in `user_prefs`. |
| Profile impact | Google mode → shows email + initial avatar. Guest mode → hides email, shows initial on purple background, name defaults to "Guest". |
| Transition | Replace (not push) — no going back to auth once chosen |
| Data persistence | Both choices saved to `user_prefs` table so re-launch skips auth |

### 7.3 DashboardScreen

| Element | Detail |
|---|---|
| AppBar | Title: "Milestone", Actions: none |
| Body | `Consumer<GoalProvider>` — if empty → `EmptyStateWidget` |
| Goal List | `ListView.builder` — each item is a `GoalCard` |
| GoalCard | Title, progress bar (`LinearProgressIndicator`), difficulty badge (colored chip), days left |
| Tap | → `GoalDetailScreen` with that goal as active |
| Long-press | Context menu: Edit, Delete |
| FAB | `+` icon → `GoalFormScreen` in create mode |
| EmptyState | Illustration + "Create your first goal" button |

### 7.4 GoalDetailScreen

| Element | Detail |
|---|---|
| AppBar | Goal title, overflow menu (Edit, Delete) |
| TabBar | 3 tabs: Journey, Roadmap, Momentum |
| Body | `TabBarView` with 3 children (see below) |

#### 7.4.1 JourneyTab

| Element | Detail |
|---|---|
| Stats Row | Row of 3 `StatCard`s: Progress (%), Days Left, Next Up |
| JourneyMap | `JourneyMapWidget` — takes remaining screen space |
| Scroll | Entire tab is scrollable (stats + map) |

#### 7.4.2 RoadmapTab

| Element | Detail |
|---|---|
| Milestone List | `ListView` of `MilestoneCard` widgets |
| Add Button | Bottom button "Add Milestone" → dialog for title + weight |
| Empty | "No milestones yet" placeholder |

#### 7.4.3 MomentumTab

| Element | Detail |
|---|---|
| Streak Card | Current streak (consecutive days with activity) |
| Pacing Card | "On track" / "Behind" based on progress vs. elapsed time |
| Timeline | `ListView` of events in reverse chronological order |
| Each event | Icon + timestamp + description text |

### 7.5 GoalFormScreen

| Element | Detail |
|---|---|
| AppBar | Title: "New Goal" or "Edit Goal" |
| Title Field | `TextFormField`, required, max 100 chars |
| Why Field | `TextFormField`, required, multiline (3-4 lines), max 500 chars |
| Difficulty | `DropdownButtonFormField`: Easy / Medium / Hard / Insane |
| Target Date | `TextFormField` with `DatePicker` on tap, or null for "No deadline" |
| Save Button | Validates form, calls provider, pops screen |
| Cancel | Back button or X |

---

## 8. Widget Specifications

### 8.1 JourneyMapWidget

| Aspect | Detail |
|---|---|
| Rendering | `CustomPainter` extending `CustomPainter` |
| Path | Smooth serpentine using `Path.cubicTo()` (ported math from `serpentine.js`) |
| Milestone Nodes | Positioned along path by their `position` index |
| Visual states | todo: grey circle, active: accent color + glow, done: green + checkmark |
| Selected node | Larger, brighter, with label |
| Interaction | `GestureDetector` on each node → `onTap` callback |
| Size | Constrained by parent, aspect ratio ~3:4 (tall) |

Serpentine path algorithm (port of existing math):
```dart
// Given canvas height and number of milestones, calculate control points
// so the path snakes back and forth in an S-curve down the canvas.
void paint(Canvas canvas, Size size) {
  final path = Path();
  final startX = size.width * 0.5;
  final startY = 40.0;
  final segmentHeight = (size.height - 80) / milestones.length;
  path.moveTo(startX, startY);

  for (int i = 0; i < milestones.length; i++) {
    final isRight = i % 2 == 0;
    final cp1x = isRight ? size.width * 0.2 : size.width * 0.8;
    final cp2x = isRight ? size.width * 0.2 : size.width * 0.8;
    final endX = isRight ? size.width * 0.2 : size.width * 0.8;
    final endY = startY + segmentHeight * (i + 1);
    path.cubicTo(
      cp1x, startY + segmentHeight * 0.3,
      cp2x, startY + segmentHeight * 0.7,
      endX, endY,
    );
  }
  canvas.drawPath(path, paint);
}
```

### 8.2 MilestoneCard

| Element | Detail |
|---|---|
| Header | Title + Status badge (colored pill) + Weight indicator (★ × weight) |
| Status cycles | Tap badge → todo→active→done→todo |
| Expand | Animated expansion with `AnimatedCrossFade` or `ExpansionTile` |
| Expanded body | Task list |
| Reorder | Small ↑↓ buttons on right |
| Task checkbox | `CheckboxListTile` — toggle calls `provider.toggleTask()` |
| Add task | `TextField` at bottom of list + submit via `onSubmitted` |
| Delete milestone | Swipe-to-dismiss or icon button in header |
| Colors | Status: todo=#6b7280(slate), active=#3b82f6(blue), done=#22c55e(green) |

### 8.3 ConfettiWidget

| Aspect | Detail |
|---|---|
| Trigger | When `progress > prevProgress` and `progress > 0` |
| Duration | ~2.2 seconds (matching current app) |
| Implementation | 2 options: (a) `confetti_widget` package, (b) custom `AnimatedWidget` with 30-50 random particles |
| Particles | Small colored rectangles/circles, random initial velocity, gravity, fade out |
| Position | Full-screen overlay, pointer-events: none |

### 8.4 FinishOverlay

| Aspect | Detail |
|---|---|
| Trigger | When `progress` reaches 1.0 from < 1.0 |
| Content | Large "🎉" emoji, "Goal Complete!", goal title, "Close" button |
| Backdrop | Semi-transparent black overlay |
| Animation | Scale + fade in |

### 8.5 StatCard

```dart
Card(
  child: Column(
    children: [
      Text(value, style: headline4),  // e.g. "67%"
      Text(label, style: caption),    // e.g. "Progress"
    ],
  ),
)
```

- If `value` is null, shows "—"

---

## 9. Theme & Styling

### 9.1 Color Palette

```
Background:      #0b1020  (very dark navy)
Surface:         #1a1f2e  (card background)
Primary:         #6366f1  (indigo, accent)
Text primary:    #f1f5f9
Text secondary:  #94a3b8

Difficulty:
  Easy:          #22c55e  (green)
  Medium:        #eab308  (yellow)
  Hard:          #ef4444  (red)
  Insane:        #a855f7  (purple)

Status:
  todo:          #6b7280  (slate)
  active:        #3b82f6  (blue)
  done:          #22c55e  (green)
```

### 9.2 AppTheme (`app_theme.dart`)

```dart
ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF0b1020),
  colorScheme: ColorScheme.dark(
    primary: const Color(0xFF6366f1),
    surface: const Color(0xFF1a1f2e),
  ),
  cardTheme: CardTheme(
    color: const Color(0xFF1a1f2e),
    elevation: 2,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF0b1020),
    elevation: 0,
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: Color(0xFF0b1020),
    selectedItemColor: Color(0xFF6366f1),
    unselectedItemColor: Color(0xFF64748b),
  ),
)
```

---

## 10. Utils: Progress Calculations

### 10.1 `progress_utils.dart` (ported from existing `frontend/src/utils/progress.js`)

| Function | Input | Output | Description |
|---|---|---|---|
| `goalProgress(goal, milestones, tasks)` | Goal + children | `double` (0.0-1.0) | Weighted progress: done milestones count fully, active milestones get partial credit from completed tasks |
| `nextMilestone(milestones)` | Milestone list | `Milestone?` | First milestone with status != 'done' |
| `daysUntil(targetDate)` | ISO date string | `int?` | Days from today to target (positive = future, negative = past, null = no date) |
| `calculatePacing(progress, daysUntil)` | double, int? | `Pacing` enum (ahead/on_track/behind) | Compares actual progress vs. expected progress (elapsed / total duration) |

### 10.2 Key Math: `goalProgress`

```dart
double goalProgress(List<Milestone> milestones, Map<int, List<Task>> tasksByMilestone) {
  if (milestones.isEmpty) return 0.0;
  final totalWeight = milestones.fold<int>(0, (sum, m) => sum + m.weight);
  if (totalWeight == 0) return 0.0;

  double completed = 0;
  for (final m in milestones) {
    if (m.status == 'done') {
      completed += m.weight;
    } else if (m.status == 'active') {
      final ts = tasksByMilestone[m.id] ?? [];
      if (ts.isNotEmpty) {
        final doneCount = ts.where((t) => t.done).length;
        completed += m.weight * (doneCount / ts.length);
      }
    }
  }
  return completed / totalWeight;
}
```

---

## 11. pubspec.yaml Dependencies

```yaml
name: milestone_app
description: Milestone — Turn big goals into a visual journey.
version: 1.0.0

environment:
  sdk: ^3.5.0

dependencies:
  flutter:
    sdk: flutter
  sqflite: ^2.4.0
  path_provider: ^2.1.5
  path: ^1.9.1
  provider: ^6.1.5
  intl: ^0.20.0
  share_plus: ^10.1.4
  url_launcher: ^6.3.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  mockito: ^5.4.5
  sqflite_common_ffi: ^2.3.4   # For unit testing repositories without emulator

flutter:
  uses-material-design: true
  assets:
    - assets/
```

---

## 12. Navigation & Route Map

```
SplashScreen
  │  (auto after DB init, check user_prefs)
  ├──► (auth_mode exists) ─────────────────► DashboardScreen
  │
  └──► AuthScreen (first launch)
        │  Continue with Google → save prefs
        │  Continue as Guest    → save prefs
        ▼
      DashboardScreen
        │  tap goal card
        ├──► GoalDetailScreen (Journey tab default)
        │     │  switch tab
        │     ├──► RoadmapTab (milestone/task CRUD)
        │     │  tap "Add Milestone" → showModalBottomSheet
        │     │  tap milestone → expand inline
        │     │
        │     └──► MomentumTab (history log)
        │
        │  tap FAB
        └──► GoalFormScreen (create)
              │  save → pop
              └──► DashboardScreen (updated)

GoalDetailScreen → AppBar menu → GoalFormScreen (edit)
                                 → Delete confirm dialog → pop to DashboardScreen
```

All navigation uses `Navigator.push()` / `Navigator.pop()`. No named routes.

---

## 13. Implementation Phases (8 phases)

### Phase 1: Project Scaffold & Data Layer (~1 hour)
- [ ] `flutter create milestone_app`
- [ ] Edit `pubspec.yaml` with dependencies
- [ ] Create `lib/models/` — 4 model files + `user_prefs.dart` with `toMap()`/`fromMap()`
- [ ] Create `lib/database/database_helper.dart` — singleton, schema (5 tables), CRUD helpers
- [ ] Create `lib/repositories/` — 4 entity repos + `user_prefs_repository.dart`
- [ ] **Verify:** Unit tests pass for models and repositories (in-memory DB)

### Phase 2: State Management (~30 min)
- [ ] Create `lib/providers/goal_provider.dart`
- [ ] Create `lib/utils/progress_utils.dart` — all calculation functions
- [ ] **Verify:** Widget test renders `MaterialApp` with provider

### Phase 3: Theme & Scaffold (~30 min)
- [ ] Create `lib/theme/app_theme.dart`
- [ ] Create `lib/app.dart` — `MaterialApp` with theme + providers
- [ ] Create `lib/main.dart` — entry point
- [ ] Create `lib/widgets/brand_widget.dart`
- [ ] **Verify:** App runs on emulator, shows dark theme

### Phase 4: Core Screens (~2.5 hours)
- [ ] `lib/screens/splash_screen.dart` — check user_prefs, route accordingly
- [ ] `lib/screens/auth_screen.dart` — Google + Guest buttons, save to user_prefs
- [ ] `lib/screens/dashboard_screen.dart` — goal list + FAB
- [ ] `lib/screens/goal_form_screen.dart` — create/edit form
- [ ] `lib/widgets/empty_state_widget.dart`
- [ ] **Verify:** Fresh install shows auth screen, Google/Guest saves prefs, re-launch skips auth. Can create a goal, see it in list, edit, delete.

### Phase 5: Goal Detail & Roadmap (~2 hours)
- [ ] `lib/screens/goal_detail_screen.dart` — TabBar + 3 tabs
- [ ] `lib/widgets/milestone_card.dart` — expandable, task CRUD
- [ ] Wire up: add milestone, add task, toggle task, delete task, reorder
- [ ] **Verify:** Full milestone + task CRUD works on emulator

### Phase 6: Journey Map (~2 hours)
- [ ] `lib/widgets/journey_map_widget.dart` — CustomPainter
- [ ] Port serpentine path math from `serpentine.js`
- [ ] Milestone node rendering with status colors
- [ ] Touch interaction (tap to select)
- [ ] **Verify:** Serpentine path renders with milestone nodes, tap selects

### Phase 7: Animations & Polish (~1.5 hours)
- [ ] `lib/widgets/confetti_widget.dart` (or use package)
- [ ] `lib/widgets/finish_overlay.dart`
- [ ] `lib/widgets/stat_card.dart`
- [ ] Momentum tab with history log + streak
- [ ] **Verify:** Confetti plays when toggling tasks, completion overlay shows

### Phase 8: Build & Distribution (~30 min)
- [ ] Run `flutter analyze` — fix all issues
- [ ] Run `flutter test` — all tests pass
- [ ] `flutter build apk --debug` — verify on emulator
- [ ] `flutter build apk --split-per-abi` — release APKs
- [ ] Copy APKs to `build/output/`
- [ ] **Output:** `app-armeabi-v7a-release.apk`, `app-arm64-v8a-release.apk`, `app-x86_64-release.apk`

---

## 14. Build Output

```bash
# Debug (quick test)
flutter build apk --debug
# → build/app/outputs/flutter-apk/app-debug.apk (~65 MB)

# Release — split per CPU architecture (recommended)
flutter build apk --split-per-abi
# → build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk  (~12 MB, old devices)
# → build/app/outputs/flutter-apk/app-arm64-v8a-release.apk    (~14 MB, modern devices)
# → build/app/outputs/flutter-apk/app-x86_64-release.apk       (~16 MB, emulators)

# Release — universal (single file, larger)
flutter build apk
# → build/app/outputs/flutter-apk/app-release.apk (~35 MB)
```

Share `app-arm64-v8a-release.apk` (covers ~95% of modern Android devices).

---

## 15. Android Configuration

### `android/app/build.gradle.kts` changes:

```kotlin
android {
    namespace = "com.milestone.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.milestone.app"
        minSdk = 21
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
}
```

### App Icon:
- Use `flutter_launcher_icons` package or manually place icons in `android/app/src/main/res/mipmap-*`
- Reuse existing `pwa-512.svg` as base for the icon

---

## 16. Testing Strategy

| Layer | Tool | Tests |
|---|---|---|
| Models | `flutter_test` | `toMap()/fromMap()` round-trip, null handling |
| Repositories | `flutter_test` + `sqflite_common_ffi` | CRUD operations, cascade delete, reorder swap |
| Provider | `flutter_test` | `loadGoals`, `createGoal`, CRUD triggers listener |
| Widgets | `flutter_test` + `WidgetTester` | Each widget renders without error, tap handlers work |
| Integration | Manual on emulator | Full flow: create goal → add milestones → add tasks → toggle → complete |

---

## 17. File-by-File Implementation Checklist

| # | File | Approx Lines | Description |
|---|---|---|---|
| 1 | `milestone_app/` | — | `flutter create` scaffold |
| 2 | `pubspec.yaml` | 40 | Dependencies + assets config |
| 3 | `analysis_options.yaml` | 20 | Lint rules |
| 4 | `lib/main.dart` | 15 | `WidgetsFlutterBinding.ensureInitialized()` + `runApp(App())` |
| 5 | `lib/app.dart` | 60 | `MultiProvider` → `MaterialApp` → routes |
| 6 | `lib/models/goal.dart` | 50 | `Goal` class with `fromMap`/`toMap` |
| 7 | `lib/models/milestone.dart` | 50 | `Milestone` class |
| 8 | `lib/models/task.dart` | 45 | `Task` class |
| 9 | `lib/models/goal_event.dart` | 40 | `GoalEvent` class |
| 10 | `lib/database/database_helper.dart` | 80 | Singleton, `initDatabase`, schema, migrations |
| 11 | `lib/repositories/goal_repository.dart` | 60 | 5 CRUD methods |
| 12 | `lib/repositories/milestone_repository.dart` | 90 | CRUD + `moveMilestone` |
| 13 | `lib/repositories/task_repository.dart` | 60 | CRUD + `toggleTask` |
| 14 | `lib/repositories/event_repository.dart` | 45 | CRUD |
| 15 | `lib/providers/goal_provider.dart` | 200 | All state + all mutation methods |
| 16 | `lib/utils/progress_utils.dart` | 100 | `goalProgress`, `nextMilestone`, `daysUntil`, `calculatePacing` |
| 17 | `lib/theme/app_theme.dart` | 60 | `ThemeData` + color constants |
| 18 | `lib/screens/splash_screen.dart` | 60 | Brand + loader + navigation |
| 19 | `lib/screens/auth_screen.dart` | 60 | Google/Guest welcome screen with user_prefs save |
| 20 | `lib/screens/dashboard_screen.dart` | 120 | Goal list, FAB, empty state |
| 21 | `lib/screens/goal_detail_screen.dart` | 150 | TabBar + 3 tab widgets inline |
| 22 | `lib/screens/goal_form_screen.dart` | 150 | Form fields + validation + save |
| 23 | `lib/widgets/journey_map_widget.dart` | 200 | `CustomPainter` + `GestureDetector` |
| 24 | `lib/widgets/milestone_card.dart` | 180 | Expandable card + task list + reorder |
| 25 | `lib/widgets/confetti_widget.dart` | 80 | Particle animation |
| 26 | `lib/widgets/finish_overlay.dart` | 60 | Full-screen celebration |
| 27 | `lib/widgets/stat_card.dart` | 40 | Metric card widget |
| 28 | `lib/widgets/brand_widget.dart` | 30 | Logo rendering |
| 29 | `lib/widgets/empty_state_widget.dart` | 40 | "No goals" placeholder |
| — | **TOTAL (Dart)** | **~2,300 lines** | |

---

## 18. What Won't Be Ported

| Feature | Reason |
|---|---|
| Server-backed auth (JWT, password hashing) | Replaced by local Google/Guest auth screen — no passwords, no server |
| `AuthContext.jsx` | Replaced by direct DB access |
| `api/client.js` | All local now — no fetch calls |
| PWA config (`vite-plugin-pwa`) | Not applicable to native Android |
| `vite.config.js` / `eslint.config.js` | Not applicable to Flutter |
| `mockData.js` | Used for development only |
| Spring Boot backend | Entirely replaced by SQLite |

---

## 19. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Serpentine path math porting errors | Keep existing math as comments, write unit tests with known output |
| SQLite performance with many goals | Repositories use indexed queries by `goal_id`/`milestone_id` |
| Memory leaks in Provider | Use `ChangeNotifier` + `Consumer` pattern; dispose in `dispose()` |
| APK size too large | `--split-per-abi` reduces to ~14 MB; ProGuard/R8 enabled by default |
| Android permission issues | No internet/network permissions needed (fully offline) |

---

## 20. Acceptance Criteria

- [ ] `flutter analyze` passes with zero errors
- [ ] `flutter test` passes all unit tests
- [ ] App launches on Android emulator (API 34+)
- [ ] Fresh install shows auth screen with Google + Guest buttons
- [ ] Choosing Google saves pref and shows email + initial avatar on Profile
- [ ] Choosing Guest saves pref, hides email, shows initial on purple bg
- [ ] Re-launching app after auth skips straight to Dashboard
- [ ] Create a goal with title, why, difficulty, target date
- [ ] Add milestones with weight to a goal
- [ ] Reorder milestones (up/down)
- [ ] Cycle milestone status (todo → active → done → todo)
- [ ] Add tasks to a milestone
- [ ] Toggle task completion
- [ ] Delete tasks and milestones
- [ ] Journey map renders serpentine path with milestone nodes
- [ ] Tap milestone node on journey map to select
- [ ] Progress bar updates correctly as milestones/tasks are completed
- [ ] Confetti animation plays on progress
- [ ] Finish overlay shows when goal reaches 100%
- [ ] Delete goal removes all associated data (cascade)
- [ ] APK builds successfully: `flutter build apk --split-per-abi`
- [ ] APK installs on physical Android device
