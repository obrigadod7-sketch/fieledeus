# PRD - fieledeus (Watizat / Ajuda na Europa)
## Original asks (chronological)
- Import repo obrigadod7-sketch/fieledeus; add scheduling in chat like AlloVoisins "Proposer un rendez-vous"
- Only helpers (helper/volunteer/association/admin) propose; migrant accepts, declines or proposes another time
- Video/voice calls, video upload in feed, password recovery
- Fix volunteer registration white screen; associations self-register; improve admin dashboard
- Conversar button in feed visible; appointments date/time visible to both sides
- Clone obrigadod7-sketch/igrejanovo and add "Igreja" tab

## Architecture
- FastAPI server.py + features.py (appointments, calls, video upload via Emergent object storage, password reset, associations, admin block/appointments)
- React CRA frontend; church Vite app source in /app/church, built (`cd /app/church && npx vite build`) into /app/frontend/public/igreja (HashRouter), shown at /church in iframe

## Done (2026-10)
- Appointments: propose dialog, accept/decline/reschedule turn-taking, address/notes hidden until accepted, .ics, map route, Jitsi link, /appointments page, pinned bar in chat, "Próximos encontros" on /home & /volunteers
- Calls in chat (Jitsi voice/video), feed video upload (≤50MB), forgot/reset password (email MOCKED - logged, needs RESEND_API_KEY)
- Volunteer register white-screen fix (422 arrays) + ErrorBoundary; register role whitelist (no admin self-signup)
- Associations: /association-register, /associations list, chat/scheduling
- Admin: extra stats, 8-week growth chart, associations tab, appointments tab, block/unblock (blocked can't log in)
- Feed Conversar teal pill; Igreja tab (all 137 church repo files)

## Backlog
- P1: Real reset emails (RESEND_API_KEY + verified sender)
- P1: Church site Supabase keys (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) for login/kids dashboards
- P2: SMS/push reminders before appointments; brute-force login lockout; scroll-margin for church anchors
- Admin header link to church dashboard (/igreja/#/dashboard). NOTE: church dashboard/login pages are placeholders in the original repo (no data/auth) - candidate to build next.
