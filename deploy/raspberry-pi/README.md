# Installed Raspberry Pi deployment

The home installation accepts **http://1889.local:8080**, **http://raspberrypi.local:8080**, and **http://10.0.0.30:8080**. The hostnames require local name resolution on the client. HTTPS on port 443 belongs to the existing Pi-hole setup; the game uses HTTP on port 8080.

`koenji-local-name.service` advertises `1889.local` as an additional mDNS name for `10.0.0.30`, keeping the Pi's hostname `raspberrypi`. This user service is enabled at boot through the existing user linger setting. It runs the distro's `avahi-publish -a -R -f` against the existing system Avahi daemon. The `-R` option leaves reverse-name advertising to the Pi's primary hostname. The `avahi-utils` and `libavahi-client3` packages were downloaded with `apt-get download` and extracted with `dpkg-deb -x` into `/home/jawaad/koenji/tools/avahi/extracted`; these private copies require manual updates like the private Nginx copy. If the Pi's reserved IP changes, also update the address in `~/.config/systemd/user/koenji-local-name.service`, run `systemctl --user daemon-reload`, and restart that service.

Manage the alias with `systemctl --user status koenji-local-name.service` or `systemctl --user restart koenji-local-name.service`. To remove it, run `systemctl --user disable --now koenji-local-name.service`. Name resolution and `/health` through `1889.local:8080` were verified from the Mac after installation; a full reboot was not performed.

Target: `jawaad@10.0.0.30`, Raspberry Pi 2, ARMv7, Raspbian 13, Python 3.13.5.
The source app was built on the Mac; only static output and required Python files were transferred. Local saved games were not transferred. A separate two-player deployment verification game was created on the Pi.

## Port-free hostname access (staged; administrator activation required)

The `frontdoor/` files are staged at `/home/jawaad/koenji/tools/port-free/`. Hostname routing was tested on a temporary loopback-only port: `1889.local` served the game HTML and health endpoint, while `pi.hole` and the Pi's IPv4 address served Pi-hole administration. Port 80 has **not** been changed yet because the SSH account requires a password for sudo.

To activate, run from the Mac's Terminal:

```sh
ssh -t jawaad@10.0.0.30 'sudo python3 /home/jawaad/koenji/tools/port-free/install.py'
```

The installer saves the original Pi-hole ports and configuration under root-only `/var/lib/koenji-frontdoor/`, moves Pi-hole HTTP to `127.0.0.1:8081`, and preserves its existing HTTPS listeners. FTL restarts once, briefly interrupting DNS. A separate system service listens on IPv4 `10.0.0.30:80` and routes `1889.local` to the existing game on port 8080; other HTTP hostnames go to Pi-hole. The IPv6 port-80 listener continues serving Pi-hole. The game backend and database are not restarted or modified. The original port-8080 game address continues working.

The frontdoor service runs as `jawaad` with only the capability to bind privileged ports; its Nginx binary and configuration are root-owned under `/opt/koenji-frontdoor/` and `/etc/koenji-frontdoor/`. This binary is copied from the existing extracted distro Nginx and also needs manual security updates. `systemctl status koenji-frontdoor` shows service status. Activation checks game HTML, game health, Pi-hole administration, and DNS, and attempts to restore the original ports if activation fails.

Manual rollback:

```sh
ssh -t jawaad@10.0.0.30 'sudo python3 /home/jawaad/koenji/tools/port-free/install.py --rollback'
```

Rollback disables the proxy and restores the original Pi-hole HTTP ports; game access on port 8080 remains available. Keep using the same browser origin for game credentials, or rejoin via an invitation when changing from `1889.local:8080` to `1889.local`.

## Layout

- `/home/jawaad/koenji/app`: server_bridge.py, appearance catalog, bundled 1889 engine
- `/home/jawaad/koenji/www`: built frontend
- `/home/jawaad/koenji/data/games.sqlite3`: persistent games and credentials
- `/home/jawaad/koenji/nginx/nginx.conf`: web configuration
- `/home/jawaad/koenji/tools/extracted`: locally extracted Raspbian Nginx 1.26.3-3+deb13u9 and nginx-common packages
- `/home/jawaad/koenji/backups`: latest 14 verified SQLite snapshots
- `/home/jawaad/.config/systemd/user/koenji-*`: user services and backup timer

Pi-hole retains ports 80/443. The game web server binds only IPv4 `10.0.0.30:8080`; the backend binds `127.0.0.1:8789`. No router forwarding or global IPv6 listener was added. HTTP is intended for the trusted home network. The existing user linger setting was already enabled, so user services can start without an interactive login.

Reserve `10.0.0.30` for this Pi in the router's DHCP settings. If the address changes, update `listen` in nginx.conf and use the new URL. Browser credentials are tied to the URL origin; consistently use the same address. Switching between the IP and raspberrypi.local does not transfer saved browser credentials; rejoin using an invitation link with the new hostname if needed. The backup timer runs daily at 03:15 UTC (21:15 the previous day in Edmonton during daylight saving time, 20:15 during standard time).

## Manage over SSH

```bash
ssh jawaad@10.0.0.30
systemctl --user status koenji-backend koenji-web
systemctl --user restart koenji-backend koenji-web
systemctl --user list-timers koenji-backup.timer
systemctl --user start koenji-backup.service
systemctl --user stop koenji-web koenji-backend
```

Stop commands are for maintenance; start again with `systemctl --user start koenji-backend koenji-web`.

Logs:

```bash
systemctl --user status koenji-backend --no-pager -n 30
tail -n 30 ~/koenji/nginx/logs/error.log
```

`journalctl --user` did not expose journal files in this account during setup; service status did expose recent output. Nginx access logs are off to avoid logging invitation query credentials. Treat any error logs as private.

## Backups and recovery

`backup.py` uses SQLite's backup API, validates the result, and keeps the latest 14 snapshots. Keep private off-Pi copies as well: snapshots on the same SD card do not protect against card failure. Never upload the data or backup folders publicly.

Restore a selected snapshot during maintenance, after making a backup of the current database:

```bash
systemctl --user start koenji-backup.service
systemctl --user stop koenji-backend
cp ~/koenji/backups/SELECTED-SNAPSHOT.sqlite3 ~/koenji/data/games.sqlite3
chmod 600 ~/koenji/data/games.sqlite3
systemctl --user start koenji-backend
```

Restoring rewinds all games to the chosen snapshot. Verify health and rejoin the affected games afterward.

## Updates

Keep frontend and backend versions together. Build inside the local `koenji-1889` directory with `npm run build`, back up the Pi database, save copies of its current app/www directories, stop the two app services, and upload the rebuilt dist and corresponding backend files. Keep `data/` outside the upload. Start services and verify `/health`, room resume, and browser assets. See the full DEPLOYMENT.md for general deployment/rollback guidance; its root/system service commands do not apply verbatim to this user-service installation.

Nginx was extracted into the home directory because sudo requires a password and the system already runs Pi-hole. **System apt upgrades do not update this extracted copy.** Periodically refresh its private apt metadata, download updated `nginx` and `nginx-common` packages, extract them into a staging folder, test compatibility/configuration, and replace the extracted directory during maintenance. Keep a rollback copy. For long-term system-managed package updates, an administrator can instead install the distro nginx package and retain the dedicated port configuration after reviewing conflicts with Pi-hole.

## Validation performed

- Production frontend build passed (Vite reported its existing large-bundle advisory).
- LAN `/health` worked from the Mac.
- The Pi served the HTML, JavaScript, stylesheet, and appearance catalog.
- Two independent seat credentials claimed seats and started a normal game through Nginx.
- Both views had the same revision and resumed after a backend restart.
- `/test` and development API routes returned 404.
- First automatic-backup service run produced an integrity-checked snapshot containing the game.
- Backend, web service, and backup timer are enabled; user lingering was verified.

A full Pi reboot, visual browser playthrough, and late-game route-computation performance were not tested. Expect a short backend warm-up after restart on the Pi 2. The app's existing HTTP-server limitations remain; this installation is scoped to trusted home use.
