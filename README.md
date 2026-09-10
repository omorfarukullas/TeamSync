# TeamSync 📅 — University Team Availability Scheduling & Meeting Finder

![TeamSync Banner](https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80)

> A private, invite-only web application tailored for a 4-person university project team to log weekly class schedules, automatically calculate the highest-scoring common meeting window, and coordinate via real-time team chat.

---

## 🚀 Key Features

- **🔐 Google OAuth Authentication (NextAuth.js v5)**
  - Access restricted exclusively to the 4 whitelisted team member emails.
  - Non-authorized Google accounts are automatically redirected to a custom `/denied` page.
  - Fast-login demo switcher for rapid local testing without OAuth setup.

- **📅 Interactive 25-Slot Weekly Availability Matrix**
  - Covers Saturday through Wednesday, 5 fixed university time slots per day (25 total slots).
  - 3-State instant selection:
    - ✅ **Available** (+2 points)
    - ⚠️ **Maybe** (+1 point)
    - ❌ **Not Available** (0 points)
  - Auto-saves instantly on click (no submit button needed) with toast confirmations.
  - Remarks / notes input per slot (auto-saves on blur).
  - Live progress tracker showing completed slots out of 25 with celebration confetti!
  - Cross-member inspection: view any teammate's schedule in read-only mode directly from the tab.

- **🏆 Real-Time Best Common Meeting Slot Finder**
  - Automatic scoring algorithm (0 to 8 points per slot).
  - Live "🏆 BEST COMMON MEETING SLOT" highlighted banner with complete breakdown.
  - Automatic handling and stacked display for multiple tied best slots.
  - Full team 25-row comparison table with status emojis, remarks previews, and gold best-row highlights.
  - Supabase Realtime synchronization: any teammate's update reflects instantly on everyone's screen without refreshing.

- **💬 Real-Time Team Chat**
  - Integrated team chat room with Supabase Realtime WebSocket subscriptions.
  - Optimistic messaging, sender avatars, formatted timestamps, and mobile-friendly layout.

- **📱 100% Mobile Responsive & Touch Friendly**
  - Sticky bottom tab navigation bar on mobile devices (iOS-style thumb navigation).
  - Pinned column horizontal tables with swipe-friendly scroll.
  - Tailored color palette with Navy `#1F4E79`, Emerald, and Amber accents.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Authentication** | [NextAuth.js v5 (Auth.js beta)](https://authjs.dev/) + Google OAuth 2.0 |
| **Database** | [Supabase (PostgreSQL 15)](https://supabase.com/) |
| **Realtime** | [Supabase Realtime WebSockets](https://supabase.com/docs/guides/realtime) |
| **Icons & Notifications** | [Lucide React](https://lucide.dev/) + [Sonner Toast](https://sonner.emilkowal.ski/) |
| **Hosting** | [Vercel](https://vercel.com/) (Frontend) + [Supabase](https://supabase.com/) (Database) |

---

## 📋 University Timetable Structure

### Days (5 Days)
1. **Saturday**
2. **Sunday**
3. **Monday**
4. **Tuesday**
5. **Wednesday**

### Time Slots (5 Daily Periods)
1. `8:30–9:10 AM`
2. `9:11–11:10 AM`
3. `11:11 AM–12:30 PM`
4. `12:31–1:50 PM`
5. `1:51–3:10 PM`

---

## 👥 Pre-Seeded Team Members

| ID | Name | Seeded Email (Replace with real Gmail in `.env.local`) |
|---|---|---|
| `mehedi` | **Mehedi** | `mehedi@gmail.com` |
| `omor` | **Omor** | `omor@gmail.com` |
| `rayan` | **Rayan** | `rayan@gmail.com` |
| `mahjabin` | **Mahjabin** | `mahjabin@gmail.com` |

---

## ⚙️ Step-by-Step Local Setup Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/teamsync.git
cd teamsync
npm install
```

---

### 2. Set Up Supabase Database & Realtime

1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Paste and run the following schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Availability Table
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

-- 3. Messages Table (Team Chat)
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at timestamp trigger
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

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select_all" ON members FOR SELECT USING (true);
CREATE POLICY "availability_select_all" ON availability FOR SELECT USING (true);
CREATE POLICY "availability_insert_all" ON availability FOR INSERT WITH CHECK (true);
CREATE POLICY "availability_update_all" ON availability FOR UPDATE USING (true);
CREATE POLICY "messages_select_all" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert_all" ON messages FOR INSERT WITH CHECK (true);

-- Enable Realtime publication for availability and messages
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE availability, messages;
COMMIT;

-- Seed the 4 initial team members
INSERT INTO members (id, name, email) VALUES
  ('mehedi',   'Mehedi',   'mehedi@gmail.com'),
  ('omor',     'Omor',     'omor@gmail.com'),
  ('rayan',    'Rayan',    'rayan@gmail.com'),
  ('mahjabin', 'Mahjabin', 'mahjabin@gmail.com')
ON CONFLICT (id) DO NOTHING;
```

4. Go to **Project Settings > API** in Supabase and copy:
   - `Project URL`
   - `anon / public` API Key
   - `service_role` API Key (keep this secret)

---

### 3. Set Up Google Cloud OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **TeamSync**.
3. Go to **APIs & Services > OAuth consent screen**:
   - Choose **External** user type.
   - Fill in App Name ("TeamSync") and your developer support email.
   - Add the 4 Gmail addresses under **Test Users**.
4. Go to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `TeamSync Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-teamsync.vercel.app` (when deploying)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-teamsync.vercel.app/api/auth/callback/google` (when deploying)
5. Copy your **Client ID** and **Client Secret**.

---

### 4. Configure `.env.local`

Create or edit `.env.local` in the project root:

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret

# NextAuth Secret
NEXTAUTH_SECRET=super_secret_jwt_key_please_change_teamsync_2026
AUTH_SECRET=super_secret_jwt_key_please_change_teamsync_2026
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Allowed Team Gmails (comma-separated, lowercase)
ALLOWED_EMAILS=mehedi@gmail.com,omor@gmail.com,rayan@gmail.com,mahjabin@gmail.com
```

---

### 5. Run the Application Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Sign in with Google (or use the **Quick Demo Switcher** on the login page to test as any member instantly).
- Fill in your 25 slots on **My Availability**.
- Switch to **Team Availability** to watch the Best Meeting Slot computed in real-time!
- Switch to **Team Chat** to send live messages across the team.

---

## 🚢 Deployment to Vercel (100% Free)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete TeamSync application"
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `teamsync` repository.
4. Add all environment variables from `.env.local` in the Vercel project settings:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `AUTH_SECRET` (same as `NEXTAUTH_SECRET`)
   - `NEXTAUTH_URL` (`https://your-app-name.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_EMAILS`
5. Update your Google Cloud Console **Authorized Redirect URIs** to include:
   - `https://your-app-name.vercel.app/api/auth/callback/google`
6. Click **Deploy**!

---

## 🔄 How to Change Team Member Emails

To update team members or replace placeholder emails with your actual university Gmail addresses:

1. Update the `ALLOWED_EMAILS` environment variable in `.env.local` (and in Vercel settings):
   ```env
   ALLOWED_EMAILS=real_mehedi@gmail.com,real_omor@gmail.com,real_rayan@gmail.com,real_mahjabin@gmail.com
   ```
2. Update the records in your Supabase `members` table:
   ```sql
   UPDATE members SET email = 'real_omor@gmail.com' WHERE id = 'omor';
   ```

---

## 📂 Project Structure

```
TeamSync/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth Google OAuth handler
│   │   ├── availability/route.ts       # GET/POST slot availability
│   │   ├── chat/route.ts               # GET/POST team chat messages
│   │   └── members/route.ts            # GET team member profiles
│   ├── dashboard/
│   │   ├── chat/page.tsx               # Team Chat tab
│   │   ├── team/page.tsx               # Team Availability Matrix tab
│   │   ├── layout.tsx                  # Authenticated layout with Navbar
│   │   └── page.tsx                    # My Availability tab
│   ├── denied/page.tsx                 # ⛔ Access Denied page
│   ├── globals.css                     # Global styles & animations
│   ├── layout.tsx                      # Root layout & Toaster
│   └── page.tsx                        # Login page with Google OAuth
├── components/
│   ├── AvailabilityTable.tsx           # 25-slot interactive schedule table
│   ├── BestSlotBanner.tsx              # Highlighted best meeting slot banner
│   ├── ChatMessage.tsx                 # Real-time chat message bubble
│   ├── ChatView.tsx                    # Real-time chatroom container
│   ├── LoginCard.tsx                   # Google login & demo member switcher
│   ├── MemberStatusBar.tsx             # 4 member avatars + live fill counter
│   ├── MobileTabBar.tsx                # iOS-style bottom navigation bar
│   ├── Navbar.tsx                      # Top desktop header with user avatar
│   ├── ProgressCounter.tsx             # 25-slot progress tracker & confetti
│   ├── StatusSelector.tsx              # 3-state availability button selector
│   ├── TeamTable.tsx                   # Full comparison matrix
│   └── TeamView.tsx                    # Realtime team container
├── docs/
│   ├── prd.md                          # Product Requirements Document
│   ├── trd.md                          # Technical Requirements Document
│   ├── ui-ux.md                        # UI/UX Specification
│   └── schema.md                       # Complete Supabase SQL Schema
├── lib/
│   ├── auth.ts                         # NextAuth v5 configuration
│   ├── constants.ts                    # Days, time slots, scoring algorithm
│   ├── supabase.ts                     # Supabase browser client (Realtime)
│   ├── supabase-server.ts              # Supabase server client (Service Role)
│   └── types.ts                        # TypeScript interfaces
├── middleware.ts                       # Route protection middleware
├── .env.local                          # Environment variables
├── .env.local.example                  # Environment template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📄 License

MIT &copy; TeamSync 2026. Built with ❤️ for university student teams.