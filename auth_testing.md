# Auth testing
- Admin seeded idempotently on startup (server.py seed_admin) from ADMIN_EMAIL/ADMIN_PASSWORD.
- mongosh: use test_database; db.users.find({role:"admin"}) -> password starts with $2b$
- curl -X POST $API/api/auth/login -d '{"email":"admin@fieledeus.com","password":"FielAdmin2026!"}' -> token; GET /api/admin/stats with Bearer -> 200
- Non-admin (maria@teste.com) GET /api/admin/stats -> 403; visiting /admin redirects to /home
