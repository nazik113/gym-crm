# GymCRM — Full System Architecture
> Premium Gym Management Ecosystem · 2026

---

## 1. MONOREPO STRUCTURE

```
gym-crm/
├── backend/          # Laravel 12 REST API
├── frontend/         # Next.js 15 Admin + Trainer Web
├── mobile/           # Flutter Client App
├── realtime/         # Node.js + Socket.IO server
├── docker/           # Nginx, Postgres init
├── docker-compose.yml
├── .env.example
├── DATABASE_SCHEMA.sql
└── ARCHITECTURE.md
```

---

## 2. TECH STACK

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Web Frontend  | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Framer Motion |
| Mobile App    | Flutter 3.22, Riverpod, go_router, Freezed      |
| Backend API   | Laravel 12, PHP 8.3, Sanctum, Eloquent ORM      |
| Realtime      | Node.js 22, Socket.IO 4, Redis pub/sub          |
| Database      | PostgreSQL 16                                   |
| Cache/Queue   | Redis 7                                         |
| Storage       | S3-compatible (AWS / MinIO)                     |
| Auth          | Laravel Sanctum (Bearer tokens)                 |
| QR            | html5-qrcode (web), mobile_scanner (Flutter), qr_flutter (display) |
| Containerization | Docker + Docker Compose                      |

---

## 3. DATABASE TABLES

```
roles                  — admin / trainer / client
users                  — all users (all roles)
registration_codes     — invite codes (admin-generated)
subscription_plans     — plan catalog
subscriptions          — per-user subscriptions
attendance             — check-in/check-out records
workout_plans          — trainer-assigned workout programs
workout_days           — days inside a plan
exercises              — exercises per day
nutrition_plans        — trainer-assigned meal programs
meals                  — meals inside a nutrition plan
measurements           — body metrics history
notes                  — trainer/admin notes per client
audit_logs             — full activity audit trail
notifications          — in-app notifications (UUID PK)
```

---

## 4. ROLES & PERMISSIONS

| Permission                    | Admin | Trainer | Client |
|-------------------------------|:-----:|:-------:|:------:|
| View all clients              |  ✅   |  ✅*   |  ❌    |
| Edit client personal data     |  ✅   |  ❌    |  ❌    |
| Manage subscriptions          |  ✅   |  ❌    |  ❌    |
| Assign trainer to client      |  ✅   |  ❌    |  ❌    |
| Generate registration codes   |  ✅   |  ❌    |  ❌    |
| Scan QR → full card           |  ✅   |  ❌    |  ❌    |
| Scan QR → trainer card        |  ✅   |  ✅    |  ❌    |
| Create/edit workout plans     |  ✅   |  ✅    |  ❌    |
| Create/edit nutrition plans   |  ✅   |  ✅    |  ❌    |
| Add/delete notes              |  ✅   |  ✅    |  ❌    |
| Add measurements              |  ✅   |  ✅    |  ❌    |
| View own QR code              |  ✅   |  ✅    |  ✅    |
| View own workouts             |  ✅   |  ✅    |  ✅    |
| View own nutrition            |  ✅   |  ✅    |  ✅    |
| Gym presence management       |  ✅   |  ❌    |  ❌    |
| Analytics dashboard           |  ✅   |  ❌    |  ❌    |

*Trainer can only view their own clients

---

## 5. AUTHENTICATION FLOW

```
LOGIN
  Client → POST /api/auth/login { phone, password }
  Server → validates → returns { user, token }
  Client → stores token (localStorage / SecureStorage)
  Client → redirected by role: /admin | /trainer | /client

REGISTRATION (invite-only)
  Step 1 → POST /api/auth/validate-code { code }
           Server validates: active, not expired, not used
           Returns: { valid, role }
  Step 2 → POST /api/auth/register { code, phone, first_name,
           last_name, date_of_birth, password }
           Server: creates user, assigns role, attaches subscription
           (if client + plan_id on code), marks code as 'used'
           Returns: { user, token }

TOKEN REFRESH
  POST /api/auth/refresh → rotates Sanctum token

LOGOUT
  POST /api/auth/logout → deletes current token
```

---

## 6. QR FLOW ARCHITECTURE

```
CLIENT/TRAINER has QR code (unique 12-char string, stored in users.qr_code)

SCAN (web):
  html5-qrcode detects code
  → POST /api/qr/scan { qr_code }
  → Server resolves user
  → Auto check-in if client not in gym
  → Returns { client, card_type, checked_in }
  → Frontend shows: AdminFullCard OR TrainerLimitedCard

SCAN (mobile — trainer app):
  mobile_scanner detects
  → Same API endpoint
  → Shows appropriate card

DISPLAY (client app):
  GET /api/qr/my → { qr_code }
  → qr_flutter renders QRImageView
  → Fullscreen mode available
  → Copy to clipboard
```

---

## 7. GYM PRESENCE FLOW

```
ENTER GYM
  Option A: Scan QR (admin or trainer)
    → POST /api/qr/scan → auto calls PresenceService::enterGym()
  Option B: Manual (admin)
    → POST /api/presence/{client}/enter

PresenceService::enterGym():
  1. Set users.is_in_gym = true, gym_entered_at = now()
  2. Create attendance record (checked_in_at = now())
  3. If sessions-based subscription → decrement sessions_remaining
  4. Fire ClientEnteredGym event
     → Laravel broadcasts to 'gym-presence' Pusher/Redis channel
     → Node.js receives via Redis pub/sub
     → Socket.IO emits 'presence:update' to role:admin + role:trainer rooms
     → Frontend PresenceStore.addClient() → live card appears

LEAVE GYM
  Admin clicks "Mark as Left" on presence page
  → POST /api/presence/{client}/leave

PresenceService::leaveGym():
  1. Find open attendance record, set checked_out_at, duration_minutes
  2. Set users.is_in_gym = false, gym_entered_at = null
  3. Fire ClientLeftGym event → Socket.IO removes card in real-time
```

---

## 8. SUBSCRIPTION LOGIC

```
PLAN TYPES
  • Duration-only: unlimited sessions for N days
  • Sessions-based: N sessions, expires on date OR when sessions = 0

ASSIGNMENT
  Admin → POST /api/clients/{id}/subscriptions { plan_id, starts_at, notes }
  OR automatically on registration (via registration code)

STATUS TRANSITIONS
  pending → active (when starts_at reached, or immediate)
  active  → expired (when expires_at < today OR sessions_remaining = 0)
  active  → cancelled (admin action)

SESSION DEDUCTION
  Each gym entry via PresenceService auto-deducts one session
  Admin can manually deduct: PATCH /api/subscriptions/{id}/deduct-session

EXTENSION
  PATCH /api/subscriptions/{id}/extend { days: 30 }
  → expires_at += days
```

---

## 9. REALTIME ARCHITECTURE

```
FLOW:
  Laravel Event → Redis Pub → Node.js Sub → Socket.IO Rooms

CHANNELS:
  gym-presence          → admins + trainers (presence updates)
  private-user.{id}     → individual user notifications
  role.admin            → admin-only broadcasts
  role.trainer          → trainer broadcasts

SOCKET.IO NAMESPACES:
  /            → all authenticated users
  /admin       → admin-only connection
  /trainer     → trainer-only connection

REDIS ADAPTER:
  @socket.io/redis-adapter enables horizontal scaling
  Multiple Node.js instances share state via Redis
```

---

## 10. WORKOUT SYSTEM LOGIC

```
TRAINER CREATES:
  POST /api/workout-plans { client_id, title, description, start_date }
  POST /api/workout-plans/{id}/days { name, day_number, muscle_groups }
  POST /api/workout-days/{id}/exercises { name, sets, reps, weight_kg, ... }

CLIENT SEES:
  GET /api/my/workouts → all plans with days and exercises
  Mobile app renders: Plan → Day cards → Exercise list with sets/reps

STATUSES: draft → active → completed
```

---

## 11. NUTRITION SYSTEM LOGIC

```
TRAINER CREATES:
  POST /api/nutrition-plans { client_id, title, daily_calories, protein_g, carbs_g, fats_g }
  POST /api/nutrition-plans/{id}/meals { name, time_of_day, calories, foods: [] }

CLIENT SEES:
  GET /api/my/nutrition → active plan with all meals
  Shows: daily macro targets, per-meal breakdown, timing

MACRO TRACKING: daily_calories, protein_g, carbs_g, fats_g
```

---

## 12. API ENDPOINTS SUMMARY

```
AUTH
  POST   /auth/login
  POST   /auth/validate-code
  POST   /auth/register
  POST   /auth/logout
  GET    /auth/me
  POST   /auth/refresh

QR
  GET    /qr/my
  POST   /qr/scan

DASHBOARD (admin)
  GET    /dashboard
  GET    /dashboard/stats

CLIENTS (admin + trainer)
  GET    /clients
  POST   /clients
  GET    /clients/{id}
  PUT    /clients/{id}
  DELETE /clients/{id}
  GET    /clients/{id}/subscription
  GET    /clients/{id}/attendance
  GET    /clients/{id}/measurements
  POST   /clients/{id}/measurements
  GET    /clients/{id}/notes
  POST   /clients/{id}/notes
  DELETE /notes/{id}

SUBSCRIPTIONS (admin)
  GET    /subscription-plans
  POST   /subscription-plans
  POST   /clients/{id}/subscriptions
  PATCH  /subscriptions/{id}/extend
  PATCH  /subscriptions/{id}/deduct-session
  PATCH  /subscriptions/{id}/cancel

PRESENCE (admin)
  GET    /presence
  POST   /presence/{id}/enter
  POST   /presence/{id}/leave

REGISTRATION CODES (admin)
  GET    /registration-codes
  POST   /registration-codes
  DELETE /registration-codes/{id}
  POST   /registration-codes/{id}/revoke

WORKOUTS (trainer + admin)
  GET    /workout-plans
  POST   /workout-plans
  GET    /workout-plans/{id}
  PUT    /workout-plans/{id}
  DELETE /workout-plans/{id}
  POST   /workout-plans/{id}/days
  POST   /workout-days/{id}/exercises
  PUT    /exercises/{id}
  DELETE /exercises/{id}
  GET    /my/workouts   (client)

NUTRITION (trainer + admin)
  GET    /nutrition-plans
  POST   /nutrition-plans
  GET    /nutrition-plans/{id}
  PUT    /nutrition-plans/{id}
  DELETE /nutrition-plans/{id}
  POST   /nutrition-plans/{id}/meals
  PUT    /meals/{id}
  DELETE /meals/{id}
  GET    /my/nutrition  (client)

ANALYTICS (admin)
  GET    /analytics/revenue
  GET    /analytics/attendance
  GET    /analytics/subscriptions
  GET    /analytics/clients
  GET    /analytics/trainers

CLIENT SELF (client role)
  GET    /my/profile
  GET    /my/qr
  GET    /my/subscription
  GET    /my/attendance
  GET    /my/measurements
```

---

## 13. FRONTEND PAGES

```
ADMIN PANEL
  /auth/login                   Login
  /auth/register                Register (2-step code flow)
  /admin/dashboard              Stats, charts, presence widget
  /admin/clients                Client list + search + filters
  /admin/clients/[id]           Full client CRM card
  /admin/trainers               Trainer list
  /admin/trainers/[id]          Trainer profile + clients
  /admin/subscriptions          Subscription management
  /admin/attendance             Attendance history + charts
  /admin/presence               Live gym presence (realtime)
  /admin/codes                  Registration code manager
  /admin/analytics              Revenue + attendance analytics
  /admin/scanner                QR scanner → auto open card
  /admin/settings               System settings

TRAINER PANEL
  /trainer/dashboard            My clients overview
  /trainer/clients              Client list (own clients)
  /trainer/clients/[id]         Trainer client card
  /trainer/workouts             All workout plans
  /trainer/nutrition            All nutrition plans
  /trainer/scanner              QR scanner → trainer card
  /trainer/stats                Personal statistics
  /trainer/notes                All notes across clients

CLIENT MOBILE (Flutter)
  /auth/login                   Phone + password login
  /auth/register                2-step invite code registration
  /dashboard                    Home: subscription, quick actions
  /qr                           Personal QR code (+ fullscreen)
  /workouts                     Workout plans list
  /nutrition                    Nutrition plans list
  /attendance                   Visit history
  /subscription                 Subscription details
  /profile                      Profile view (read-only)
```

---

## 14. ANIMATIONS GUIDE (Framer Motion / Flutter)

```
WEB (Framer Motion)
  Page enter:    opacity 0→1 + y 24→0, duration 0.5s easeOut
  Cards:         opacity 0→1 + y 20→0, staggered 0.05s delay
  Hover:         y -2px, duration 0.2s
  Modals:        scale 0.9→1 + opacity, duration 0.25s
  Presence cards:AnimatePresence height 0→auto + opacity
  Sidebar items: x -3→0 on hover
  Stat counters: spring animation on mount
  Charts:        recharts built-in animation (500ms ease)
  Skeleton:      CSS shimmer (translateX -100%→100%)

FLUTTER
  Page transitions: SlideTransition (horizontal)
  FadeTransition on login (600ms easeOut)
  AnimatedContainer for button press states
  GestureDetector → scale feedback (0.97 on tap)
  PresenceCard: AnimatedContainer color pulse
  QR glow: Container boxShadow with opacity animation
  Lottie animations for empty states
```

---

## 15. COMPONENT SYSTEM (Next.js)

```
shared/
  StatCard          — KPI card with icon + trend + neon glow
  Skeleton          — Shimmer skeleton loader
  Providers         — QueryClient + Toaster wrapper

admin/
  AdminSidebar      — Collapsible nav with presence badge
  AdminHeader       — Search + notification + user info
  PresenceWidget    — Live client list (dashboard)
  ExpiringSubsWidget— Expiring subscriptions (dashboard)

charts/
  AttendanceChart   — recharts AreaChart (30-day)
  RevenueChart      — recharts BarChart (6-month)

qr/
  QRScannerPage     — html5-qrcode integration
  QRResultCard      — Scanned result display

Flutter widgets/
  GymCard           — Dark glass card container
  StatChip          — Metric badge with color
  MainScaffold      — Bottom nav shell
  _NavItem          — Animated bottom nav item
```

---

## 16. DOCKER SERVICES

```
postgres     — PostgreSQL 16 (port 5432)
redis        — Redis 7 with password (port 6379)
backend      — Laravel 12 on PHP 8.3-fpm (port 8000)
frontend     — Next.js 15 (port 3000)
realtime     — Node.js 22 Socket.IO (port 3001)
nginx        — Reverse proxy (ports 80, 443)
queue        — Laravel queue worker (Redis driver)
scheduler    — Laravel cron scheduler (60s loop)
```

---

## 17. PUSH NOTIFICATIONS

```
TRIGGERS:
  • Subscription expiring in 3 days → client notified
  • Subscription expired → client + admin notified
  • New trainer assigned → client notified
  • Workout plan assigned → client notified
  • Low sessions (≤2 remaining) → client + admin notified

CHANNELS:
  Database notifications → /api/auth/me includes unread count
  Firebase Cloud Messaging → mobile push (firebase_messaging)
  Socket.IO → in-app real-time (notification:received)

QUEUE:
  All notifications dispatched via Laravel Queue (Redis driver)
  Retry: 3 attempts, exponential backoff
```

---

## 18. SECURITY

```
• Laravel Sanctum bearer tokens (stateless API)
• Token rotation on refresh
• Role middleware on all protected routes
• Policy-based authorization (Trainer can only see own clients)
• Hidden fields on RegistrationCode model (never exposed to client)
• SQL injection: Eloquent ORM parameterized queries
• XSS: Next.js server-side rendering + React escaping
• CORS: configured per environment
• Helmet.js on Node.js realtime server
• Rate limiting: Laravel throttle middleware on auth routes
• Audit log: every model change recorded in audit_logs
• Soft deletes: user data preserved on deletion
```

---

*GymCRM — Built for 2026. Premium. Fast. Realtime.*
