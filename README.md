# Life Admin Companion

A self-hosted, full-stack web app for managing everyday life admin — bills, renewals, warranties, appointments, and deadlines. Private by design: all data belongs to you.

---

## Architecture

| Layer | Technology | Role |
|---|---|---|
| Frontend | React + Vite (static files) | UI, served by nginx |
| API | Express (Node.js) | Backend, runs on port 8080 |
| Database | PostgreSQL | Persistent storage |
| Auth | Firebase Auth (email/password) | User authentication |
| Reverse proxy | nginx | Routes traffic, serves static files |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Ubuntu | 22.04 LTS or later | Other Debian-based distros work too |
| Node.js | 24.x | See install steps below |
| pnpm | 10.x | Installed via corepack |
| PostgreSQL | 14 or later | |
| nginx | Latest stable | |
| A Firebase project | — | Email/password auth must be enabled |

---

## 1. Server preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx postgresql postgresql-contrib
```

### Install Node.js 24

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v24.x.x
```

### Enable pnpm via corepack

```bash
sudo corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

---

## 2. PostgreSQL setup

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell:

```sql
CREATE USER lifeadmin WITH PASSWORD 'your_strong_password';
CREATE DATABASE life_admin OWNER lifeadmin;
GRANT ALL PRIVILEGES ON DATABASE life_admin TO lifeadmin;
\q
```

Note your connection string — you will need it for the environment file:

```
postgresql://lifeadmin:your_strong_password@localhost:5432/life_admin
```

---

## 3. Firebase project setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project (or use an existing one).
2. Enable **Email/Password** sign-in: **Authentication → Sign-in method → Email/Password → Enable**.
3. Get your **web app config**: **Project Settings → Your Apps → Web App → SDK setup and configuration**.
4. Get your **service account key**: **Project Settings → Service Accounts → Generate new private key**. This downloads a JSON file — keep it secure.

---

## 4. Clone the repository

```bash
sudo mkdir -p /srv/lifeadmin
sudo chown $USER:$USER /srv/lifeadmin
git clone <your-repo-url> /srv/lifeadmin
cd /srv/lifeadmin
```

---

## 5. Install dependencies

```bash
pnpm install
```

---

## 6. Configure environment variables

### API server

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
nano artifacts/api-server/.env
```

Fill in:

```env
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# Your PostgreSQL connection string from step 2
DATABASE_URL=postgresql://lifeadmin:your_strong_password@localhost:5432/life_admin

# A long random string — generate with:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your_64_char_random_string_here

# Paste the entire contents of the Firebase service account JSON file as a single line
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Optional — email reminders (leave blank to disable)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
```

### Frontend

```bash
cp artifacts/life-admin/.env.example artifacts/life-admin/.env
nano artifacts/life-admin/.env
```

Fill in your Firebase web app config from step 3:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Database migrations tool

```bash
cp lib/db/.env.example lib/db/.env
nano lib/db/.env
```

```env
DATABASE_URL=postgresql://lifeadmin:your_strong_password@localhost:5432/life_admin
```

---

## 7. Run database migrations

This creates all required tables in your PostgreSQL database:

```bash
pnpm --filter @workspace/db run push
```

---

## 8. Build

Build both the API server and the frontend:

```bash
# Build API server (compiles TypeScript to dist/)
pnpm --filter @workspace/api-server run build

# Build frontend (outputs static files to artifacts/life-admin/dist/public/)
pnpm --filter @workspace/life-admin run build
```

---

## 9. Run the API server with systemd

Create a systemd service so the API server starts automatically and restarts on failure.

```bash
sudo nano /etc/systemd/system/lifeadmin-api.service
```

Paste the following (replace `/srv/lifeadmin` and the user if different):

```ini
[Unit]
Description=Life Admin Companion API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/lifeadmin
ExecStart=/usr/bin/node --enable-source-maps artifacts/api-server/dist/index.mjs
Restart=on-failure
RestartSec=5

# Load environment variables
EnvironmentFile=/srv/lifeadmin/artifacts/api-server/.env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lifeadmin-api

[Install]
WantedBy=multi-user.target
```

Give www-data access to the project directory:

```bash
sudo chown -R www-data:www-data /srv/lifeadmin
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lifeadmin-api
sudo systemctl start lifeadmin-api

# Check it started cleanly
sudo systemctl status lifeadmin-api
sudo journalctl -u lifeadmin-api -f
```

---

## 10. Configure nginx

Create the nginx site config:

```bash
sudo nano /etc/nginx/sites-available/lifeadmin
```

Paste (replace `your-domain.com` with your actual domain or server IP):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve the frontend static files
    root /srv/lifeadmin/artifacts/life-admin/dist/public;
    index index.html;

    # Frontend — all non-API routes go to index.html (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API — proxy to the Express server
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Needed for session cookies to work correctly
        proxy_set_header Cookie $http_cookie;
        proxy_pass_header Set-Cookie;
    }
}
```

Enable the site and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/lifeadmin /etc/nginx/sites-enabled/
sudo nginx -t          # test the config first
sudo systemctl reload nginx
```

Your app should now be reachable at `http://your-domain.com`.

---

## 11. Enable HTTPS with Let's Encrypt (recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update your nginx config and set up auto-renewal.

---

## 12. Updating to a new version

```bash
cd /srv/lifeadmin
git pull

pnpm install

# Re-run migrations in case the schema changed
pnpm --filter @workspace/db run push

# Rebuild
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/life-admin run build

# Restart the API server
sudo systemctl restart lifeadmin-api
```

The frontend update is picked up by nginx immediately since it reads directly from the `dist/public` directory.

---

## Troubleshooting

### API server won't start

Check the logs:

```bash
sudo journalctl -u lifeadmin-api -n 100 --no-pager
```

Common causes:
- `PORT` not set or in use — confirm `artifacts/api-server/.env` is correct and no other process is on port 8080
- `DATABASE_URL` wrong — test with `psql "$DATABASE_URL"` from the project root
- `FIREBASE_SERVICE_ACCOUNT_JSON` malformed — must be a single-line JSON string with no surrounding quotes beyond the object braces

### Login not working

- Confirm Firebase Email/Password sign-in is enabled in the Firebase Console
- Confirm `VITE_FIREBASE_*` values in `artifacts/life-admin/.env` match your Firebase project exactly (these are baked into the frontend build — rebuild after changing them)
- Check the API logs for `FIREBASE_SERVICE_ACCOUNT_JSON is not set` or token verification errors

### Email reminders not sending

- All five SMTP variables must be set (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`)
- For Gmail: use an [App Password](https://myaccount.google.com/apppasswords), not your main account password
- Restart the API server after changing SMTP settings

### nginx 502 Bad Gateway

The API server is not running or not listening on port 8080. Check:

```bash
sudo systemctl status lifeadmin-api
curl http://127.0.0.1:8080/api/healthz
```

---

## Directory structure reference

```
/srv/lifeadmin/
├── artifacts/
│   ├── api-server/
│   │   ├── .env                  ← server environment variables (not committed)
│   │   ├── dist/index.mjs        ← compiled API server (after build)
│   │   └── .env.example          ← template
│   └── life-admin/
│       ├── .env                  ← frontend build-time variables (not committed)
│       ├── dist/public/          ← compiled static files (after build)
│       └── .env.example          ← template
└── lib/
    └── db/
        ├── .env                  ← used by drizzle-kit for migrations (not committed)
        └── .env.example          ← template
```
