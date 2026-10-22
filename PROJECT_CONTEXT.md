# Event Team Formation Platform Project Rules

Full-stack app helping college students find teammates for hackathons, competitions, exhibitions and cultural events.

## Stack
- Frontend React (Vite), React Router, plain CSS (CSS variables) or Tailwind, lucide-react icons
- Backend Node.js + Express (REST), folder structure routes controllers middleware services validators
- DB + Auth Supabase PostgreSQL + Supabase Auth
- Validation Zod on every backend input
- Optional Socket.IO for realtime notifications (built LAST)
- Deploy Vercel (frontend), Render (backend)

## Architecture rules
- Frontend logs inregisters via Supabase Auth, then sends the JWT as `Authorization Bearer token` to Express.
- Express verifies the JWT on every protected route (supabase.auth.getUser) and attaches req.user.
- The Supabase SERVICE ROLE key lives ONLY in backend .env. Never in frontend code.
- ALL permission checks are enforced in the backend. Never trust the frontend.
- Enable RLS on every table as a second layer of defense.
- All secrets in .env; provide .env.example files.

## Business rules (must never be violated)
1. Only logged-in users can create teams or send join requests.
2. Creating a team automatically makes the creator its leader (and inserts them into team_members).
3. Only the leader can editdelete their team and acceptreject its requests.
4. No duplicate PENDING request from the same user to the same team.
5. A team can never exceed max_members. Accepting a request must be ATOMIC (use a Postgres function with row locking).
6. Only accepted requests add a user to team_members.
7. A leader cannot request to join their own team; existing members cannot request again.
8. Users can only editdelete their own resources; admins can manage all.

## Skill match
match% = round(matched_required_skills  total_required_skills  100). Case-insensitive, trimmed. Shared utility used by the UI. Example team needs Python, React, SQL; student knows Python, SQL → 67%.

## UI rules
Modern, clean, professional. Consistent color palette via CSS variables, cards, icons, good spacing, responsive (mobile-first). Every async action needs a loading state, success toast, and error message. Empty states on every list. Every button and form must actually work no dead UI, no placeholder data.

## Working rules
- Work only on the current module. Do not build ahead.
- After each module run it, fix errors, then give me a checklist of what to manually test.
- Ask me before changing the schema or these rules.