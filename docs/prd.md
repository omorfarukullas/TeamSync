# Product Requirements Document (PRD)
# TeamSync 📅 — University Team Scheduling Tool

**Version:** 1.0.0  
**Date:** 2026-09-11  
**Author:** TeamSync Dev Team  
**Status:** Draft → Approved

---

## 1. Executive Summary

TeamSync is a private, invite-only web application that allows exactly 4 university students to log their weekly class/availability schedule and instantly find the best common meeting time slot. The app is built with a modern full-stack setup (Next.js 14, Supabase, NextAuth.js) and requires no backend maintenance after initial deployment.

---

## 2. Problem Statement

University student groups frequently struggle to coordinate meeting times because:
- Each member has a different class schedule every week
- WhatsApp polls are tedious and not visualized
- When2meet and Doodle require everyone to revisit the link
- There's no persistent, real-time view of the whole team's availability

**TeamSync solves this** by providing a permanent, always-up-to-date dashboard where each member fills their availability once (or updates it weekly) and instantly sees the best shared slot.

---

## 3. Goals & Non-Goals

### Goals
- [x] Google OAuth login restricted to exactly 4 pre-approved emails
- [x] Each member fills 5 days x 5 time slots = 25 slots with 3-state availability
- [x] Real-time team overview using Supabase Realtime
- [x] Automatic "best slot" computation with scoring
- [x] Mobile-responsive premium UI
- [x] Zero cost infrastructure (Supabase free tier + Vercel hobby)

### Non-Goals
- No self-registration / sign-up flow
- No admin panel or user management
- No email notifications or reminders
- No password-based authentication
- No support for more than 4 members
- No calendar integrations (Google Cal, iCal)

---

## 4. Target Users

| Persona  | Description                          |
|----------|--------------------------------------|
| Mehedi   | CSE student, heavy morning schedule  |
| Omor     | CSE student, prefers afternoon slots |
| Rayan    | CSE student, mixed availability      |
| Mahjabin | CSE student, limited free windows    |

---

## 5. Feature Requirements

### 5.1 Authentication
| ID      | Requirement                                              | Priority |
|---------|----------------------------------------------------------|----------|
| AUTH-01 | Sign in via Google OAuth (NextAuth.js v5)                | P0       |
| AUTH-02 | Restrict access to 4 whitelisted emails                  | P0       |
| AUTH-03 | Redirect unauthorized emails to /denied page             | P0       |
| AUTH-04 | Session persists across browser refreshes                | P0       |
| AUTH-05 | Logout clears session and redirects to /                 | P0       |
| AUTH-06 | Unauthenticated users hitting /dashboard redirect to /   | P0       |

### 5.2 My Availability Tab
| ID       | Requirement                                              | Priority |
|----------|----------------------------------------------------------|----------|
| AVAIL-01 | Display 25-slot table (5 days x 5 time slots)           | P0       |
| AVAIL-02 | 3-state status selector                                  | P0       |
| AVAIL-03 | Auto-save on status click (no submit button)             | P0       |
| AVAIL-04 | Remarks text input (max 100 chars), auto-save on blur    | P0       |
| AVAIL-05 | Row background color matches status                      | P0       |
| AVAIL-06 | Toast notification "Saved" after each save               | P1       |
| AVAIL-07 | Progress counter "X/25 slots filled"                     | P1       |
| AVAIL-08 | Frozen header row on scroll                              | P1       |
| AVAIL-09 | Merged day cells (rowspan 5)                             | P1       |

### 5.3 Team Availability Tab
| ID      | Requirement                                              | Priority |
|---------|----------------------------------------------------------|----------|
| TEAM-01 | Member status bar with avatars and slot-fill counts      | P0       |
| TEAM-02 | Best Slot Banner showing top-scoring slot(s)             | P0       |
| TEAM-03 | Full 25-row comparison table with all member statuses    | P0       |
| TEAM-04 | Score formula: Available=2, Maybe=1, Not Available=0     | P0       |
| TEAM-05 | Tied best slots all highlighted with gold border         | P1       |
| TEAM-06 | Supabase Realtime subscription for live updates          | P0       |
| TEAM-07 | Live indicator in Team tab                               | P1       |
| TEAM-08 | Empty state message when no data                         | P1       |

---

## 6. Acceptance Criteria

1. A user with an approved Google email can log in and reaches /dashboard within 3 seconds.
2. A user with an unapproved email sees /denied without any error page.
3. Clicking a status option saves to Supabase and shows toast within 1 second.
4. Changing any member status updates the Best Slot Banner in real-time (< 2s latency).
5. All tables are horizontally scrollable on screens narrower than 768px.

---

## 7. Success Metrics

| Metric                           | Target    |
|----------------------------------|-----------|
| Time to fill all 25 slots        | < 3 min   |
| Real-time update latency         | < 2s      |
| Mobile usability score           | > 85      |
| Page load time (LCP)             | < 2.5s    |

---

## 8. Timeline

| Milestone                      | Date   |
|--------------------------------|--------|
| Planning docs finalized        | Day 1  |
| Supabase schema + seed         | Day 1  |
| Auth + middleware              | Day 1-2|
| My Availability tab            | Day 2  |
| Team tab + Realtime            | Day 2-3|
| Polish + mobile                | Day 3  |
| Deploy to Vercel               | Day 3  |
