# -*- coding: utf-8 -*-
# dev/index.html = 라이브 index.html 복사 + <base> + 도감 애드온(css/js) 주입
import io, os
R = os.path.dirname(os.path.abspath(__file__))
html = io.open(os.path.join(R, '..', 'index.html'), encoding='utf-8').read()
css = io.open(os.path.join(R, 'addon.css'), encoding='utf-8').read()
js = io.open(os.path.join(R, 'addon.js'), encoding='utf-8').read()

# 이미지/상대경로가 ../(루트)에서 풀리도록 base 주입
html = html.replace('<head>', '<head>\n<base href="../">', 1)
# 도감 스타일/스크립트 주입
html = html.replace('</head>', '<style>\n' + css + '\n</style>\n</head>', 1)
html = html.replace('</body>', '<script>\n' + js + '\n</script>\n</body>', 1)
# 테스트 표식
html = html.replace('<title>오늘의 구너 운세 — COYG</title>',
                    '<title>[DEV] 오늘의 구너 운세 — 도감 테스트</title>', 1)

io.open(os.path.join(R, 'index.html'), 'w', encoding='utf-8').write(html)
print('dev built:', len(html), 'chars')
