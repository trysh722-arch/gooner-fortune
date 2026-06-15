# -*- coding: utf-8 -*-
# dev/index.html = 라이브 index.html 복사 + <base href=../> + [DEV] 타이틀
# 도감(collection.css/js)은 index.html이 직접 참조 → base로 루트에서 로드.
# 테스트 버튼은 collection.js가 '/dev/' 경로를 감지해 dev에서만 표시.
# (P2 베스트11 등 dev 전용 기능은 아래에 bestxi 애드온으로 추가 예정)
import io, os
R = os.path.dirname(os.path.abspath(__file__))
html = io.open(os.path.join(R, '..', 'index.html'), encoding='utf-8').read()
html = html.replace('<head>', '<head>\n<base href="../">', 1)
html = html.replace('<title>오늘의 구너 운세 — COYG</title>',
                    '<title>[DEV] 오늘의 구너 운세 — 도감/스쿼드 테스트</title>', 1)

# dev 전용 애드온(있으면 주입) — 예: bestxi.css / bestxi.js
for css in ['bestxi.css']:
    p = os.path.join(R, css)
    if os.path.exists(p):
        html = html.replace('</head>', '<style>\n' + io.open(p, encoding='utf-8').read() + '\n</style>\n</head>', 1)
for js in ['bestxi.js']:
    p = os.path.join(R, js)
    if os.path.exists(p):
        html = html.replace('</body>', '<script>\n' + io.open(p, encoding='utf-8').read() + '\n</script>\n</body>', 1)

io.open(os.path.join(R, 'index.html'), 'w', encoding='utf-8').write(html)
print('dev built:', len(html), 'chars')
