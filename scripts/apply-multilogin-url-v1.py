from pathlib import Path

OLD='https://script.google.com/macros/s/'
NEW='https://script.google.com/a/*/macros/s/'
FILES=[
    'banyoles-operari/index.html',
    'banyoles-toni/index.html',
    'banyoles-veu-beta/index.html',
    'banyoles-veu-beta-v2/index.html',
    'lloret-operari/index.html',
    'lloret-jaume/index.html',
    'lloret-veu-beta/index.html',
]

changed=[]
for name in FILES:
    p=Path(name)
    s=p.read_text(encoding='utf-8')
    if NEW in s:
        continue
    if OLD not in s:
        raise SystemExit(f'{name}: canonical Apps Script URL not found')
    s=s.replace(OLD,NEW)
    p.write_text(s,encoding='utf-8')
    changed.append(name)

# Force installed PWAs / old browsers to evict cached launcher HTML.
sw=Path('sw.js')
s=sw.read_text(encoding='utf-8')
if "nexus-sece-launcher-v7" not in s:
    if "nexus-sece-launcher-v6" not in s:
        raise SystemExit('sw.js: expected v6 cache marker not found')
    s=s.replace('nexus-sece-launcher-v6','nexus-sece-launcher-v7',1)
    sw.write_text(s,encoding='utf-8')
    changed.append('sw.js')

# Permanent deployment guard in Pages CI.
p=Path('.github/workflows/pages.yml')
s=p.read_text(encoding='utf-8')
marker='          test -f lloret-jaume/manifest.webmanifest\n'
guard='''          test -f lloret-jaume/manifest.webmanifest
          # NEXUS MULTILOGIN URL GUARD V1: never publish the Apps Script URL form
          # that Chrome can rewrite to /macros/u/1/s/... when multiple Google
          # accounts are signed in. All launch targets use /a/*/macros/s/....
          ! grep -R -n --include='*.html' 'https://script.google.com/macros/s/' .
          test "$(grep -R -l --include='*.html' 'https://script.google.com/a/\*/macros/s/' . | wc -l)" -ge 7
          grep -q "u.hash='voiceText='" voice.js
          grep -q "u.hash='voiceText='" voice-hash-v2.js
          ! grep -q "searchParams.set('voiceText'" voice.js voice-hash-v2.js
'''
if 'NEXUS MULTILOGIN URL GUARD V1' not in s:
    if marker not in s:
        raise SystemExit('pages.yml: verify marker not found')
    s=s.replace(marker,guard,1)
    p.write_text(s,encoding='utf-8')
    changed.append('.github/workflows/pages.yml')

# Full static audit of launcher source.
for p in Path('.').rglob('*.html'):
    txt=p.read_text(encoding='utf-8')
    if OLD in txt:
        raise SystemExit(f'vulnerable Apps Script URL remains in {p}')

for name in FILES:
    txt=Path(name).read_text(encoding='utf-8')
    if NEW not in txt:
        raise SystemExit(f'{name}: multi-login-safe URL missing')

print('NEXUS Multi-login URL V1 applied')
for f in changed:
    print('changed:',f)
