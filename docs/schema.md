# Database Schema
# TeamSync 📅 — Supabase PostgreSQL

**Version:** 1.0.0  
**Database:** Supabase (PostgreSQL 15)

---

## 1. Entity Relationship Diagram

```
members
┌──────────────┐
│ id (PK TEXT) │◄────────────┐
│ name         │             │
│ email UNIQUE │             │
│ avatar_url   │      availability
│ created_at   │ ┌─────────────────────┐
└──────────────┘ │ id (PK UUID)        │
                 │ member_id (FK) ─────┘
                 │ day                 │
                 │ time_slot           │
                 │ status              │
                 │ remarks             │
                 │ updated_at          │
                 │ UNIQUE(member_id,   │
                 │        day,         │
                 │        time_slot)   │
                 └─────────────────────┘
```

---

## 2. Full SQL Schema

```sql
-- ============================================================
-- TeamSync Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: members
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE members IS 'Pre-seeded team member profiles';
COMMENT ON COLUMN members.id IS 'Short identifier: mehedi, omor, rayan, mahjabin';
COMMENT ON COLUMN members.avatar_url IS 'Google profile photo URL, updated on first login';

-- ============================================================
-- TABLE: availability
-- ============================================================
CREATE TABLE IF NOT EXISTS availability (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day         TEXT NOT NULL CHECK (day IN (
    'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'
  )),
  time_slot   TEXT NOT NULL CHECK (time_slot IN (
    '8:30–9:10 AM',
    '9:11–11:10 AM',
    '11:11 AM–12:30 PM',
    '12:31–1:50 PM',
    '1:51–3:10 PM'
  )),
  status      TEXT NOT NULL CHECK (status IN (
    'available', 'not_available', 'maybe'
  )),
  remarks     TEXT CHECK (char_length(remarks) <= 100),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id, day, time_slot)
);

COMMENT ON TABLE availability IS 'Member availability for each day/time slot';
COMMENT ON COLUMN availability.status IS 'available | not_available | maybe';
COMMENT ON COLUMN availability.remarks IS 'Optional note, max 100 chars';

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: messages (Team Chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE messages IS 'Real-time team chat messages';
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Members: all users can read
CREATE POLICY "members_select_all"
  ON members FOR SELECT
  TO anon, authenticated
  USING (true);

-- Availability: all users can read
CREATE POLICY "availability_select_all"
  ON availability FOR SELECT
  TO anon, authenticated
  USING (true);

-- Availability: authenticated users can insert
CREATE POLICY "availability_insert_own"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Availability: authenticated users can update
CREATE POLICY "availability_update_own"
  ON availability FOR UPDATE
  TO authenticated
  USING (true);

-- Messages: all users can read
CREATE POLICY "messages_select_all"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

-- Messages: authenticated users can insert
CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable Realtime publication for availability and messages tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE availability, messages;
COMMIT;

-- ============================================================
-- SEED DATA: members
-- ============================================================
INSERT INTO members (id, name, email) VALUES
  ('mehedi',   'Mehedi',   'mehedi@gmail.com'),
  ('omor',     'Omor',     'omor@gmail.com'),
  ('rayan',    'Rayan',    'rayan@gmail.com'),
  ('mahjabin', 'Mahjabin', 'mahjabin@gmail.com')
ON CONFLICT (id) DO NOTHING;
```

---

## 3. Table Descriptions

### 3.1 members

| Column     | Type        | Constraints         | Description                          |
|------------|-------------|---------------------|--------------------------------------|
| id         | TEXT        | PRIMARY KEY         | Short ID (mehedi, omor, rayan, mahjabin) |
| name       | TEXT        | NOT NULL            | Display name                         |
| email      | TEXT        | UNIQUE, NOT NULL    | Google account email                 |
| avatar_url | TEXT        | nullable            | Google profile photo URL             |
| created_at | TIMESTAMPTZ | DEFAULT now()       | Record creation timestamp            |

### 3.2 availability

| Column     | Type        | Constraints                  | Description                    |
|------------|-------------|------------------------------|--------------------------------|
| id         | UUID        | PRIMARY KEY, gen_random_uuid | Row identifier                 |
| member_id  | TEXT        | FK → members(id), NOT NULL   | Which team member              |
| day        | TEXT        | CHECK (enum), NOT NULL       | Day of the week                |
| time_slot  | TEXT        | CHECK (enum), NOT NULL       | Time period                    |
| status     | TEXT        | CHECK (enum), NOT NULL       | available / not_available / maybe |
| remarks    | TEXT        | CHECK (len <= 100), nullable | Optional note from member      |
| updated_at | TIMESTAMPTZ | DEFAULT now(), auto-updated  | Last modification time         |

**Unique constraint:** (member_id, day, time_slot) — ensures one record per member per slot.

---

## 4. Valid Values

### Days (in order)
1. Saturday
2. Sunday
3. Monday
4. Tuesday
5. Wednesday

### Time Slots (in order)
1. 8:30–9:10 AM
2. 9:11–11:10 AM
3. 11:11 AM–12:30 PM
4. 12:31–1:50 PM
5. 1:51–3:10 PM

### Status Values
| DB Value       | Display         | Emoji | Points |
|----------------|-----------------|-------|--------|
| available      | Available       | ✅    | 2      |
| not_available  | Not Available   | ❌    | 0      |
| maybe          | Maybe           | ⚠️    | 1      |

---

## 5. Indexes

```sql
-- Index for member lookup by email (used in auth)
CREATE INDEX IF NOT EXISTS members_email_idx ON members(email);

-- Composite index for slot queries
CREATE INDEX IF NOT EXISTS availability_day_slot_idx 
  ON availability(day, time_slot);

-- Index for member's own availability queries
CREATE INDEX IF NOT EXISTS availability_member_idx 
  ON availability(member_id);
```

---

## 6. Realtime Configuration

Enable Realtime on the `availability` table in Supabase Dashboard:
1. Go to **Database > Replication**
2. Under **Tables**, find `availability`
3. Toggle the switch **ON** for `availability`

Or via SQL (above in schema section).

Client subscription code:
```typescript
const channel = supabase
  .channel('availability-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'availability' },
    (payload) => {
      // Re-fetch all availability data
      fetchAllAvailability();
    }
  )
  .subscribe();
```

---

## 7. API Usage Patterns

### Upsert availability (server-side, service role)
```typescript
const { error } = await supabaseServer
  .from('availability')
  .upsert({
    member_id: memberId,
    day: day,
    time_slot: timeSlot,
    status: status,
    remarks: remarks ?? null,
  }, { onConflict: 'member_id,day,time_slot' });
```

### Get all availability (server-side, service role)
```typescript
const { data, error } = await supabaseServer
  .from('availability')
  .select('*')
  .order('member_id');
```

### Get member by email (server-side, auth callback)
```typescript
const { data: member } = await supabaseServer
  .from('members')
  .select('*')
  .eq('email', email)
  .single();
```

### Update avatar_url (server-side, first login)
```typescript
await supabaseServer
  .from('members')
  .update({ avatar_url: googlePhotoUrl })
  .eq('email', email);
```
