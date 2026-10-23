#!/usr/bin/env python3
"""One-time Pi administrator activation, or --rollback to restore Pi-hole HTTP."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.request

SOURCE = Path(__file__).resolve().parent
STATE = Path('/var/lib/koenji-frontdoor')
UNIT = Path('/etc/systemd/system/koenji-frontdoor.service')
CONFIG = Path('/etc/koenji-frontdoor')
BINARY = Path('/opt/koenji-frontdoor')
NGINX = Path('/home/jawaad/koenji/tools/extracted/usr/sbin/nginx')
SERVICE = 'koenji-frontdoor.service'
HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True, timeout=60).stdout.strip()


def check_game():
    request = urllib.request.Request('http://10.0.0.30/health', headers={'Host': '1889.local'})
    with HTTP.open(request, timeout=10) as response:
        if json.load(response).get('status') != 'ok':
            raise RuntimeError('Game health check failed')
    request = urllib.request.Request('http://10.0.0.30/', headers={'Host': '1889.local'})
    with HTTP.open(request, timeout=10) as response:
        if b'<html' not in response.read().lower():
            raise RuntimeError('Game frontend check failed')


def check_pihole(url):
    with HTTP.open(url, timeout=10) as response:
        if b'pi-hole' not in response.read().lower():
            raise RuntimeError('Pi-hole administration page check failed')


def check_dns():
    answer = run('dig', '+short', '+time=3', '+tries=1', '@127.0.0.1', 'pi.hole')
    if not answer:
        raise RuntimeError('Pi-hole DNS check returned no answer')


def restart_pihole(url, timeout=240):
    previous = run('systemctl', 'show', 'pihole-FTL', '-p', 'InvocationID', '--value')
    print('Restarting Pi-hole; shutdown and startup may take several minutes...', flush=True)
    run('systemctl', '--no-block', 'restart', 'pihole-FTL')
    deadline = time.monotonic() + timeout
    next_update = time.monotonic() + 10
    last_error = None
    while time.monotonic() < deadline:
        try:
            current = run('systemctl', 'show', 'pihole-FTL', '-p', 'InvocationID', '--value')
            active = run('systemctl', 'show', 'pihole-FTL', '-p', 'ActiveState', '--value')
            if current and current != previous and active == 'active':
                check_pihole(url)
                check_dns()
                print('Pi-hole web interface and DNS are ready.', flush=True)
                return
        except Exception as error:
            last_error = error
        if time.monotonic() >= next_update:
            print('Still waiting for Pi-hole to finish restarting...', flush=True)
            next_update = time.monotonic() + 10
        time.sleep(2)
    raise RuntimeError('Pi-hole did not become ready within four minutes') from last_error


def restore():
    original = (STATE / 'original-ports.txt').read_text().strip()
    subprocess.run(['systemctl', 'disable', '--now', SERVICE], check=False, timeout=30)
    run('pihole-FTL', '--config', 'webserver.port', original)
    restart_pihole('http://10.0.0.30/admin/')
    (STATE / 'active').unlink(missing_ok=True)
    print('Restored Pi-hole HTTP ports. The game remains available on port 8080.')


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run with sudo; administrator access is required for port 80 and Pi-hole.')
    if sys.argv[1:] == ['--rollback']:
        restore()
        return
    if sys.argv[1:]:
        raise SystemExit('Usage: sudo python3 install.py [--rollback]')
    if (STATE / 'active').exists():
        check_game()
        check_pihole('http://10.0.0.30/admin/')
        print('Already installed and healthy: http://1889.local')
        return
    ports = run('pihole-FTL', '--config', 'webserver.port')
    retry = (STATE / 'original-ports.txt').is_file()
    if retry:
        if (STATE / 'original-ports.txt').read_text().strip() != ports:
            raise SystemExit('Pi-hole ports differ from the saved original; run --rollback before retrying.')
        print('Retrying from the restored original Pi-hole configuration.', flush=True)
    elif any(p.exists() for p in (STATE, UNIT, CONFIG, BINARY)):
        raise SystemExit('Unrecognized frontdoor files found; inspect them before installing.')
    entries = [item.strip() for item in ports.split(',')]
    if '80o' not in entries or '[::]:80o' not in entries:
        raise SystemExit('Unexpected Pi-hole HTTP configuration; no changes made.')
    # Keep every existing HTTPS listener; move HTTP to a loopback-only listener.
    new_ports = ','.join(['127.0.0.1:8081'] + [x for x in entries if x not in ('80o', '[::]:80o')])
    with HTTP.open('http://10.0.0.30:8080/health', timeout=10) as response:
        if json.load(response).get('status') != 'ok':
            raise RuntimeError('Existing game is not healthy; no changes made')
    check_pihole('http://10.0.0.30/admin/')
    listeners = run('ss', '-ltnH')
    if any(line.split()[3].endswith(':8081') for line in listeners.splitlines()):
        raise SystemExit('Port 8081 is already occupied; no changes made.')

    if not retry:
        STATE.mkdir(mode=0o700)
        (STATE / 'original-ports.txt').write_text(ports + '\n')
        shutil.copy2('/etc/pihole/pihole.toml', STATE / 'pihole.toml.before')
    BINARY.mkdir(mode=0o755, exist_ok=True)
    CONFIG.mkdir(mode=0o755, exist_ok=True)
    shutil.copyfile(NGINX, BINARY / 'nginx')
    (BINARY / 'nginx').chmod(0o755)
    shutil.copyfile(SOURCE / 'nginx.conf', CONFIG / 'nginx.conf')
    shutil.copyfile(SOURCE / SERVICE, UNIT)
    (CONFIG / 'nginx.conf').chmod(0o644)
    UNIT.chmod(0o644)
    run('systemd-analyze', 'verify', str(UNIT))
    run('systemctl', 'daemon-reload')
    try:
        print('Configuring Pi-hole HTTP and preserving its HTTPS settings...', flush=True)
        run('pihole-FTL', '--config', 'webserver.port', new_ports)
        # FTL serves DNS as well as HTTP, so DNS briefly restarts here.
        restart_pihole('http://127.0.0.1:8081/admin/')
        print('Starting hostname routing...', flush=True)
        run('systemctl', 'enable', '--now', SERVICE)
        for attempt in range(10):
            try:
                check_game()
                check_pihole('http://10.0.0.30/admin/')
                check_dns()
                break
            except Exception:
                if attempt == 9:
                    raise
                time.sleep(1)
    except BaseException as activation_error:
        print('Activation failed; restoring the original Pi-hole ports.', file=sys.stderr)
        try:
            restore()
        except BaseException as rollback_error:
            print(f'Rollback could not be verified: {rollback_error}', file=sys.stderr, flush=True)
            print('Run this installer with --rollback to retry recovery.', file=sys.stderr, flush=True)
            raise activation_error from rollback_error
        raise
    (STATE / 'active').write_text('http://1889.local\n')
    print('Installed and verified: http://1889.local')
    print('Pi-hole HTTP administration and DNS also passed verification. HTTPS settings were preserved.')


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as error:
        print(error.stdout or '', file=sys.stderr)
        print(error.stderr or '', file=sys.stderr)
        raise SystemExit(error.returncode)
