#!/usr/bin/env python3
import sys, subprocess, pathlib

try:
    import requests
except ImportError:
    sys.exit(0)

OFFSET_FILE = pathlib.Path('/tmp/smartur_tg_offset')
ENV_FILE    = pathlib.Path('/opt/SMARTUR/.env')

def read_env(key):
    try:
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith(key + '='):
                return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return ''

TOKEN   = read_env('TELEGRAM_TOKEN')
CHAT_ID = read_env('TELEGRAM_CHAT_ID')
if not TOKEN or not CHAT_ID:
    sys.exit(0)

BASE = f'https://api.telegram.org/bot{TOKEN}'

offset = int(OFFSET_FILE.read_text()) if OFFSET_FILE.exists() else 0

try:
    resp = requests.get(f'{BASE}/getUpdates', params={'offset': offset, 'timeout': 5}, timeout=10)
    updates = resp.json().get('result', [])
except Exception:
    sys.exit(0)

for upd in updates:
    offset = upd['update_id'] + 1
    msg  = upd.get('message', {})
    text = msg.get('text', '')
    chat = str(msg.get('chat', {}).get('id', ''))

    if text.startswith('/check') and chat == CHAT_ID:
        try:
            out = subprocess.check_output(
                ['docker', 'compose', '-f', '/opt/SMARTUR/docker-compose.yml', 'ps'],
                stderr=subprocess.STDOUT, text=True, timeout=15
            )
        except Exception as e:
            out = f'Error al ejecutar docker compose ps: {e}'

        requests.post(f'{BASE}/sendMessage', json={
            'chat_id': CHAT_ID,
            'text': f'📊 *Estado contenedores SMARTUR*\n```\n{out[:3800]}\n```',
            'parse_mode': 'Markdown'
        }, timeout=10)

OFFSET_FILE.write_text(str(offset))
