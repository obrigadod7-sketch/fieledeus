# Watizat / fieledeus – PRD
## Problem
Chat (Conversar) not sending messages, Agenda button broken, messages not reaching other user, videos not sending. Add automatic motivational messages in feed every 1 minute.
## Root cause
Repo commits on 2026-11-01 replaced backend/server.py with a ~300-line version (only auth + AI chat). All /api/messages, /api/appointments, /api/conversations, posts, etc. were gone.
## Done (2026-06)
- Restored full backend from commit d4a6412 (all routes)
- Legacy users (created with _id only, no `id`) auto-migrated on login/auth/startup
- emergentintegrations import optional (Render)
- New /api/chat-media (GridFS, 25MB, range streaming) for chat photos/videos; DirectChatPage uploads via multipart
- MotivationTicker in feed rotates message every 60s
## Backlog
- P1: Unread message badges; notifications
- P2: Admin-editable motivational messages

## Paid version (paused, 2026-06)
User asked to make app paid (R$19,90/mês subscription via PIX Mercado Pago + professionals charge per booking, 10% fee, texts volunteer->profissional, migrant->cliente).
Implemented then reverted at user's request so they can save the free version to GitHub first.
Full patch saved at /root/paid_version.patch (apply with `cd /app && git apply /root/paid_version.patch`). Needs MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET.

## 2026-06 additions
- Feed card: Bible verse (12 verses) + motivational message, each rotating every 60s (MotivationTicker.js)
- Appointment reminder: backend loop every 5 min posts a chat reminder within 24h before accepted appointments (America/Sao_Paulo time), once per appointment
