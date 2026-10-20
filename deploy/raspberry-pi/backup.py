#!/usr/bin/env python3
"""Create a consistent SQLite snapshot; retain the latest 14 daily snapshots."""
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

os.umask(0o077)
root = Path.home() / 'koenji'
backups = root / 'backups'
backups.mkdir(mode=0o700, exist_ok=True)
target = backups / ('games-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.sqlite3')
with sqlite3.connect(str(root / 'data/games.sqlite3')) as source:
    with sqlite3.connect(str(target)) as destination:
        source.backup(destination)
        if destination.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Backup integrity check failed')
# Only prune this script's own snapshots after a verified backup.
for old in sorted(backups.glob('games-*.sqlite3'), reverse=True)[14:]:
    old.unlink()
print('Verified backup:', target.name)
