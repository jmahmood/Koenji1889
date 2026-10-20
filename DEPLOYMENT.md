# Deploying Koenji Railway Club 1889

This guide deploys the current application on one Linux server with a domain and HTTPS. It uses Ubuntu 24.04 LTS, Nginx, Python 3.12, and systemd. Replace `play.example.com`, `SERVER_IP`, and `deploy` (your SSH user) throughout. Commands marked **local** run on your computer; other commands run over SSH on the server. No server has been provisioned by writing this guide.

## 1. What needs to run

```text
Browser → https://play.example.com
                    │
                  Nginx
                    ├── /                → built frontend files
                    ├── /api/...         → 127.0.0.1:8789
                    └── /health          → 127.0.0.1:8789
                                                │
                                      server_bridge.py
                                                │
                                  /var/lib/koenji/games.sqlite3
```

Use the **inner `koenji-1889` directory** as the application root. The starter package also has a different top-level package.json, index.html, and dist directory. Building or uploading those would deploy the wrong application.

Expanded route demos also require the `fixtures/` directory next to `server_bridge.py`; include `fixtures/route_networks.json` when copying backend runtime files.

The actual backend entry point is `python3 server_bridge.py`. It imports the included `daemon18xx/app` rules engine and reads `src/data/appearance.json`. Its runtime uses Python's standard library; it does not need pip packages, FastAPI, Redis, PostgreSQL, or a separate worker. Node is needed only to build the frontend. Clients synchronize through HTTP polling, so no WebSocket configuration is needed.

**Do not substitute `daemon18xx/compose.yaml`, its Dockerfile, or `uvicorn backend.server:app` for this service.** Those run the standalone Daemon18xx API rather than the Koenji bridge. This frontend requires the bridge's additional invitation, appearance, lobby, social, history, and fixture behavior. The `old/multiplayer` containers are archived software.

The browser currently requests same-origin `/api/...` URLs. Serving frontend and API through the same domain works without code changes or a frontend API environment variable. Host at the domain root, not under `/koenji/`; the current application uses root-relative paths.

## 2. Hosting scope and current limitations

This is a practical deployment of the current code for a small club, not a claim that it is hardened for a large public service. The bridge uses `ThreadingHTTPServer`; Python explicitly advises against production use of `http.server` because its security checks are basic. Nginx provides TLS and a boundary around it, but does not turn it into a fully hardened application server. See [Python's documentation](https://docs.python.org/3.12/library/http.server.html).

Run **one bridge process on one machine**. Game locks are in process memory; adding multiple workers or replicas needs a concurrency review. SQLite needs durable local storage, not an ephemeral serverless filesystem or a shared network filesystem.

The app has bearer seat/host credentials, not account login or password recovery. Invitation URLs and browser storage carry access credentials. Anyone who learns a room code may be able to claim an unclaimed seat under the current lobby flow. For private play, share room links only with intended participants; use a VPN or an additional access layer if you need enforced membership. Losing browser storage can lose access unless a private invitation/credential was retained. Database backups also contain credentials.

The example proxy blocks `/api/1889/dev/` and `/test` on the public site. `/test` is already development-only in frontend code. Demo UI may still be visible; fixture buttons will fail against the blocked endpoint. This does not replace a full audit of demo capabilities. The bridge sends wildcard CORS headers and has no built-in production-mode switch; the proxy below hides those headers. For an unrestricted public launch, further work should include a supported production HTTP adapter, request/rate limits designed for actual traffic, a review of room creation/claims and credential handling, and production gating of development tools.

## 3. Prepare the frontend locally

Use a maintained Node LTS version compatible with the installed Vite version (for example Node 22). From the starter package:

```bash
# LOCAL
cd /Users/jmahmood/Downloads/Koenji_1889_Codex_Starter_Package/koenji-1889
npm install
npm run build
```

The current checkout uses a node_modules symlink to the starter package and has no app-level lockfile. `npm install` is the bootstrap command for a standalone copy; it may generate `package-lock.json`. Retain and version that app-level lockfile for repeatable builds, then use `npm ci` for subsequent clean builds. Do not copy your Mac's node_modules to Linux. Do not run the outer package's build.

The output is `koenji-1889/dist/`. Vite copies `public/` assets, including music, into it. Audit the resulting files before publication: the current public directory includes an audio testing dashboard as well as application assets. Publish only material you intend to make accessible and have permission to share, including portraits and music.

For regression checks on a development machine with the appropriate test dependencies:

```bash
npm test
```

This full test script also runs bundled engine tests. See `daemon18xx/requirements.txt` if those tests need dependencies; they are not requirements for running the bridge itself. Build and test before uploading a new release.

## 4. Prepare the server and DNS

Use a Linux VPS with persistent disk and SSH access. A small VPS is a starting point; measure memory, CPU, response times and database growth with your actual games before sizing for more users.

Create an A record for `play.example.com` pointing to the server's public IPv4 address. Add an AAAA record only if the server is correctly reachable over IPv6. Allow inbound SSH and TCP 80/443 in your hosting provider's firewall. Do not open 8789, 5173 or 4173 publicly.

```bash
# SERVER (Ubuntu 24.04)
sudo apt update
sudo apt install -y nginx python3.12 rsync sqlite3 certbot python3-certbot-nginx
sudo adduser --system --group --home /var/lib/koenji --no-create-home koenji
sudo install -d -o root -g root -m 755 /opt/koenji /var/www/koenji
sudo install -d -o koenji -g koenji -m 700 /var/lib/koenji
sudo install -d -o root -g root -m 700 /var/backups/koenji
```

These instructions assume the `koenji` system user is new. On a previously configured server, inspect the existing account/directories rather than recreating them. If using UFW, allow your actual SSH port before enabling it so you do not lock yourself out:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Use your custom SSH port instead of `OpenSSH` if applicable. Both the provider firewall and host firewall must allow HTTP/HTTPS.

## 5. Upload the application

Create a staging directory owned by your SSH user:

```bash
# SERVER, logged in as your normal deployment user
mkdir -p ~/koenji-upload
```

Upload from inside the **inner** application directory:

```bash
# LOCAL
rsync -av \
  --exclude '.git' --exclude 'node_modules' --exclude '__pycache__' \
  --exclude '*.pyc' --exclude '.DS_Store' --exclude 'data/' \
  --exclude 'validation/' --exclude 'private_assets/' \
  --exclude 'daemon18xx/old/' \
  ./ deploy@SERVER_IP:koenji-upload/
```

The trailing slash on `./` means copy the directory contents. This intentionally does not copy local saved games. The excluded archive stays in your source checkout; it is not needed by the deployed bridge. Inspect staging for any other private or unneeded files before installation.

```bash
# SERVER
sudo rsync -a --exclude dist/ ~/koenji-upload/ /opt/koenji/
sudo rsync -a ~/koenji-upload/dist/ /var/www/koenji/
sudo chown -R root:root /opt/koenji /var/www/koenji
sudo chmod -R a+rX /opt/koenji /var/www/koenji
```

Only `/var/www/koenji` is served as static content. Never set Nginx's root to the source directory: it contains backend code and may contain private data. The backend can read `/opt/koenji` but writes only to its separate data directory.

## 6. Install the backend as a service

Create `/etc/systemd/system/koenji.service`:

```bash
sudo tee /etc/systemd/system/koenji.service > /dev/null <<'UNIT'
[Unit]
Description=Koenji 1889 game backend
After=network.target

[Service]
Type=simple
User=koenji
Group=koenji
WorkingDirectory=/opt/koenji
Environment=PYTHONUNBUFFERED=1
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=KOENJI_BACKEND_HOST=127.0.0.1
Environment=KOENJI_BACKEND_PORT=8789
Environment=DAEMON18XX_DATABASE=/var/lib/koenji/games.sqlite3
ExecStart=/usr/bin/python3.12 /opt/koenji/server_bridge.py
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/koenji

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now koenji
sudo systemctl status koenji --no-pager
curl --fail http://127.0.0.1:8789/health
```

Expected response: `{"status": "ok"}`. The service initializes a new database automatically. If you need existing local games, follow section 10 before inviting players.

Useful commands:

```bash
sudo journalctl -u koenji -n 100 --no-pager
sudo journalctl -u koenji -f
sudo systemctl restart koenji
sudo ss -ltnp
```

Verify that port 8789 listens only on `127.0.0.1`. Startup failures usually mean missing engine files, missing `src/data/appearance.json`, a wrong Python path, or database directory permissions.

Bridge settings:

| Variable | Default | Deployment value/purpose |
|---|---|---|
| `KOENJI_BACKEND_HOST` | `127.0.0.1` | Keep localhost when Nginx is on the same host |
| `KOENJI_BACKEND_PORT` | `8789` | Must match Nginx upstream |
| `DAEMON18XX_DATABASE` | app `data/games.sqlite3` | Absolute persistent path outside releases |
| `KOENJI_QUIET` | unset | `1` suppresses HTTP access logging; keep logs while commissioning |

`DAEMON18XX_URL` is used by Vite's development/preview proxy, not by the deployed static frontend. `DAEMON18XX_CORS_ORIGINS` belongs to the standalone Daemon18xx service and does not configure the bridge. `npm run backend` starts the bridge interactively; systemd replaces that shell command in this deployment.

## 7. Configure Nginx

Create `/etc/nginx/sites-available/koenji`, replacing the domain:

```bash
sudo tee /etc/nginx/sites-available/koenji > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name play.example.com;
    root /var/www/koenji;
    index index.html;

    # Invitation query strings can carry credentials: do not log them.
    access_log off;
    client_max_body_size 1m;
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Content-Type-Options "nosniff" always;

    location = /test { return 404; }
    location ^~ /test/ { return 404; }
    location = /api/1889/dev { return 404; }
    location ^~ /api/1889/dev/ { return 404; }

    location /api/ {
        # No trailing slash: preserve the /api/... URI upstream.
        proxy_pass http://127.0.0.1:8789;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 120s;
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Headers;
        add_header Cache-Control "no-store" always;
        add_header Referrer-Policy "no-referrer" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8789;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
        proxy_hide_header Access-Control-Allow-Origin;
        add_header Cache-Control "no-store" always;
        add_header Referrer-Policy "no-referrer" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location ~ /\. { deny all; }

    # Avoid caching the HTML entry point across releases.
    location = /index.html {
        add_header Cache-Control "no-cache" always;
        add_header Referrer-Policy "no-referrer" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Assets include both generated bundles and non-hashed public files.
    location /assets/ { try_files $uri =404; }
    location /music/ { try_files $uri =404; }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
sudo ln -s /etc/nginx/sites-available/koenji /etc/nginx/sites-enabled/koenji
sudo nginx -t
sudo systemctl reload nginx
```

On a server already hosting sites, keep its other server blocks and only add this domain's configuration. The symlink command is a one-time setup. If the default site catches requests made by IP address, test with the real domain or a Host header:

```bash
curl --fail -H 'Host: play.example.com' http://127.0.0.1/health
curl --fail -H 'Host: play.example.com' http://127.0.0.1/api/1889/catalog -o /dev/null
```

No API responses should be cached by a CDN or another proxy. Nginx `proxy_pass` URI behavior matters here: adding a trailing `/` would strip the `/api/` prefix in this configuration. See [Nginx proxy documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) and [static file routing](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/).

## 8. Enable HTTPS

Once DNS points to the server and HTTP is publicly reachable:

```bash
sudo certbot --nginx -d play.example.com --redirect
sudo nginx -t
sudo certbot renew --dry-run
systemctl list-timers --all | rg certbot
```

If `rg` is not installed on the server, use `grep certbot` for the last command. Complete Certbot's email/terms prompts. Verify that your chosen package installation provides an automatic renewal timer. These commands use Ubuntu's packaged Certbot; do not mix an apt installation with a separate snap installation. See [Ubuntu's HTTPS/Certbot instructions](https://ubuntu.com/server/docs/how-to/security/obtain-tls-certificates/) for platform details.

Test before distributing invitation links; generate and share links on the final HTTPS domain. Localhost, HTTP and HTTPS are different browser storage origins, so a local login does not automatically transfer to the hosted site.

## 9. Verify the full deployment

From your computer:

```bash
curl --fail https://play.example.com/health
curl --fail https://play.example.com/api/1889/catalog -o /dev/null
curl -I https://play.example.com/
curl -i -X POST https://play.example.com/api/1889/dev/fixture
```

Expect health/catalog success, a successful HTML response, and `404` for the fixture endpoint. A successful frontend response alone does not prove the backend works.

In two separate browser profiles/devices:

1. Open the HTTPS site and create an ordinary two-player gathering.
2. Privately share the second player's invitation and claim the seat there.
3. Start the game as host and accept one legal action.
4. Confirm both browsers show the same revision and game position.
5. Refresh both pages and confirm the same seats and game resume.
6. Restart the backend with `sudo systemctl restart koenji`; confirm the room survives and clients recover.
7. Reboot during a planned test window; verify Nginx and the backend return automatically.
8. Check portraits, outfits, map, audio, and browser Network/Console for missing assets or API errors.

Do not use the development `/test` fixture for public acceptance testing; this configuration deliberately blocks it. Remote invitation links must contain the public domain, not `localhost` or a private IP. Anyone with a seat link can act as that seat, so keep credentials out of screenshots, tickets and logs.

## 10. Move existing local games (optional)

Skip this section to start with an empty hosted database. The bridge's usual local database is **`koenji-1889/data/games.sqlite3`**, not the standalone engine's data folder or its archived game.db. Check `DAEMON18XX_DATABASE` if you previously overrode it.

Stop the local development server/bridge while taking the migration snapshot, so you have a clear final revision. Use SQLite's backup operation:

```bash
# LOCAL, from the inner app directory; keep this snapshot private
sqlite3 data/games.sqlite3 ".backup '/tmp/koenji-migration.sqlite3'"
scp /tmp/koenji-migration.sqlite3 deploy@SERVER_IP:koenji-migration.sqlite3
```

Before replacing any existing hosted database, make a server backup using section 11. Then:

```bash
# SERVER
sudo systemctl stop koenji
sudo install -o koenji -g koenji -m 600 ~/koenji-migration.sqlite3 /var/lib/koenji/games.sqlite3
sudo systemctl start koenji
curl --fail http://127.0.0.1:8789/health
rm ~/koenji-migration.sqlite3
```

This replaces the hosted database; it does not merge local and hosted games. Restoring the same database preserves its credentials, but does not copy browser localStorage from localhost to the public domain. Keep the original host/seat invitations privately and use them to rejoin on the hosted origin. Check that you can actually rejoin before discarding any originals. Remove temporary migration copies after verification.

## 11. Backups and restore

Back up before every update and regularly while games are active. SQLite's backup operation produces a consistent snapshot while the service is running; copying the live database file with ordinary `cp` does not provide that guarantee.

```bash
# SERVER
sudo sqlite3 /var/lib/koenji/games.sqlite3 ".backup '/var/backups/koenji/games-$(date -u +%Y%m%dT%H%M%SZ).sqlite3'"
```

For an automatic daily backup, create `/etc/cron.d/koenji-backup` containing this single line (cron requires escaping the percent signs):

```cron
15 3 * * * root /usr/bin/sqlite3 /var/lib/koenji/games.sqlite3 ".backup '/var/backups/koenji/games-$(date -u +\%Y\%m\%dT\%H\%M\%SZ).sqlite3'"
```

The job runs at 03:15 in the **server's timezone**. Ensure cron is installed/running if you use this option. Arrange encrypted off-server copies, monitor failed jobs and free disk space, and choose a retention policy. These files include host and player credentials; keep the backup directory root-only. A backup on the same VPS does not protect against losing the VPS.

To restore a selected backup (replace the filename):

```bash
sudo sqlite3 /var/backups/koenji/games-TIMESTAMP.sqlite3 'PRAGMA integrity_check;'
sudo systemctl stop koenji
sudo install -o koenji -g koenji -m 600 /var/backups/koenji/games-TIMESTAMP.sqlite3 /var/lib/koenji/games.sqlite3
sudo systemctl start koenji
curl --fail http://127.0.0.1:8789/health
```

Expect `ok` from the integrity check. Take a backup of the current database before restoring; restoration discards all actions after the chosen snapshot. Test restoration on an isolated copy periodically, including joining a room and reading its history. Do not attach a second live backend to the production database for a restore test.

## 12. Updates and rollback

Plan a brief maintenance window for backend changes. Keep frontend and bridge from the same source revision; preserve the database separately.

1. Build and validate the new application locally, then upload to staging as in sections 3 and 5.
2. Take a database backup. Record the exact backup path and the current source revision or archive.
3. Stop the bridge and save copies of the currently deployed directories:

```bash
sudo systemctl stop koenji
sudo cp -a /opt/koenji /opt/koenji-previous
sudo cp -a /var/www/koenji /var/www/koenji-previous
```

The `-previous` directories must not already exist. Archive or rename an older rollback copy deliberately before reusing these names.

4. Copy the staged backend and built files as in section 5, then restart:

```bash
sudo systemctl start koenji
curl --fail http://127.0.0.1:8789/health
```

5. Run the two-browser smoke check and inspect logs. The copy commands intentionally retain old static assets so existing tabs can still request prior hashed bundles; refresh tabs after deployment. Retaining assets uses disk space. Remove obsolete files only after the rollback window and a deliberate review. Source files removed by a future release also need explicit cleanup or a fresh release directory.

If the new release fails, stop the service, move the failed app/static directories aside, restore the `-previous` directories to their original paths, and restart. Roll back frontend and backend together. Do not blindly restore an old database if players have made new moves: that loses those moves. If a new release changes the schema incompatibly, use its migration plan or restore the matching pre-update snapshot during maintenance with explicit awareness of the lost actions.

## 13. Troubleshooting

| Symptom | Check |
|---|---|
| Nginx 502 | `systemctl status koenji`, journal logs, local `/health`, upstream port |
| HTML loads but no game/catalog | `/api/` proxy routing; make sure the API response is JSON rather than index.html |
| Room disappears after restart | Absolute database path, persistent disk, file ownership; check whether a new empty DB was opened |
| Missing portraits/audio | Built the inner application; uploaded all of dist including public assets; inspect Network 404s |
| Database locked | Accidental second bridge process, full/slow disk, long requests; keep one process |
| Fixture button fails | Expected: public `/api/1889/dev/` is blocked |
| Invite works locally only | Link origin, retained credentials and final HTTPS domain |
| Certificate issue | DNS A/AAAA, TCP 80/443 reachability, matching server_name and renewal timer |
| Changes do not appear | Rebuild/upload the inner dist; reload browser; bypass any CDN HTML/API cache |
| 413 response | Nginx request body limit; inspect the actual payload before raising it |
| Route planning times out | Inspect CPU and backend logs; measure the operation before adjusting timeouts |

Useful Nginx diagnostics are `sudo nginx -t` and `sudo tail -n 100 /var/log/nginx/error.log`. Treat logs as private; error logs can still contain request details even though access logging is disabled.

## 14. Other hosting arrangements

- **An existing Apache/Caddy web server:** use the same split: serve the built dist, proxy `/api/` and `/health` unchanged to the bridge, block development routes, require HTTPS, and retain SQLite outside releases.
- **Static hosting/CDN:** hosting dist alone cannot run games. Add a persistent Python host and route `/api/` on the frontend origin to it. A separate API domain requires frontend configuration/code changes and a CORS review; this app currently uses relative API URLs.
- **Docker:** possible, but requires a Koenji-specific image that includes server_bridge.py, the engine, and src/data/appearance.json, with a durable volume and one backend replica. The included standalone-engine Compose file is not a full-stack deployment of this application.
- **Shared hosting:** suitable only if it supports an always-running Python process, reverse proxy routes, and durable writable disk. PHP-only or static-only hosting is insufficient.
- **Multiple replicas/serverless:** not supported by this deployment model. Review locking, persistence, credentials, and HTTP serving before adopting it.

## References

- [Python HTTP server security limitations](https://docs.python.org/3.12/library/http.server.html)
- [Nginx proxy_pass and URI handling](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Nginx static file routing](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)
- [Ubuntu HTTPS certificates with Certbot](https://ubuntu.com/server/docs/how-to/security/obtain-tls-certificates/)
