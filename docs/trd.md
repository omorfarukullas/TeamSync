# Technical Requirements Document (TRD)
# TeamSync 📅 — University Team Scheduling Tool

**Version:** 1.0.0  
**Date:** 2026-09-11  
**Status:** Final

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│  Next.js 14 App Router + React + Tailwind CSS + shadcn/ui   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Login Page │  │  Dashboard   │  │  Team Availability │ │
│  │  (/)        │  │  (/dashboard)│  │  (/dashboard/team) │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────────┐
│  Next.js API    │ │  Google      │ │  Supabase          │
│  Routes         │ │  OAuth 2.0   │ │  (PostgreSQL +     │
│  /api/auth/*    │ │              │ │   Realtime)        │
│  /api/avail*    │ └──────────────┘ └────────────────────┘
└─────────────────┘
```

---

## 2. Technology Stack

| Layer        | Technology                         | Version   | Rationale                           |
|-------------|-------------------------------------|-----------|-------------------------------------|
| Framework   | Next.js (App Router)                | 14.x      | Server components, file-based routing|
| Language    | TypeScript                          | 5.x       | Type safety                         |
| Styling     | Tailwind CSS                        | 3.x       | Utility-first rapid styling         |
| UI Components| shadcn/ui                          | Latest    | Accessible, customizable components |
| Auth        | NextAuth.js                         | v5 (beta) | Google OAuth, session management    |
| Database    | Supabase (PostgreSQL)               | Latest    | Managed Postgres + Realtime         |
| Realtime    | Supabase Realtime                   | Latest    | WebSocket-based live updates        |
| Deployment  | Vercel                              | -         | Zero-config Next.js hosting         |
| Icons       | lucide-react                        | Latest    | Consistent icon library             |
| Notifications| react-hot-toast                    | Latest    | Toast notifications                 |

---

## 3. Authentication Flow

```
User visits /dashboard
       │
       ▼
  Has session?
  ┌────┴────┐
  NO       YES
  │         │
  ▼         ▼
Redirect  Check email in
to /      ALLOWED_EMAILS
           │
    ┌──────┴──────┐
    NOT ALLOWED  ALLOWED
    │             │
    ▼             ▼
  /denied      Load member
              profile from DB
                   │
                   ▼
              /dashboard
```

### NextAuth.js v5 Configuration
- **Provider:** Google OAuth 2.0
- **Callbacks:**
  - `signIn`: Check email against ALLOWED_EMAILS env var → return false if not allowed
  - `session`: Attach member profile (id, name) to session object
  - `jwt`: Store member id in JWT token
- **Session Strategy:** JWT (stateless, no DB session table needed)
- **Middleware:** Protect /dashboard/* routes, redirect unauthenticated to /

---

## 4. Database Design

### 4.1 Tables

#### members
```sql
CREATE TABLE members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

#### availability
```sql
CREATE TABLE availability (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   TEXT REFERENCES members(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  time_slot   TEXT NOT NULL,
  status      TEXT CHECK (status IN ('available', 'not_available', 'maybe')),
  remarks     TEXT CHECK (char_length(remarks) <= 100),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id, day, time_slot)
);
```

Note: Status stored as enum strings internally; emojis rendered in UI layer.

### 4.2 Seed Data (members table)
```sql
INSERT INTO members (id, name, email) VALUES
  ('mehedi',   'Mehedi',   'mehedi@gmail.com'),
  ('omor',     'Omor',     'omor@gmail.com'),
  ('rayan',    'Rayan',    'rayan@gmail.com'),
  ('mahjabin', 'Mahjabin', 'mahjabin@gmail.com');
```

### 4.3 Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Members: anyone authenticated can read
CREATE POLICY "members_read" ON members FOR SELECT USING (true);

-- Members: only own row for update
CREATE POLICY "members_update_own" ON members FOR UPDATE
  USING (auth.uid()::text = id);

-- Availability: anyone authenticated can read all
CREATE POLICY "availability_read_all" ON availability FOR SELECT USING (true);

-- Availability: can only insert/update own rows
CREATE POLICY "availability_insert_own" ON availability FOR INSERT
  WITH CHECK (member_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "availability_update_own" ON availability FOR UPDATE
  USING (member_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

Note: Server-side API routes use service role key (bypasses RLS) for reads.
Client-side reads use anon key with RLS policies.

---

## 5. API Routes

### GET /api/availability
Returns all availability records for all members.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "member_id": "omor",
      "day": "Saturday",
      "time_slot": "8:30–9:10 AM",
      "status": "available",
      "remarks": "Free after lab",
      "updated_at": "2026-09-11T..."
    }
  ]
}
```

### POST /api/availability
Upserts a single availability record for the logged-in member.

**Request Body:**
```json
{
  "day": "Saturday",
  "time_slot": "8:30–9:10 AM",
  "status": "available",
  "remarks": "Free after lab"
}
```

**Auth:** Requires valid NextAuth session. member_id is derived from session, not request body.

---

## 6. Realtime Architecture

```
Supabase Realtime Channel: "availability-changes"
  - Table: availability
  - Events: INSERT, UPDATE, DELETE
  - Filter: none (all changes)

Client subscribes on mount (useEffect)
Client unsubscribes on unmount

On change event:
  → Re-fetch availability from /api/availability
  → Update local state
  → Re-compute best slot scores
  → Re-render Team table + Best Slot Banner
```

---

## 7. Scoring Algorithm

```typescript
const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
const TIME_SLOTS = [
  '8:30–9:10 AM',
  '9:11–11:10 AM',
  '11:11 AM–12:30 PM',
  '12:31–1:50 PM',
  '1:51–3:10 PM'
];

function computeScore(slotData: AvailabilityRecord[]): number {
  return slotData.reduce((sum, record) => {
    if (record.status === 'available')     return sum + 2;
    if (record.status === 'maybe')         return sum + 1;
    if (record.status === 'not_available') return sum + 0;
    return sum; // not filled = 0
  }, 0);
}

function findBestSlots(allData: AvailabilityRecord[]) {
  const scores = DAYS.flatMap(day =>
    TIME_SLOTS.map(slot => ({
      day,
      slot,
      score: computeScore(
        allData.filter(r => r.day === day && r.time_slot === slot)
      ),
      breakdown: {
        available: allData.filter(r => r.day === day && r.time_slot === slot && r.status === 'available').length,
        maybe: allData.filter(r => r.day === day && r.time_slot === slot && r.status === 'maybe').length,
        not_available: allData.filter(r => r.day === day && r.time_slot === slot && r.status === 'not_available').length,
      }
    }))
  );
  const maxScore = Math.max(...scores.map(s => s.score));
  return scores.filter(s => s.score === maxScore && s.score > 0);
}
```

---

## 8. Security Considerations

| Concern           | Mitigation                                          |
|-------------------|-----------------------------------------------------|
| Unauthorized access | Middleware + signIn callback email check           |
| Data tampering    | Server derives member_id from session (not input)   |
| SQL injection     | Supabase parameterized queries (PostgREST)          |
| XSS              | Next.js escapes all JSX output by default           |
| CSRF             | NextAuth.js handles CSRF tokens internally          |
| Secrets exposure | All secrets in .env.local, never committed to git   |
| RLS bypass       | Service role key only used server-side in API routes|

---

## 9. Environment Variables

| Variable                    | Used In         | Description                     |
|-----------------------------|-----------------|----------------------------------|
| GOOGLE_CLIENT_ID            | lib/auth.ts     | Google OAuth app client ID       |
| GOOGLE_CLIENT_SECRET        | lib/auth.ts     | Google OAuth app client secret   |
| NEXTAUTH_SECRET             | lib/auth.ts     | JWT signing secret               |
| NEXTAUTH_URL                | lib/auth.ts     | App base URL                     |
| NEXT_PUBLIC_SUPABASE_URL    | lib/supabase.ts | Supabase project URL (public)    |
| NEXT_PUBLIC_SUPABASE_ANON_KEY| lib/supabase.ts| Supabase anon key (public)       |
| SUPABASE_SERVICE_ROLE_KEY   | lib/supabase-server.ts| Supabase service role key  |
| ALLOWED_EMAILS              | lib/auth.ts     | Comma-separated allowed emails   |

---

## 10. Performance Considerations

- Server Components for initial data load (SSR)
- Client Components only for interactive elements (StatusSelector, RealtimeTeamTable)
- Supabase Realtime replaces polling — no unnecessary refetches
- Tailwind CSS purged in production build — minimal CSS bundle
- Vercel Edge Middleware for route protection (fast redirects)
