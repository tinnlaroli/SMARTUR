#!/usr/bin/env python3
import sys, subprocess, pathlib
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    sys.exit(0)

OFFSET_FILE = pathlib.Path('/tmp/smartur_tg_offset')
ENV_FILE    = pathlib.Path('/opt/SMARTUR/.env')

SERVICES = [
    'smartur-postgres',
    'smartur-api',
    'smartur-modelo',
    'smartur-plataforma',
    'smartur-landing',
    'smartur-nginx',
]

def read_env(key):
    try:
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith(key + '='):
                return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return ''

def inspect(name, fmt):
    try:
        return subprocess.check_output(
            ['docker', 'inspect', '--format', fmt, name],
            text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return ''

def build_status_message():
    now = datetime.now(timezone.utc).strftime('%H:%M UTC')
    lines = []
    all_ok = True

    for svc in SERVICES:
        short = svc.replace('smartur-', '')
        status = inspect(svc, '{{.State.Status}}') or 'missing'
        health = inspect(svc, '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}') or 'none'
        error  = inspect(svc, '{{.State.Error}}')

        if status == 'missing':
            emoji  = '❌'
            detail = 'contenedor no encontrado'
            all_ok = False
        elif status != 'running':
            emoji  = '🔴'
            detail = f'caído — estado: `{status}`'
            if error:
                detail += f'\n    ↳ {error[:120]}'
            all_ok = False
        elif health == 'unhealthy':
            emoji  = '⚠️'
            detail = 'corriendo pero *unhealthy*'
            all_ok = False
        else:
            emoji  = '✅'
            detail = 'running' + (' · healthy' if health == 'healthy' else '')

        lines.append(f'{emoji} *{short}*: {detail}')

    header = '✅ *Todo OK*' if all_ok else '🚨 *Hay problemas*'
    return f'{header}\n\n' + '\n'.join(lines) + f'\n\n🕐 {now}'


TOKEN   = read_env('TELEGRAM_TOKEN')
CHAT_ID = read_env('TELEGRAM_CHAT_ID')
if not TOKEN or not CHAT_ID:
    sys.exit(0)

BASE = f'https://api.telegram.org/bot{TOKEN}'

offset = int(OFFSET_FILE.read_text()) if OFFSET_FILE.exists() else 0

try:
    resp    = requests.get(f'{BASE}/getUpdates', params={'offset': offset, 'timeout': 5}, timeout=10)
    updates = resp.json().get('result', [])
except Exception:
    sys.exit(0)

for upd in updates:
    offset = upd['update_id'] + 1
    msg  = upd.get('message', {})
    text = msg.get('text', '')
    chat = str(msg.get('chat', {}).get('id', ''))

    if text.startswith('/check') and chat == CHAT_ID:
        requests.post(f'{BASE}/sendMessage', json={
            'chat_id': CHAT_ID,
            'text': build_status_message(),
            'parse_mode': 'Markdown'
        }, timeout=10)

OFFSET_FILE.write_text(str(offset))
